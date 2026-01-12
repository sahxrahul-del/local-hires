"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  PlusCircle, Eye, Trash2, MapPin, AlertTriangle, X, 
  Calendar, List, Mail, Pencil, TrendingUp, Clock, CheckCircle 
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) { 
          router.push('/login'); 
          return; 
        }
  
        // 1. Get Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', user.id)
          .maybeSingle();
        
        // 2. Check Role
        const role = profileData?.role || user.user_metadata?.role;
        if (role !== 'business' && role !== 'admin') { 
            router.push('/find-jobs'); 
            return; 
        }
  
        setProfile({
            ...profileData,
            avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url,
            full_name: profileData?.full_name || user.user_metadata?.full_name,
            email: user.email 
        }); 
  
        // 3. Fetch Jobs (Now fetching payment_status too)
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', user.id)
          .order('created_at', { ascending: false });
        
        setJobs(jobsData || []);
  
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [router, supabase]);

  // Helper to clean up description text
  const parseJobData = (job) => {
    let displaySchedule = "";
    let displayDescription = job.description || "";

    // Try to extract schedule if stored in specific columns
    if (job.work_day_from && job.work_day_to) {
      displaySchedule = `${job.work_day_from} - ${job.work_day_to}`;
      if (job.work_hour_start) displaySchedule += `, ${job.work_hour_start} - ${job.work_hour_end}`;
    } 
    // Fallback: Try to extract from text description (legacy support)
    else if (displayDescription.includes("Schedule:")) {
       const parts = displayDescription.split("Schedule:");
       if (parts.length > 1) displaySchedule = parts[1].split('\n')[0].trim();
       // Remove schedule line from description to avoid duplicate showing
       const scheduleLine = "Schedule:" + parts[1].split('\n')[0];
       displayDescription = displayDescription.replace(scheduleLine, "").trim();
    }

    return { ...job, displaySchedule, displayDescription };
  };

  const totalViews = jobs.reduce((acc, job) => acc + (job.views || 0), 0);
  const activeJobsCount = jobs.filter(j => j.payment_status === 'PAID').length;

  const promptDelete = (jobId) => {
    setJobToDelete(jobId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete);
      if (error) { alert("Database Error: " + error.message); return; }
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete));
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (error) { alert("Error deleting job: " + error.message); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative pb-20">
      <Navbar />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <button onClick={() => setShowDeleteModal(false)} className="hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Job Posting?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200 shrink-0">
                 {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-2xl">{profile?.business_name?.[0]?.toUpperCase() || "B"}</div>
                 )}
            </div>
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Welcome, {profile?.business_name || profile?.full_name?.split(' ')[0]}</h1>
                <p className="text-gray-500 font-medium">
                    {profile?.role === 'admin' ? 'Super Admin Dashboard' : 'Manage your business & job postings'}
                </p>
            </div>
          </div>
          <Link href="/post-job">
            <button className="flex items-center bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5">
              <PlusCircle className="w-5 h-5 mr-2" /> Post a New Job
            </button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Active Jobs Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Live Jobs</p>
                <h2 className="text-4xl font-extrabold text-gray-900">{activeJobsCount}</h2>
                <p className="text-xs text-blue-600 font-medium mt-1">Visible to public</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
                <CheckCircle className="text-blue-900 w-8 h-8" />
            </div>
          </div>

          {/* Total Views Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-green-200 transition-colors">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Views</p>
                <h2 className="text-4xl font-extrabold text-gray-900">{totalViews}</h2>
                <p className="text-xs text-green-600 font-medium mt-1">Candidate interest</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl group-hover:bg-green-100 transition-colors">
                <TrendingUp className="text-green-600 w-8 h-8" />
            </div>
          </div>

          {/* Account Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-orange-200 transition-colors">
            <div className="overflow-hidden">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Account</p>
                <h2 className="text-lg font-bold text-gray-900 truncate pr-2" title={profile?.email}>{profile?.email}</h2>
                <p className="text-xs text-orange-600 font-medium mt-1 capitalize">{profile?.role} Account</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl shrink-0 group-hover:bg-orange-100 transition-colors">
                <Mail className="text-orange-600 w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Job Listings Header */}
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
            Your Job Listings <span className="ml-3 bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">{jobs.length}</span>
        </h2>
        
        {/* Job Cards */}
        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No active job postings</h3>
            <p className="text-gray-500 mb-6">Create a job listing to start finding candidates.</p>
            <Link href="/post-job"><button className="text-blue-900 font-bold hover:underline">Create first job →</button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {jobs.map((rawJob) => {
              const job = parseJobData(rawJob);
              const isPaid = job.payment_status === 'PAID';
              // If status is null/undefined, we treat as PAID for backward compatibility with old jobs
              const isEffectivePaid = isPaid || !job.payment_status; 

              return (
                <div key={job.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300 flex flex-col h-full relative group ${isEffectivePaid ? 'border-gray-200 hover:shadow-md hover:-translate-y-1' : 'border-orange-200 bg-orange-50/30'}`}>
                  
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-2">
                        {!isEffectivePaid && (
                           <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700 mb-2">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Pending Payment
                           </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{job.title}</h3>
                        <div className="flex items-center text-xs text-gray-400 font-medium mt-1">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            Posted {new Date(job.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        {isEffectivePaid && (
                             <Link href={`/edit-job/${job.id}`}>
                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" title="Edit Job">
                                    <Pencil className="w-5 h-5" />
                                </button>
                             </Link>
                        )}
                        <button onClick={() => promptDelete(job.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Delete Job">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
                    <span className="flex items-center bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold">
                        <MapPin className="w-3 h-3 mr-1" /> {job.location}
                    </span>
                    <span className="flex items-center bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                        Rs. {job.pay_rate}
                    </span>
                    {job.displaySchedule && (
                       <span className="flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">
                          <Clock className="w-3 h-3 mr-1" /> {job.displaySchedule}
                       </span>
                    )}
                  </div>

                  {/* Description Preview */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">
                         {job.displayDescription || "No description provided."}
                      </p>
                      
                      {/* Footer: Views or Payment Warning */}
                      <div className="flex items-center justify-between">
                         <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${isEffectivePaid ? 'text-blue-900 bg-blue-50 border-blue-100' : 'text-gray-400 bg-gray-100 border-gray-200'}`}>
                           <Eye className="w-3.5 h-3.5 mr-1.5" />{job.views || 0} Views
                         </span>
                         
                         {!isEffectivePaid && (
                             <span className="text-xs font-bold text-orange-600">Hidden from public</span>
                         )}
                      </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}