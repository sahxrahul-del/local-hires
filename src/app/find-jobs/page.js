"use client";
import { useEffect, useState, Fragment } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Search, MapPin, Briefcase, Clock, Phone, X, Calendar, Heart, CheckCircle, Loader2, Filter } from 'lucide-react'; 
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

  // --- 1. INITIAL LOAD (Runs Once) ---
  // This fetches the user and sets the default filter ONE TIME only.
  useEffect(() => {
    const initUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user || null);

        if (user) {
            // Fetch Saved/Applied IDs
            const { data: saved } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
            if (saved) setSavedJobIds(new Set(saved.map(item => item.job_id)));
        
            const { data: applied } = await supabase.from('applications').select('job_id').eq('user_id', user.id);
            if (applied) setAppliedJobIds(new Set(applied.map(item => item.job_id)));

            // Set Location Default (ONLY ONCE)
            const { data: profile } = await supabase.from('profiles').select('province').eq('id', user.id).single();
            if (profile?.province) {
                setFilterProvince(profile.province);
            }
        }
    };
    initUser();
  }, []); // Empty dependency array means this NEVER runs again after the first load.

  // --- 2. SMART LOCATION LOGIC ---
  useEffect(() => {
    if (filterProvince !== 'All Provinces') {
        const provinceData = nepalLocations[filterProvince] || {};
        setAvailableDistricts(Object.keys(provinceData));
        // Only reset district if the current one doesn't belong to the new province
        if (!nepalLocations[filterProvince]?.[filterDistrict]) {
             setFilterDistrict('All Districts');
             setFilterZone('All Zones');
             setAvailableZones([]);
        }
    } else {
        setAvailableDistricts([]);
        setFilterDistrict('All Districts');
        setFilterZone('All Zones');
        setAvailableZones([]);
    }
  }, [filterProvince]);

  useEffect(() => {
    if (filterDistrict !== 'All Districts' && filterProvince !== 'All Provinces') {
        const zones = nepalLocations[filterProvince]?.[filterDistrict] || [];
        setAvailableZones(zones);
        setFilterZone('All Zones');
    } else {
        setAvailableZones([]);
        setFilterZone('All Zones');
    }
  }, [filterDistrict, filterProvince]);

  // --- 3. FETCH JOBS (Runs when filters change) ---
  useEffect(() => {
    const fetchJobs = async () => {
        try {
          setLoading(true);

          // 1. Build the Query
          let query = supabase
            .from('jobs')
            .select('*')
            .eq('payment_status', 'PAID') // Only show paid/approved jobs
            .order('created_at', { ascending: false });
    
          // 2. Apply Server-Side Filters
          if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
          }
          if (filterProvince !== 'All Provinces') {
            query = query.eq('province', filterProvince);
          }
          if (filterDistrict !== 'All Districts') {
            query = query.eq('district', filterDistrict);
          }
          if (filterZone !== 'All Zones') {
            query = query.ilike('location', `%${filterZone}%`);
          }
          if (filterCategory !== 'All Categories') {
            query = query.eq('category', filterCategory);
          }

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
  }, [supabase, searchTerm, filterProvince, filterDistrict, filterZone, filterCategory]); // Runs whenever you change a filter


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
            phone: job.contact_phone || data.phone 
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
    } else if (displayDescription.includes("Schedule:")) {
       const parts = displayDescription.split("Schedule:");
       if (parts.length > 1) {
         displaySchedule = parts[1].split('\n')[0].trim();
       }
    }

    if (displayDescription.includes("Schedule:")) {
       const parts = displayDescription.split("Schedule:");
       if (parts.length > 1) {
         const scheduleLine = "Schedule:" + parts[1].split('\n')[0];
         displayDescription = displayDescription.replace(scheduleLine, "").trim();
       }
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navbar />

      {/* --- POPUP MODAL --- */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-gray-100 flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Apply to {selectedJob.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">at {selectedJob.company_name}</p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 transition">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-green-50 border border-green-100 p-4 rounded-lg mb-6 flex items-start animate-in slide-in-from-top-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-green-800 text-sm">Application Recorded!</h4>
                    <p className="text-sm text-green-700 mt-1">
                        The employer has been notified. Please contact them directly below.
                    </p>
                </div>
              </div>

              {loadingContact ? (
                <div className="py-8 text-center text-gray-500 flex justify-center items-center">
                    <Loader2 className="animate-spin w-5 h-5 mr-2" /> Fetching contact info...
                </div>
              ) : contactInfo ? (
                <div className="space-y-4 mb-8">
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                        <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                            <Phone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Call Employer</p>
                            <a href={`tel:${contactInfo.phone}`} className="text-xl font-bold text-gray-900 hover:text-blue-600 hover:underline">
                                {contactInfo.phone}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="bg-gray-200 p-3 rounded-full mr-4">
                            <MapPin className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                            <p className="text-gray-900 font-bold">
                                {selectedJob.district ? `${selectedJob.district}, ${selectedJob.province}` : selectedJob.location}
                            </p>
                        </div>
                    </div>
                </div>
              ) : (
                <div className="text-red-500 text-center mb-6">Contact info not available.</div>
              )}

              <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-bold text-base text-gray-900 mb-3 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" /> Job Description
                  </h4>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {selectedJob.displayDescription}
                  </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                <button onClick={() => setSelectedJob(null)} className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-100 transition">
                    Close
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER WITH SMART FILTERS --- */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Browse Open Positions</h1>
            <p className="text-gray-500 text-lg">Find the perfect role in your local community.</p>
        </div>

        {/* --- AD BANNER 1: TOP BANNER --- */}
        <div className="mb-8">
            <AdBanner 
                dataAdSlot="1234567890" 
                dataAdFormat="horizontal" 
                dataFullWidthResponsive="true" 
            />
        </div>

        {/* --- MAIN SEARCH BAR --- */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 mb-4">
            
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search job titles..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900 font-medium focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                
                {/* 1. PROVINCE */}
                <select 
                    value={filterProvince} 
                    onChange={(e) => setFilterProvince(e.target.value)} 
                    className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                >
                    <option>All Provinces</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                {/* 2. DISTRICT */}
                <select 
                    value={filterDistrict} 
                    onChange={(e) => setFilterDistrict(e.target.value)} 
                    className={`py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap ${filterProvince === 'All Provinces' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={filterProvince === 'All Provinces'}
                >
                    <option>All Districts</option>
                    {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* 3. CITY ZONE (NEW) */}
                <select 
                    value={filterZone} 
                    onChange={(e) => setFilterZone(e.target.value)} 
                    className={`py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap ${filterDistrict === 'All Districts' || availableZones.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={filterDistrict === 'All Districts' || availableZones.length === 0}
                >
                    <option>All Zones</option>
                    {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>

                {/* Category */}
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-100 whitespace-nowrap">
                    <option>All Categories</option>
                    <option>Retail</option>
                    <option>Hospitality</option>
                    <option>Labor</option>
                    <option>Office</option>
                    <option>Education</option>
                </select>
            </div>
        </div>

        {/* Active Filters Summary */}
        {(filterProvince !== 'All Provinces' || filterCategory !== 'All Categories' || searchTerm) && (
             <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 mb-6">
                <Filter className="w-4 h-4" />
                <span>Filters active:</span>
                {filterProvince !== 'All Provinces' && <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{filterProvince}</span>}
                {filterDistrict !== 'All Districts' && <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{filterDistrict}</span>}
                {filterZone !== 'All Zones' && <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{filterZone}</span>}
                <button onClick={clearFilters} className="text-red-500 hover:underline font-bold ml-2">Clear All</button>
             </div>
        )}
      </div>

      {/* --- JOBS GRID --- */}
      <main className="max-w-6xl mx-auto px-6">
        {loading ? (
             <div className="text-center py-20 text-gray-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No jobs found in this area</h3>
                <p className="text-gray-500 font-medium mb-6">Try changing the Province/District/Zone filters.</p>
                <button onClick={clearFilters} className="text-blue-900 font-bold bg-blue-50 px-6 py-3 rounded-lg hover:bg-blue-100 transition">
                    View All Jobs
                </button>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((rawJob, index) => {
               const job = parseJobData(rawJob);
               const isSaved = savedJobIds.has(job.id);
               const isApplied = appliedJobIds.has(job.id); 

               return (
                <Fragment key={job.id}>
                    {/* JOB CARD */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative group">
                    
                        <button 
                        onClick={(e) => toggleSaveJob(e, job.id)}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition z-10"
                        >
                        <Heart className={`w-6 h-6 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} />
                        </button>

                        <div className="flex justify-between items-start mb-3 pr-10">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                                {job.category || 'General'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-5">
                            <Briefcase className="w-4 h-4 mr-2" />
                            {job.company_name || 'Hiring Business'}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="flex items-center text-gray-600 font-medium">
                                    <MapPin className="w-4 h-4 mr-1.5 text-emerald-500" />
                                    {job.district ? `${job.district}, ` : ''}{job.location.split(',')[0]}
                                </span>
                                
                                <span className="flex items-center text-gray-600 font-bold">
                                    <span className="text-emerald-600 mr-1 text-base">Rs.</span>
                                    {job.pay_rate}
                                </span>
                            </div>
                            
                            <div className="flex items-center text-gray-600 text-sm font-medium">
                                <Clock className="w-4 h-4 mr-1.5 text-orange-500" />
                                {job.displaySchedule}
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                            {job.displayDescription}
                        </p>

                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                            <span className="flex items-center text-xs text-gray-400 font-medium">
                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                Posted {timeAgo(job.created_at)}
                            </span>

                            <button 
                                onClick={() => handleApplyClick(job)}
                                className={`px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm flex items-center ${
                                    isApplied 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                                {isApplied ? (
                                    <> <CheckCircle className="w-4 h-4 mr-2" /> View Again </>
                                ) : (
                                    "Apply Now"
                                )}
                            </button>
                        </div>

                    </div>

                    {/* --- AD BANNER 2: IN-FEED AD (EVERY 6 JOBS) --- */}
                    {(index + 1) % 6 === 0 && (
                        <div className="col-span-1 md:col-span-2 my-4">
                            <AdBanner 
                                dataAdSlot="1234567890" // Replace with In-Feed Ad ID
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

        {/* --- AD BANNER 3: BOTTOM BANNER --- */}
        <div className="mt-12 mb-8">
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