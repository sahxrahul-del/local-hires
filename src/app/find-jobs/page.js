"use client";
import { useEffect, useState, Fragment } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { 
  Search, MapPin, Briefcase, Clock, Phone, X, Calendar, 
  Heart, CheckCircle, Loader2, Filter, MessageCircle, BadgeCheck 
} from 'lucide-react'; 
import { nepalLocations, provinces } from '../../lib/nepalLocations'; 
import AdBanner from '../../components/AdBanner';

export default function FindJobs() {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set()); 
  const [appliedJobIds, setAppliedJobIds] = useState(new Set()); 
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // --- SEARCH & FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  
  // --- 3-LEVEL LOCATION FILTERS ---
  const [filterProvince, setFilterProvince] = useState('All Provinces');
  const [filterDistrict, setFilterDistrict] = useState('All Districts');
  const [filterZone, setFilterZone] = useState('All Zones'); 

  // Dynamic Lists
  const [availableDistricts, setAvailableDistricts] = useState([]); 
  const [availableZones, setAvailableZones] = useState([]); 

  // Popup States
  const [selectedJob, setSelectedJob] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const initUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user || null);

        if (user) {
            const { data: saved } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
            if (saved) setSavedJobIds(new Set(saved.map(item => item.job_id)));
        
            const { data: applied } = await supabase.from('applications').select('job_id').eq('user_id', user.id);
            if (applied) setAppliedJobIds(new Set(applied.map(item => item.job_id)));

            const { data: profile } = await supabase.from('profiles').select('province').eq('id', user.id).single();
            if (profile?.province) {
                setFilterProvince(profile.province);
            }
        }
    };
    initUser();
  }, []); 

  // --- 2. LOCATION LOGIC ---
  useEffect(() => {
    if (filterProvince !== 'All Provinces') {
        const provinceData = nepalLocations[filterProvince] || {};
        setAvailableDistricts(Object.keys(provinceData));
        if (!nepalLocations[filterProvince]?.[filterDistrict]) {
             setFilterDistrict('All Districts'); setFilterZone('All Zones'); setAvailableZones([]);
        }
    } else {
        setAvailableDistricts([]); setFilterDistrict('All Districts'); setFilterZone('All Zones'); setAvailableZones([]);
    }
  }, [filterProvince]);

  useEffect(() => {
    if (filterDistrict !== 'All Districts' && filterProvince !== 'All Provinces') {
        const zones = nepalLocations[filterProvince]?.[filterDistrict] || [];
        setAvailableZones(zones);
        setFilterZone('All Zones');
    } else {
        setAvailableZones([]); setFilterZone('All Zones');
    }
  }, [filterDistrict, filterProvince]);

  // --- 3. FETCH JOBS (UPDATED TO FETCH VERIFICATION STATUS) ---
  useEffect(() => {
    const fetchJobs = async () => {
        try {
          setLoading(true);
          
          // 🟢 UPDATED QUERY: We now join 'profiles' to get 'is_verified'
          let query = supabase
            .from('jobs')
            .select('*, profiles!employer_id(is_verified)') 
            .eq('payment_status', 'PAID') 
            .order('created_at', { ascending: false });
    
          if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
          if (filterProvince !== 'All Provinces') query = query.eq('province', filterProvince);
          if (filterDistrict !== 'All Districts') query = query.eq('district', filterDistrict);
          if (filterZone !== 'All Zones') query = query.ilike('location', `%${filterZone}%`);
          if (filterCategory !== 'All Categories') query = query.eq('category', filterCategory);

          const { data, error } = await query;
          if (error) throw error;
          setJobs(data || []);
        } catch (error) {
          console.error('Error fetching jobs:', error);
        } finally {
          setLoading(false);
        }
    };
    fetchJobs();
  }, [supabase, searchTerm, filterProvince, filterDistrict, filterZone, filterCategory]); 

  const toggleSaveJob = async (e, jobId) => {
    e.stopPropagation(); 
    if (!user) { router.push('/login'); return; }

    const isSaved = savedJobIds.has(jobId);
    const newSavedIds = new Set(savedJobIds);

    if (isSaved) {
      await supabase.from('saved_jobs').delete().match({ user_id: user.id, job_id: jobId });
      newSavedIds.delete(jobId);
    } else {
      await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: jobId });
      newSavedIds.add(jobId);
    }
    setSavedJobIds(newSavedIds);
  };

  const handleApplyClick = async (job) => {
    if (!user) { router.push('/login'); return; }

    setSelectedJob(job);
    setLoadingContact(true);
    setContactInfo(null);

    try { await supabase.rpc('increment_job_view', { job_id: job.id }); } catch (err) {}

    if (!appliedJobIds.has(job.id)) {
        await supabase.from('applications').insert({ user_id: user.id, job_id: job.id });
        setAppliedJobIds(prev => new Set(prev).add(job.id));
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('phone, email, full_name, business_name')
            .eq('id', job.employer_id)
            .single();
        if (error) throw error;

        const finalContact = {
            ...data,
            phone: job.contact_phone || data.phone,
            whatsapp: job.whatsapp_number || job.contact_phone || data.phone 
        };
        setContactInfo(finalContact);
    } catch (error) {
        console.error("Error fetching contact info:", error);
    } finally {
        setLoadingContact(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterProvince('All Provinces');
    setFilterDistrict('All Districts');
    setFilterZone('All Zones');
    setFilterCategory('All Categories');
  };

  const parseJobData = (job) => {
    let displaySchedule = "Flexible";
    let displayDescription = job.description || "";
    if (job.work_day_from && job.work_day_to && job.work_hour_start && job.work_hour_end) {
      displaySchedule = `${job.work_day_from} - ${job.work_day_to}, ${job.work_hour_start} - ${job.work_hour_end}`;
    }
    return { ...job, displaySchedule, displayDescription };
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getWhatsappLink = (number) => {
      const cleanNumber = number.replace(/\D/g, ''); 
      const fullNumber = cleanNumber.length === 10 ? `977${cleanNumber}` : cleanNumber;
      return `https://wa.me/${fullNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative font-sans">
      <Navbar />

      {/* --- POPUP MODAL --- */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedJob(null)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-blue-900 p-6 text-white relative shrink-0">
                <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition">
                    <X className="w-6 h-6" />
                </button>
                <div className="pr-8">
                    <h3 className="text-xl font-bold leading-tight mb-1">{selectedJob.title}</h3>
                    
                    {/* Company Name with Verified Tick in Modal */}
                    <div className="flex items-center text-blue-200 text-sm font-medium">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5"/> 
                        {selectedJob.company_name}
                        {selectedJob.profiles?.is_verified && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white border border-blue-400">
                                <BadgeCheck className="w-3 h-3 mr-1" /> VERIFIED
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6 flex items-start animate-in slide-in-from-top-2 shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-green-900 text-sm">Application Sent!</h4>
                    <p className="text-sm text-green-700 mt-1 leading-snug">
                        The employer has been notified. Contact them directly to speed up the process.
                    </p>
                </div>
              </div>

              {loadingContact ? (
                <div className="py-10 text-center text-gray-500 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8 text-blue-600 mb-3" /> 
                    <span className="text-sm font-medium">Fetching contact info...</span>
                </div>
              ) : contactInfo ? (
                <div className="space-y-4 mb-8">
                    {/* PHONE */}
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition group">
                        <div className="bg-blue-50 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                            <Phone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Call Employer</p>
                            <a href={`tel:${contactInfo.phone}`} className="text-lg font-bold text-gray-900 hover:text-blue-700 hover:underline">
                                {contactInfo.phone}
                            </a>
                        </div>
                        <a href={`tel:${contactInfo.phone}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-md">
                            Call
                        </a>
                    </div>

                    {/* WHATSAPP */}
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-green-300 transition group">
                        <div className="bg-green-50 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-6 h-6 text-green-600 fill-current" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">WhatsApp Chat</p>
                            <span className="text-sm font-medium text-gray-600">Start a conversation</span>
                        </div>
                        <a 
                            href={getWhatsappLink(contactInfo.whatsapp)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#25D366] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#20bd5a] transition shadow-md flex items-center"
                        >
                            Chat
                        </a>
                    </div>

                    {/* LOCATION (FIXED) */}
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-red-300 transition group">
                        <div className="bg-red-50 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                            <MapPin className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Work Location</p>
                            
                            {/* Specific Address */}
                            <p className="text-lg font-bold text-gray-900">
                                {selectedJob.location || 'Location provided on contact'}
                            </p>
                            
                            {/* Broader Location */}
                            {selectedJob.district && (
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    {selectedJob.district}, {selectedJob.province}
                                </p>
                            )}
                        </div>
                        
                        {/* Google Maps Button (Corrected Syntax) */}
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${selectedJob.location || ''} ${selectedJob.district || ''} ${selectedJob.province || 'Nepal'}`
                            )}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition shadow-sm border border-red-100 whitespace-nowrap"
                        >
                            Map
                        </a>
                    </div>
                </div>
              ) : (
                <div className="text-red-500 text-center mb-6 bg-red-50 p-4 rounded-xl text-sm font-medium">
                    Contact info temporarily unavailable.
                </div>
              )}

              <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center uppercase tracking-wide">
                    Description
                  </h4>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-5 rounded-2xl border border-gray-100 font-medium">
                    {selectedJob.displayDescription}
                  </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                <button onClick={() => setSelectedJob(null)} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition">
                    Close Details
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <div className="bg-blue-900 text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-10 translate-x-10 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-10 -translate-x-10 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-800 text-blue-200 text-xs font-bold mb-4 border border-blue-700">
                🚀 #1 Job Marketplace in Nepal
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                Find Your Next <span className="text-blue-300">Dream Job</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                Browse thousands of active listings from top local businesses.
            </p>

            {/* --- GLASS FILTER BAR --- */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-3.5 text-blue-200 w-5 h-5 group-hover:text-white transition" />
                    <input 
                      type="text" 
                      placeholder="Search job titles..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-blue-900/50 border border-transparent rounded-xl outline-none text-white placeholder-blue-300 focus:bg-blue-900/70 focus:border-blue-400 transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                    <select value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} className="py-3 px-4 bg-blue-900/50 text-white border border-transparent rounded-xl outline-none text-sm font-bold cursor-pointer hover:bg-blue-900/70 focus:border-blue-400 whitespace-nowrap">
                        <option>All Provinces</option>
                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select 
                        value={filterDistrict} 
                        onChange={(e) => setFilterDistrict(e.target.value)} 
                        className="py-3 px-4 bg-blue-900/50 text-white border border-transparent rounded-xl outline-none text-sm font-bold cursor-pointer hover:bg-blue-900/70 focus:border-blue-400 whitespace-nowrap disabled:opacity-50"
                        disabled={filterProvince === 'All Provinces'}
                    >
                        <option>All Districts</option>
                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="py-3 px-4 bg-blue-900/50 text-white border border-transparent rounded-xl outline-none text-sm font-bold cursor-pointer hover:bg-blue-900/70 focus:border-blue-400 whitespace-nowrap">
                        <option>All Categories</option>
                        <option>Retail</option>
                        <option>Hospitality</option>
                        <option>Labor</option>
                        <option>Office</option>
                        <option>Education</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      {/* --- JOBS GRID --- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 relative z-20 pb-20">
        {loading ? (
             <div className="flex justify-center py-20 bg-white rounded-3xl shadow-xl min-h-[300px] items-center">
                 <div className="text-center">
                    <Loader2 className="animate-spin w-12 h-12 text-blue-900 mx-auto mb-4"/>
                    <p className="text-gray-500 font-medium">Finding perfect jobs...</p>
                 </div>
             </div>
        ) : jobs.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found here</h3>
                <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">Try broadening your search or changing filters.</p>
                <button onClick={clearFilters} className="text-white font-bold bg-blue-900 px-8 py-3 rounded-xl hover:bg-blue-800 transition shadow-lg">
                    Clear Filters
                </button>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {jobs.map((rawJob, index) => {
               const job = parseJobData(rawJob);
               const isSaved = savedJobIds.has(job.id);
               const isApplied = appliedJobIds.has(job.id); 

               return (
                <Fragment key={job.id}>
                    <div 
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group cursor-pointer" 
                        onClick={() => handleApplyClick(job)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wide border border-blue-100">
                                {job.category || 'General'}
                            </span>
                            <button 
                                onClick={(e) => toggleSaveJob(e, job.id)}
                                className="p-2 -mr-2 -mt-2 rounded-full hover:bg-gray-50 transition z-10"
                            >
                                <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} />
                            </button>
                        </div>

                        <h3 className="text-xl font-extrabold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors line-clamp-1">
                            {job.title}
                        </h3>
                        
                        {/* 🟢 COMPANY NAME + VERIFIED TICK */}
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-5">
                            <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />
                            {job.company_name || 'Hiring Business'}
                            
                            {/* THE GREEN TICK LOGIC */}
                            {job.profiles?.is_verified && (
                                <span title="Verified Business">
                                    <BadgeCheck className="w-4 h-4 text-blue-500 ml-1.5 fill-blue-100" />
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="flex items-center text-gray-700 font-bold bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                    <span className="text-green-600 mr-1">Rs.</span>
                                    {job.pay_rate}
                                </span>
                                <span className="flex items-center text-gray-500 font-medium pt-1">
                                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {job.district ? job.district : job.location.split(',')[0]}
                                </span>
                            </div>
                            <div className="flex items-center text-gray-500 text-sm font-medium">
                                <Clock className="w-4 h-4 mr-1.5 text-orange-400" />
                                {job.displaySchedule}
                            </div>
                        </div>

                        <div className="mt-auto flex justify-between items-center pt-5 border-t border-gray-50">
                            <span className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                                {timeAgo(job.created_at)}
                            </span>
                            <button className={`px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center ${
                                isApplied 
                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                : 'bg-blue-900 text-white hover:bg-blue-800 shadow-blue-900/20'
                            }`}>
                                {isApplied ? <><CheckCircle className="w-4 h-4 mr-2" /> Applied</> : "Apply Now"}
                            </button>
                        </div>
                    </div>

                    {(index + 1) % 8 === 0 && (
                        <div className="col-span-1 md:col-span-2 my-4">
                            <AdBanner 
                                dataAdSlot="1234567890" 
                                dataAdFormat="fluid" 
                                dataLayoutKey="-fb+5w+4e-db+86"
                            />
                        </div>
                    )}
                </Fragment>
               );
            })}
            </div>
        )}

        <div className="mt-16 mb-8">
            <AdBanner 
                dataAdSlot="1234567890" 
                dataAdFormat="auto" 
                dataFullWidthResponsive="true" 
            />
        </div>
      </main>
    </div>
  );
}