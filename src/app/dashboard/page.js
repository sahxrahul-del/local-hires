"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  PlusCircle, Eye, Trash2, MapPin, AlertTriangle, X, 
  Calendar, List, Mail, Pencil, TrendingUp, Clock, CheckCircle, 
  GraduationCap, Briefcase, Loader2  // <--- Added Loader2 here
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // Data States
  const [jobs, setJobs] = useState([]);
  const [tuitions, setTuitions] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); 

  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { id, type }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
  
        // 1. Get Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', user.id)
          .maybeSingle();
        
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
  
        // 2. Fetch Jobs (For Business & Admin)
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', user.id)
          .order('created_at', { ascending: false });
        
        setJobs(jobsData || []);

        // 3. Fetch Tuitions (ADMIN ONLY)
        if (role === 'admin') {
            const { data: tuitionsData } = await supabase
              .from('tuitions')
              .select('*')
              .eq('posted_by', user.id)
              .order('created_at', { ascending: false });
            setTuitions(tuitionsData || []);
        }
  
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

    if (job.work_day_from && job.work_day_to) {
      displaySchedule = `${job.work_day_from} - ${job.work_day_to}`;
      if (job.work_hour_start) displaySchedule += `, ${job.work_hour_start} - ${job.work_hour_end}`;
    } 
    else if (displayDescription.includes("Schedule:")) {
       const parts = displayDescription.split("Schedule:");
       if (parts.length > 1) displaySchedule = parts[1].split('\n')[0].trim();
       const scheduleLine = "Schedule:" + parts[1].split('\n')[0];
       displayDescription = displayDescription.replace(scheduleLine, "").trim();
    }

    return { ...job, displaySchedule, displayDescription };
  };

  const totalViews = jobs.reduce((acc, job) => acc + (job.views || 0), 0);
  const activeJobsCount = jobs.filter(j => j.payment_status === 'PAID').length;

  const promptDelete = (id, type) => {
    setItemToDelete({ id, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const table = itemToDelete.type === 'job' ? 'jobs' : 'tuitions';
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
      
      if (error) { alert("Database Error: " + error.message); return; }
      
      if (itemToDelete.type === 'job') {
          setJobs(prev => prev.filter(j => j.id !== itemToDelete.id));
      } else {
          setTuitions(prev => prev.filter(t => t.id !== itemToDelete.id));
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) { alert("Error deleting: " + error.message); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-900 w-10 h-10" />
    </div>
  );

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative pb-20">
      <Navbar />
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <button onClick={() => setShowDeleteModal(false)} className="hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item?</h3>
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
                    {isAdmin ? 'Super Admin Dashboard' : 'Manage your business & postings'}
                </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Link href="/post-job">
                <button className="flex items-center bg-blue-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg">
                  <PlusCircle className="w-5 h-5 mr-2" /> Post Job
                </button>
             </Link>
             {/* Admin Only Button */}
             {isAdmin && (
                 <Link href="/admin/post-tuition">
                    <button className="flex items-center bg-white text-blue-900 border border-blue-200 px-5 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-sm">
                      <PlusCircle className="w-5 h-5 mr-2" /> Post Tuition
                    </button>
                 </Link>
             )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Active Jobs Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Live Listings</p>
                <h2 className="text-4xl font-extrabold text-gray-900">{activeJobsCount + (isAdmin ? tuitions.length : 0)}</h2>
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

        {/* --- TABS (Admin Only sees both) --- */}
        {isAdmin ? (
            <div className="flex items-center gap-8 mb-6 border-b border-gray-200 px-2">
                <button 
                    onClick={() => setActiveTab('jobs')}
                    className={`pb-4 text-lg font-bold flex items-center transition-all relative ${activeTab === 'jobs' ? 'text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Briefcase className="w-5 h-5 mr-2" /> My Jobs
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">{jobs.length}</span>
                    {activeTab === 'jobs' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-900 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('tuitions')}
                    className={`pb-4 text-lg font-bold flex items-center transition-all relative ${activeTab === 'tuitions' ? 'text-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <GraduationCap className="w-5 h-5 mr-2" /> My Tuitions
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">{tuitions.length}</span>
                    {activeTab === 'tuitions' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-900 rounded-t-full"></div>}
                </button>
            </div>
        ) : (
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
                Your Job Listings <span className="ml-3 bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">{jobs.length}</span>
            </h2>
        )}
        
        {/* --- JOBS CONTENT --- */}
        {activeTab === 'jobs' && (
          <>
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
                            <button onClick={() => promptDelete(job.id, 'job')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Delete Job">
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
                          
                          {/* Footer */}
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
          </>
        )}

        {/* --- TUITIONS CONTENT (Admin Only) --- */}
        {isAdmin && activeTab === 'tuitions' && (
            <>
            {tuitions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No active tuition posts</h3>
                    <p className="text-gray-500 mb-6">Start teaching by posting a tuition offer.</p>
                    <Link href="/admin/post-tuition"><button className="text-blue-900 font-bold hover:underline">Create tuition post →</button></Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {tuitions.map((t) => (
                        <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all flex flex-col relative group">
                            
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{t.subject}</h3>
                                    <div className="flex items-center text-xs text-gray-400 font-medium mt-1">
                                        <Calendar className="w-3.5 h-3.5 mr-1" />
                                        Posted {new Date(t.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => promptDelete(t.id, 'tuition')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Delete Tuition">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
                                <span className="flex items-center bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold">
                                    <MapPin className="w-3 h-3 mr-1" /> {t.city}, {t.district}
                                </span>
                                <span className="flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                                    Class {t.class_level}
                                </span>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100">
                                <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border text-green-700 bg-green-50 border-green-100">
                                    Active
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </>
        )}

      </main>
    </div>
  );
}