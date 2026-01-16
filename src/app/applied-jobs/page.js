"use client";
import { useEffect, useState, Fragment } from 'react';
import { createBrowserClient } from '@supabase/ssr'; 
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { 
  MapPin, Briefcase, Clock, Calendar, CheckCircle, 
  Phone, X, Loader2, ArrowRight, MessageCircle 
} from 'lucide-react';
import Link from 'next/link';
import AdBanner from '../../components/AdBanner';

export default function AppliedJobs() {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState([]);

  // --- POPUP STATES ---
  const [selectedJob, setSelectedJob] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
  
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          jobs (
            id,
            employer_id,
            title,
            company_name,
            location,
            province,    
            district,    
            pay_rate,
            category,
            description,
            work_day_from,
            work_day_to,
            work_hour_start,
            work_hour_end,
            contact_phone,
            whatsapp_number
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
  
      if (!error && data) {
        setAppliedJobs(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [router, supabase]);

  // --- HELPER: Parse Job Data ---
  const parseJobData = (job) => {
    let displaySchedule = "Flexible";
    let displayDescription = job.description || "";

    if (job.work_day_from && job.work_day_to && job.work_hour_start && job.work_hour_end) {
      displaySchedule = `${job.work_day_from} - ${job.work_day_to}, ${job.work_hour_start} - ${job.work_hour_end}`;
    }

    return { ...job, displaySchedule, displayDescription };
  };

  const getWhatsappLink = (number) => {
      const cleanNumber = number.replace(/\D/g, ''); 
      const fullNumber = cleanNumber.length === 10 ? `977${cleanNumber}` : cleanNumber;
      return `https://wa.me/${fullNumber}`;
  };

  // --- HANDLE VIEW CLICK ---
  const handleViewClick = async (rawJob) => {
    const job = parseJobData(rawJob);
    setSelectedJob(job);
    setLoadingContact(true);
    setContactInfo(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone, email, full_name, business_name')
        .eq('id', job.employer_id)
        .single();

      if (error) throw error;

      // Combine Profile info with Job specific info (like specific whatsapp number)
      const finalContact = {
          ...data,
          phone: job.contact_phone || data.phone,
          whatsapp: job.whatsapp_number || job.contact_phone || data.phone 
      };

      setContactInfo(finalContact);
    } catch (error) {
      console.error(error); 
    } finally {
      setLoadingContact(false);
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative font-sans">
      <Navbar />

      {/* --- POPUP MODAL (New Design) --- */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedJob(null)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-blue-900 p-6 text-white relative shrink-0">
                <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition">
                    <X className="w-6 h-6" />
                </button>
                <div className="pr-8">
                    <h3 className="text-xl font-bold leading-tight mb-1">{selectedJob.title}</h3>
                    <p className="text-blue-200 text-sm font-medium flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5"/> {selectedJob.company_name}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6 flex items-center shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800 font-bold">
                  You applied to this job on {timeAgo(selectedJob.created_at)}
                </p>
              </div>

              {loadingContact ? (
                <div className="py-10 text-center text-gray-500 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8 text-blue-600 mb-3" /> 
                    <span className="text-sm font-medium">Fetching details...</span>
                </div>
              ) : contactInfo ? (
                <div className="space-y-4 mb-8">
                    
                    {/* PHONE */}
                    <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition group">
                        <div className="bg-blue-50 p-3 rounded-full mr-4">
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
                        <div className="bg-green-50 p-3 rounded-full mr-4">
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

                    {/* LOCATION (Now Added) */}
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
                <h4 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wide">Description</h4>
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
      <div className="bg-blue-900 text-white pt-12 pb-20 px-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-10 translate-x-10 animate-blob"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-10 -translate-x-10 animate-blob animation-delay-2000"></div>
         
         <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Application History</h1>
                <p className="text-blue-100">Track all the jobs you have contacted.</p>
            </div>
            <Link href="/find-jobs">
                <button className="mt-6 md:mt-0 bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg">
                    Browse More Jobs
                </button>
            </Link>
         </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg flex flex-col items-center">
             <Loader2 className="animate-spin w-10 h-10 text-blue-600 mb-4"/>
             <span className="text-gray-500 font-medium">Loading your history...</span>
          </div>
        ) : appliedJobs.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-blue-300" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">No applications yet</h3>
             <p className="text-gray-500 mb-8 max-w-sm mx-auto">When you view contact details for a job, it will automatically appear here.</p>
             <Link href="/find-jobs">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
                   Find a Job
                </button>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {appliedJobs.map((item, index) => {
              const job = item.jobs;
              if (!job) return null;

              return (
                <Fragment key={item.id}>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative group">
                    
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-green-100 text-green-800 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wide border border-green-200 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" /> Contacted
                            </span>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center">
                                <Calendar className="w-3 h-3 mr-1" /> {timeAgo(item.created_at)}
                            </span>
                        </div>

                        <h3 className="text-xl font-extrabold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-5">
                            <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />
                            {job.company_name}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center text-gray-500 text-sm font-medium">
                                <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                                {job.district ? `${job.district}, ${job.province}` : job.location}
                            </div>
                        </div>

                        {/* VIEW AGAIN BUTTON */}
                        <div className="mt-auto pt-4 border-t border-gray-50">
                            <button 
                            onClick={() => handleViewClick(job)}
                            className="w-full flex items-center justify-center text-blue-900 font-bold text-sm bg-blue-50 py-3 rounded-xl hover:bg-blue-100 transition"
                            >
                            View Contact Details <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>

                    {/* --- IN-FEED AD (Every 8 items) --- */}
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

        {/* --- BOTTOM AD --- */}
        <div className="mt-12 mb-8">
            <AdBanner 
                dataAdSlot="1234567890" 
                dataAdFormat="auto" 
                dataFullWidthResponsive="true" 
            />
        </div>
      </div>
    </div>
  );
}