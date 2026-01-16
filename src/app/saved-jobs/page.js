"use client";
import { useEffect, useState, Fragment } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { 
  MapPin, Briefcase, Clock, Calendar, HeartOff, 
  Phone, X, Loader2, CheckCircle, MessageCircle 
} from 'lucide-react';
import Link from 'next/link';
import AdBanner from '../../components/AdBanner';

export default function SavedJobs() {
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set()); 

  // --- POPUP STATES ---
  const [selectedJob, setSelectedJob] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch Saved Jobs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_jobs')
        .select(`
          id,
          jobs (
            id,
            employer_id,
            title,
            company_name,
            location,
            province,    
            district,    
            pay_rate,
            job_type,
            category,
            created_at,
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

      if (savedError) console.error('Error fetching saved:', savedError);
      else setSavedJobs(savedData || []);

      // Fetch Applied Jobs
      const { data: appliedData } = await supabase
        .from('applications')
        .select('job_id')
        .eq('user_id', user.id);

      if (appliedData) {
        setAppliedJobIds(new Set(appliedData.map(item => item.job_id)));
      }

      setLoading(false);
    };
    fetchUserData();
  }, [router, supabase]);

  const removeJob = async (savedId) => {
    setSavedJobs(savedJobs.filter(item => item.id !== savedId));
    await supabase.from('saved_jobs').delete().eq('id', savedId);
  };

  const parseJobData = (job) => {
    let displaySchedule = "Flexible";
    let displayDescription = job.description || "";

    if (job.work_day_from && job.work_day_to && job.work_hour_start && job.work_hour_end) {
      displaySchedule = `${job.work_day_from} - ${job.work_day_to}, ${job.work_hour_start} - ${job.work_hour_end}`;
    } 
    else if (displayDescription.includes("Schedule:")) {
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

   const getWhatsappLink = (number) => {
      const cleanNumber = number.replace(/\D/g, ''); 
      const fullNumber = cleanNumber.length === 10 ? `977${cleanNumber}` : cleanNumber;
      return `https://wa.me/${fullNumber}`;
   };
 
   // --- HANDLE APPLY CLICK ---
   const handleApplyClick = async (rawJob) => {
     const job = parseJobData(rawJob);
     
     setSelectedJob(job);
     setLoadingContact(true);
     setContactInfo(null);
 
     try {
       await supabase.rpc('increment_job_view', { job_id: job.id }); // Using correct RPC name
     } catch (e) { console.error(e) }
 
     if (user && !appliedJobIds.has(job.id)) {
         await supabase.from('applications').insert({ user_id: user.id, job_id: job.id });
         const newApplied = new Set(appliedJobIds);
         newApplied.add(job.id);
         setAppliedJobIds(newApplied);
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
       console.error(error); 
     } finally {
       setLoadingContact(false);
     }
   };
 
   const timeAgo = (dateString) => {
     if (!dateString) return 'Just now';
     const date = new Date(dateString);
     const diffInDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
     return diffInDays === 0 ? 'Today' : `${diffInDays}d ago`;
   };
 
   return (
     <div className="min-h-screen bg-gray-50 pb-20 relative font-sans">
       <Navbar />
 
       {/* --- POPUP MODAL --- */}
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
                    <h3 className="text-xl font-bold leading-tight mb-1">Apply to {selectedJob.title}</h3>
                    <p className="text-blue-200 text-sm font-medium flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5"/> {selectedJob.company_name}
                    </p>
                </div>
             </div>

             <div className="p-6 overflow-y-auto custom-scrollbar">
               <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6 flex items-start shadow-sm">
                 <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                 <div>
                    <h4 className="font-bold text-green-900 text-sm">Application Sent!</h4>
                    <p className="text-sm text-green-700 mt-1 leading-snug">
                        The employer has been notified. Contact them directly below.
                    </p>
                 </div>
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

                     {/* LOCATION */}
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
                 <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Saved Jobs</h1>
                 <p className="text-blue-100">Review and apply to your bookmarked opportunities.</p>
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
              <span className="text-gray-500 font-medium">Loading saved jobs...</span>
           </div>
         ) : savedJobs.length === 0 ? (
           <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <HeartOff className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No saved jobs yet</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">Click the heart icon on any job to save it here for later.</p>
              <Link href="/find-jobs">
                 <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
                    Find a Job
                 </button>
              </Link>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
             {savedJobs.map((item, index) => {
               const rawJob = item.jobs; 
               if (!rawJob) return null; 
 
               const job = parseJobData(rawJob);
               const isApplied = appliedJobIds.has(job.id); 
 
               return (
                 <Fragment key={item.id}>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        
                        <button 
                        onClick={() => removeJob(item.id)}
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition z-10"
                        title="Remove from saved"
                        >
                        <HeartOff className="w-5 h-5" />
                        </button>
    
                        <div className="mb-4">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wide border border-blue-100">
                            {job.category || 'General'}
                        </span>
                        </div>
    
                        <h3 className="text-xl font-extrabold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-5">
                            <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />
                            {job.company_name}
                        </div>
    
                        <div className="space-y-3 mb-6">
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="flex items-center text-gray-700 font-bold bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                    <span className="text-green-600 mr-1">Rs.</span>
                                    {job.pay_rate}
                                </span>
                                <span className="flex items-center text-gray-500 font-medium pt-1">
                                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {job.district ? `${job.district}, ${job.province}` : job.location}
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
    
                            <button 
                                onClick={() => handleApplyClick(rawJob)}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-sm flex items-center ${
                                    isApplied 
                                    ? 'bg-green-50 text-green-700 border border-green-100' 
                                    : 'bg-blue-900 text-white hover:bg-blue-800 shadow-blue-900/20'
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