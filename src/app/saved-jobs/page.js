"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr'; // <--- THE UPGRADE
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { MapPin, Briefcase, Clock, Calendar, HeartOff, Phone, X, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SavedJobs() {
  const router = useRouter();
  
  // 1. Initialize New Client (Reads the Login Cookie)
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
      // 2. Authenticate using the Cookie
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 3. Fetch Saved Jobs
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
            work_hour_end
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError) console.error('Error fetching saved:', savedError);
      else setSavedJobs(savedData || []);

      // 4. Fetch Applied Jobs
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
    // Optimistic UI update
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
 
   // --- HANDLE APPLY CLICK ---
   const handleApplyClick = async (rawJob) => {
     // Parse again just in case
     const job = parseJobData(rawJob);
     
     // 1. Show Contact Popup
     setSelectedJob(job);
     setLoadingContact(true);
     setContactInfo(null);
 
     // Increment Views
     try {
       await supabase.rpc('increment_views', { job_id: job.id });
     } catch (e) { console.error(e) }
 
     // 2. Record Application
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
       setContactInfo(data);
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
     return diffInDays === 0 ? 'Today' : `${diffInDays} days ago`;
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
                 <h3 className="text-xl font-bold text-gray-900">Apply for {selectedJob.title}</h3>
                 <p className="text-gray-500 text-sm mt-1">at {selectedJob.company_name}</p>
               </div>
               <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 transition">
                 <X className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6 overflow-y-auto custom-scrollbar">
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
                 <p className="text-sm text-blue-900">
                   Contact <strong>{selectedJob.company_name}</strong> directly to apply.
                 </p>
               </div>
               {loadingContact ? (
                 <div className="py-8 text-center text-gray-500 flex justify-center items-center">
                     <Loader2 className="animate-spin w-5 h-5 mr-2" /> Fetching details...
                 </div>
               ) : contactInfo ? (
                 <div className="space-y-4 mb-8">
                     <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                         <div className="bg-green-100 p-3 rounded-full mr-4">
                             <Phone className="w-6 h-6 text-green-600" />
                         </div>
                         <div>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Call Employer</p>
                             <a href={`tel:${contactInfo.phone}`} className="text-xl font-bold text-gray-900 hover:underline">
                                 {contactInfo.phone}
                             </a>
                         </div>
                     </div>
                     {/* Location Display */}
                     <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                         <div className="bg-gray-200 p-3 rounded-full mr-4">
                             <MapPin className="w-6 h-6 text-gray-600" />
                         </div>
                         <div>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                             <p className="text-gray-900 font-bold">
                                 {selectedJob.district ? `${selectedJob.district}, ${selectedJob.province}` : selectedJob.location}
                             </p>
                             {selectedJob.district && <p className="text-sm text-gray-500">{selectedJob.location}</p>}
                         </div>
                     </div>
                 </div>
               ) : (
                 <div className="text-red-500 text-center mb-6">Contact info not available.</div>
               )}
               <div className="border-t border-gray-100 pt-6">
                 <h4 className="font-bold text-base text-gray-900 mb-3">Job Description</h4>
                 <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
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
 
       {/* --- MAIN CONTENT --- */}
       <div className="max-w-6xl mx-auto px-6 pt-12">
         <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Saved Jobs</h1>
         <p className="text-gray-500 mb-8">Jobs you have bookmarked for later.</p>
 
         {loading ? (
           <div className="text-center py-20 text-gray-400">Loading your list...</div>
         ) : savedJobs.length === 0 ? (
           <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <HeartOff className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No saved jobs yet</h3>
              <p className="text-gray-500 mb-6">Start browsing to find your next opportunity.</p>
              <Link href="/find-jobs">
                 <button className="bg-blue-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition">
                    Browse Jobs
                 </button>
              </Link>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {savedJobs.map((item) => {
               const rawJob = item.jobs; 
               if (!rawJob) return null; 
 
               const job = parseJobData(rawJob);
               const isApplied = appliedJobIds.has(job.id); 
 
               return (
                 <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col relative group hover:shadow-md transition">
                   <button 
                     onClick={() => removeJob(item.id)}
                     className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                     title="Remove from saved"
                   >
                     <HeartOff className="w-5 h-5" />
                   </button>
 
                   <div className="mb-4">
                     <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                         {job.category}
                     </span>
                   </div>
 
                   <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                   <div className="flex items-center text-gray-500 text-sm font-medium mb-4">
                       <Briefcase className="w-4 h-4 mr-2" />
                       {job.company_name}
                   </div>
 
                   <div className="space-y-2 mb-6 text-sm text-gray-600">
                       {/* UPDATED LOCATION DISPLAY ON CARD */}
                       <div className="flex items-center">
                           <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                           {job.district ? `${job.district}, ${job.province}` : job.location}
                       </div>
                       <div className="flex items-center font-medium">
                           <span className="text-emerald-600 mr-2 text-lg">Rs.</span>
                           {job.pay_rate}
                       </div>
                       <div className="flex items-center">
                           <Clock className="w-4 h-4 mr-2 text-orange-500" />
                           {job.displaySchedule}
                       </div>
                   </div>
 
                   <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                       <span className="flex items-center text-xs text-gray-400 font-medium">
                           <Calendar className="w-3.5 h-3.5 mr-1.5" />
                           Posted {timeAgo(job.created_at)}
                       </span>
 
                       <button 
                         onClick={() => handleApplyClick(rawJob)}
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
               );
             })}
           </div>
         )}
       </div>
     </div>
   );
 }