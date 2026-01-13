"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  Briefcase, MapPin, PlusCircle, Edit, Trash2, Loader2, 
  Settings, LogOut, LayoutDashboard, GraduationCap 
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // 2. Fetch User's Data (Jobs & Tuitions)
      const { data: myJobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });
      setJobs(myJobs || []);

      const { data: myTuitions } = await supabase
        .from('tuitions')
        .select('*')
        .eq('posted_by', user.id)
        .order('created_at', { ascending: false });
      setTuitions(myTuitions || []);

      setLoading(false);
    };

    fetchDashboardData();
  }, [router, supabase]);

  // --- DELETE FUNCTIONS ---
  const handleDeleteJob = async (id) => {
    if (!confirm("Delete this job?")) return;
    await supabase.from('jobs').delete().eq('id', id);
    setJobs(jobs.filter(j => j.id !== id));
  };

  const handleDeleteTuition = async (id) => {
    if (!confirm("Delete this tuition post?")) return;
    await supabase.from('tuitions').delete().eq('id', id);
    setTuitions(tuitions.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto mt-8 px-4 sm:px-6">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl mr-4 uppercase">
                    {profile?.business_name ? profile.business_name[0] : profile?.full_name[0]}
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">
                        {profile?.business_name || profile?.full_name}
                    </h1>
                    <p className="text-gray-500 font-medium capitalize">
                        {profile?.role === 'admin' ? 'Administrator Dashboard' : 'Dashboard'}
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => router.push('/profile')} className="flex items-center px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition">
                    <Settings className="w-4 h-4 mr-2" /> Profile
                </button>
                <button onClick={handleLogout} className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition border border-red-100">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
            </div>
        </div>

        {/* --- TABS: JOBS vs TUITIONS --- */}
        <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('jobs')}
                className={`pb-4 text-lg font-bold flex items-center transition-all ${activeTab === 'jobs' ? 'text-blue-900 border-b-4 border-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Briefcase className="w-5 h-5 mr-2" /> My Jobs
            </button>
            <button 
                onClick={() => setActiveTab('tuitions')}
                className={`pb-4 text-lg font-bold flex items-center transition-all ${activeTab === 'tuitions' ? 'text-blue-900 border-b-4 border-blue-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <GraduationCap className="w-5 h-5 mr-2" /> My Tuitions
            </button>
        </div>

        {/* --- JOBS TAB CONTENT --- */}
        {activeTab === 'jobs' && (
            <div>
                <div className="flex justify-end mb-4">
                    <Link href="/post-job" className="bg-blue-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2" /> Post New Job
                    </Link>
                </div>

                {jobs.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Jobs</h3>
                        <p className="text-gray-500">You haven't posted any jobs yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> {job.location}</span>
                                            <span className="font-medium text-green-700">Rs. {job.pay_rate}</span>
                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">LIVE</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => router.push(`/edit-job/${job.id}`)} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-bold hover:bg-gray-100 text-sm flex items-center">
                                            <Edit className="w-4 h-4 mr-2" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteJob(job.id)} className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-lg font-bold hover:bg-red-50 text-sm flex items-center">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- TUITIONS TAB CONTENT --- */}
        {activeTab === 'tuitions' && (
            <div>
                 <div className="flex justify-end mb-4">
                    <Link href="/post-tuition" className="bg-blue-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2" /> Post New Tuition
                    </Link>
                </div>

                {tuitions.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Tuitions</h3>
                        <p className="text-gray-500">You haven't posted any tuitions yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tuitions.map((t) => (
                            <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{t.subject} Tuition</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> {t.city}, {t.district}</span>
                                            <span className="font-medium text-blue-700">Class {t.class_level}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleDeleteTuition(t.id)} className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-lg font-bold hover:bg-red-50 text-sm flex items-center">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
}