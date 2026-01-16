"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  PlusCircle, Eye, Trash2, MapPin, AlertTriangle, X, 
  Calendar, List, Mail, Pencil, TrendingUp, Clock, CheckCircle, 
  GraduationCap, Briefcase, Loader2, ShieldCheck
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
  const [tuitions, setTuitions] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); 

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
  
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', user.id)
          .maybeSingle();
        
        const role = profileData?.role || user.user_metadata?.role;
        
        // --- ROLE CHECKS ---
        
        // 1. Tuition Manager has their own dashboard, redirect them
        if (role === 'tuition_manager') {
            router.push('/admin/manage-tuitions');
            return;
        }

        // 2. Allow Business, Admin, Biz Manager, Hybrid Manager
        const allowedRoles = ['business', 'admin', 'business_manager', 'business_tuition_manager'];
        if (!allowedRoles.includes(role)) { 
            router.push('/find-jobs'); 
            return; 
        }
  
        setProfile({
            ...profileData,
            avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url,
            full_name: profileData?.full_name || user.user_metadata?.full_name,
            email: user.email 
        }); 
  
        // 3. Fetch Jobs (Everyone allowed here sees jobs)
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', user.id)
          .order('created_at', { ascending: false });
        
        setJobs(jobsData || []);

        // 4. Fetch Tuitions (Only Admin & Hybrid Manager)
        if (role === 'admin' || role === 'business_tuition_manager') {
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

  const parseJobData = (job) => {
    let displaySchedule = "";
    let displayDescription = job.description || "";
    if (job.work_day_from && job.work_day_to) {
      displaySchedule = `${job.work_day_from} - ${job.work_day_to}`;
      if (job.work_hour_start) displaySchedule += `, ${job.work_hour_start} - ${job.work_hour_end}`;
    } 
    return { ...job, displaySchedule, displayDescription };
  };

  const activeJobsCount = jobs.filter(j => j.payment_status === 'PAID').length;
  const totalViews = jobs.reduce((acc, job) => acc + (job.views || 0), 0);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  // Determine capabilities for UI
  const canSeeTuitions = profile?.role === 'admin' || profile?.role === 'business_tuition_manager';
  const displayRoleName = profile?.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative pb-20">
      <Navbar />
      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all scale-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item?</h3>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
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
                    {displayRoleName} Dashboard
                </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Link href="/post-job">
                <button className="flex items-center bg-blue-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg">
                  <PlusCircle className="w-5 h-5 mr-2" /> Post Job
                </button>
             </Link>
             {canSeeTuitions && (
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
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Live Listings</p>
                <h2 className="text-4xl font-extrabold text-gray-900">{activeJobsCount + (canSeeTuitions ? tuitions.length : 0)}</h2>
                <p className="text-xs text-blue-600 font-medium mt-1">Visible to public</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl"><CheckCircle className="text-blue-900 w-8 h-8" /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Views</p>
                <h2 className="text-4xl font-extrabold text-gray-900">{totalViews}</h2>
                <p className="text-xs text-green-600 font-medium mt-1">Job interest</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl"><TrendingUp className="text-green-600 w-8 h-8" /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
             <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Account Role</p>
                <h2 className="text-lg font-bold text-gray-900 truncate pr-2">{displayRoleName}</h2>
                <p className="text-xs text-orange-600 font-medium mt-1">{profile?.email}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl"><Mail className="text-orange-600 w-8 h-8" /></div>
          </div>
        </div>

        {/* --- TABS --- */}
        {canSeeTuitions ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {jobs.length === 0 ? <div className="text-center w-full col-span-2 py-10 text-gray-500">No active jobs.</div> : jobs.map((rawJob) => {
              const job = parseJobData(rawJob);
              const isPaid = job.payment_status === 'PAID';
              const isEffectivePaid = isPaid || !job.payment_status; 

              return (
                <div key={job.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300 flex flex-col h-full relative group ${isEffectivePaid ? 'border-gray-200' : 'border-orange-200 bg-orange-50/30'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-2">
                        {!isEffectivePaid && <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700 mb-2"><AlertTriangle className="w-3 h-3 mr-1" /> Pending</div>}
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{job.title}</h3>
                        <div className="flex items-center text-xs text-gray-400 font-medium mt-1"><Calendar className="w-3.5 h-3.5 mr-1" /> Posted {new Date(job.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {isEffectivePaid && <Link href={`/edit-job/${job.id}`}><button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"><Pencil className="w-5 h-5" /></button></Link>}
                        <button onClick={() => promptDelete(job.id, 'job')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
                    <span className="flex items-center bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold"><MapPin className="w-3 h-3 mr-1" /> {job.location}</span>
                    <span className="flex items-center bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Rs. {job.pay_rate}</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                     <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${isEffectivePaid ? 'text-blue-900 bg-blue-50 border-blue-100' : 'text-gray-400 bg-gray-100 border-gray-200'}`}><Eye className="w-3.5 h-3.5 mr-1.5" />{job.views || 0} Views</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- TUITIONS CONTENT --- */}
        {canSeeTuitions && activeTab === 'tuitions' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {tuitions.length === 0 ? <div className="text-center w-full col-span-2 py-10 text-gray-500">No active tuitions.</div> : tuitions.map((t) => (
                    <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col relative group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{t.subject}</h3>
                                <div className="flex items-center text-xs text-gray-400 font-medium mt-1"><Calendar className="w-3.5 h-3.5 mr-1" /> Posted {new Date(t.created_at).toLocaleDateString()}</div>
                            </div>
                            <button onClick={() => promptDelete(t.id, 'tuition')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
                            <span className="flex items-center bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold"><MapPin className="w-3 h-3 mr-1" /> {t.city}, {t.district}</span>
                            <span className="flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">Class {t.class_level}</span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-100"><span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border text-green-700 bg-green-50 border-green-100">Active</span></div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}