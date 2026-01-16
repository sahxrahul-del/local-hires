"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  ShieldCheck, PlusCircle, LayoutDashboard, Briefcase, GraduationCap, 
  Loader2, Trash2, CheckCircle, XCircle, Search, Eye, X, 
  MapPin, Phone, Building2, Globe, FileText, AlertTriangle, User
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  
  // Moderation States
  const [activeTab, setActiveTab] = useState('jobs'); 
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [tuitions, setTuitions] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalJobs: 0, totalUsers: 0, totalTuitions: 0 });

  // Popup States
  const [viewItem, setViewItem] = useState(null); 
  const [viewType, setViewType] = useState(null); 
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const initAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
      
      if (profile?.role !== 'admin') {
          router.push('/'); 
      } else {
          setAdminName(profile.full_name || 'Admin');
          await fetchData();
      }
      setLoading(false);
    };
    initAdmin();
  }, [router, supabase]);

  const fetchData = async () => {
    // 1. Fetch Jobs (Added role to profile fetch)
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*, profiles(full_name, email, phone, business_name, is_verified, role)')
      .order('created_at', { ascending: false });
    
    // 2. Fetch Users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'business', 'business_manager', 'business_tuition_manager','tuition_manager'])
      .order('created_at', { ascending: false });

    // 3. Fetch Tuitions (Added role to profile fetch)
    const { data: tuitionsData } = await supabase
        .from('tuitions')
        .select('*, profiles(full_name, email, phone, is_verified, role, business_name)')
        .order('created_at', { ascending: false });

    setJobs(jobsData || []);
    setUsers(usersData || []);
    setTuitions(tuitionsData || []);
    
    setStats({
        totalJobs: jobsData?.length || 0,
        totalUsers: usersData?.length || 0,
        totalTuitions: tuitionsData?.length || 0
    });
  };

  const toggleVerifyUser = async (userId, currentStatus) => {
    const { error } = await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId);
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
      if (viewItem?.id === userId) setViewItem({ ...viewItem, is_verified: !currentStatus });
      fetchData(); 
    } else {
      alert("Database Error: " + error.message);
    }
  };

  const confirmDelete = (id, table) => {
      setDeleteTarget({ id, table });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    const { error } = await supabase.from(deleteTarget.table).delete().eq('id', deleteTarget.id);
    
    if (!error) {
      if (deleteTarget.table === 'jobs') setJobs(jobs.filter(j => j.id !== deleteTarget.id));
      if (deleteTarget.table === 'tuitions') setTuitions(tuitions.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      setViewItem(null);
    } else {
      alert("Database Error: " + error.message);
    }
  };

  const openModal = (item, type) => {
      setViewItem(item);
      setViewType(type);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />
      
      {/* 🔴 DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete this Post?</h3>
                <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                    <button onClick={executeDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg">Yes, Delete</button>
                </div>
            </div>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {viewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewItem(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                
                <div className="bg-slate-900 p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <h3 className="text-xl font-bold capitalize">Review {viewType}</h3>
                        <p className="text-slate-300 text-sm">Verify details before taking action</p>
                    </div>
                    <button onClick={() => setViewItem(null)}><X className="w-6 h-6 text-slate-400 hover:text-white"/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    
                    {/* --- JOB VIEW --- */}
                    {viewType === 'job' && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                                <p className="text-lg font-bold text-gray-900">{viewItem.title}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company</label>
                                    <p className="text-gray-800 font-medium">{viewItem.company_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pay Rate</label>
                                    <p className="text-green-700 font-bold">{viewItem.pay_rate}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                                <p className="mt-1 text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">{viewItem.description}</p>
                            </div>
                            <button onClick={() => confirmDelete(viewItem.id, 'jobs')} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition flex items-center justify-center border border-red-100">
                                <Trash2 className="w-5 h-5 mr-2"/> Delete Job
                            </button>
                        </div>
                    )}

                    {/* --- TUITION VIEW --- */}
                    {viewType === 'tuition' && (
                        <div className="space-y-5">
                            {/* Tuition Details */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class / Subject</label>
                                <p className="text-lg font-bold text-gray-900">{viewItem.class_level} - {viewItem.subject}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</label>
                                    <p className="text-gray-800 font-medium">{viewItem.location}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</label>
                                    <p className="text-blue-700 font-bold">{viewItem.contact_phone}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                                <p className="mt-1 text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">{viewItem.description}</p>
                            </div>
                            
                            {/* 🟢 POSTED BY SECTION (NEW) */}
                            <div className="border-t border-gray-100 pt-5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Posted By Staff</label>
                                <div className="flex items-center p-3 bg-blue-50 rounded-xl">
                                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold mr-3">
                                        {viewItem.profiles?.full_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{viewItem.profiles?.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-blue-600 font-bold uppercase">{viewItem.profiles?.role}</p>
                                        <p className="text-xs text-gray-500">{viewItem.profiles?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => confirmDelete(viewItem.id, 'tuitions')} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition flex items-center justify-center border border-red-100">
                                <Trash2 className="w-5 h-5 mr-2"/> Delete Tuition
                            </button>
                        </div>
                    )}

                    {/* --- USER VIEW --- */}
                    {viewType === 'user' && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl uppercase">
                                    {viewItem.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{viewItem.full_name || 'No Name'}</h3>
                                    <p className="text-gray-500 text-sm">{viewItem.email}</p>
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs rounded-md font-bold uppercase tracking-wide">
                                        {viewItem.role}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                    <div className="flex items-start">
                                        <Building2 className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Business Name</label>
                                            <p className="text-gray-900 font-medium text-lg">{viewItem.business_name || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start border-t border-gray-200 pt-3">
                                        <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">PAN Number</label>
                                            <p className="text-gray-900 font-medium tracking-wider">{viewItem.pan_number || 'Not Provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                    <div className="flex items-start">
                                        <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
                                            <p className="text-gray-900 font-medium">{viewItem.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start border-t border-gray-200 pt-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase">Address</label>
                                            <p className="text-gray-900 font-medium">
                                                {viewItem.district ? `${viewItem.district}, ${viewItem.province}` : (viewItem.location || '-')}
                                            </p>
                                            {(viewItem.ward || viewItem.tole) && (
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Ward No: {viewItem.ward || '-'}, Tole: {viewItem.tole || '-'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {viewItem.website && (
                                        <div className="flex items-start border-t border-gray-200 pt-3">
                                            <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase">Website</label>
                                                <a href={viewItem.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium block break-all">
                                                    {viewItem.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleVerifyUser(viewItem.id, viewItem.is_verified)}
                                className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center shadow-md ${
                                    viewItem.is_verified 
                                    ? 'bg-white border-2 border-red-100 text-red-600 hover:bg-red-50' 
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                {viewItem.is_verified ? <><XCircle className="w-5 h-5 mr-2"/> Revoke Verification</> : <><CheckCircle className="w-5 h-5 mr-2"/> Approve & Verify</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-blue-900 text-white py-16 px-6 overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
         <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
             <div className="text-center md:text-left mb-8 md:mb-0">
                 <div className="inline-flex items-center bg-blue-800/50 backdrop-blur-sm border border-blue-700 px-4 py-2 rounded-full mb-4">
                    <ShieldCheck className="w-5 h-5 mr-2 text-blue-300" />
                    <span className="text-sm font-bold text-blue-100 uppercase">Super Admin</span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-extrabold mb-2">Hello, {adminName}</h1>
                 <p className="text-blue-200">Manage your entire platform from here.</p>
             </div>
             <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[120px]">
                    <p className="text-3xl font-extrabold">{stats.totalJobs}</p>
                    <p className="text-xs text-blue-200 uppercase font-bold mt-1">Jobs</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[120px]">
                    <p className="text-3xl font-extrabold">{stats.totalTuitions}</p>
                    <p className="text-xs text-blue-200 uppercase font-bold mt-1">Tuitions</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[120px]">
                    <p className="text-3xl font-extrabold">{stats.totalUsers}</p>
                    <p className="text-xs text-blue-200 uppercase font-bold mt-1">Users</p>
                </div>
             </div>
         </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 -mt-10 relative z-20 space-y-12">
         
         {/* 1. QUICK ACTIONS */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/admin/post-tuition" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 transition text-center group">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600 transition">
                    <GraduationCap className="w-6 h-6 text-purple-600 group-hover:text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Post Tuition</h3>
            </Link>
            <Link href="/admin/manage-tuitions" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 transition text-center group">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-600 transition">
                    <LayoutDashboard className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Manage Tuitions</h3>
            </Link>
            <Link href="/post-job" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 transition text-center group">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 transition">
                    <PlusCircle className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Post Job</h3>
            </Link>
            <Link href="/dashboard" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:-translate-y-1 transition text-center group">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-600 transition">
                    <Briefcase className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Job Dashboard</h3>
            </Link>
         </div>

         {/* 2. MODERATION CONSOLE */}
         <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                <div className="flex bg-gray-200 p-1 rounded-xl overflow-x-auto">
                    <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${activeTab === 'jobs' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Review Jobs</button>
                    <button onClick={() => setActiveTab('tuitions')} className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${activeTab === 'tuitions' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Review Tuitions</button>
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Verify Users</button>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search list..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"/>
                </div>
            </div>

            <div className="overflow-x-auto">
                {activeTab === 'jobs' && (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr><th className="p-5">Job Details</th><th className="p-5">Posted By</th><th className="p-5 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
                                <tr key={job.id} className="hover:bg-gray-50 transition">
                                    <td className="p-5">
                                        <p className="font-bold text-gray-900">{job.title}</p>
                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                            <span>{job.company_name}</span>
                                            {job.profiles?.is_verified && <CheckCircle className="w-3 h-3 text-blue-500 ml-1" />}
                                        </div>
                                    </td>
                                    <td className="p-5 text-sm text-gray-600">
                                        {job.profiles?.full_name || 'Unknown'} <span className="text-xs text-gray-400">({job.profiles?.role})</span>
                                    </td>
                                    <td className="p-5 text-right flex justify-end gap-2">
                                        <button onClick={() => openModal(job, 'job')} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => confirmDelete(job.id, 'jobs')} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 🟢 UPDATED TUITION TABLE ROW */}
                {activeTab === 'tuitions' && (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr><th className="p-5">Tuition Details</th><th className="p-5">Posted By</th><th className="p-5 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tuitions.filter(t => (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase())).map(tuition => (
                                <tr key={tuition.id} className="hover:bg-gray-50 transition">
                                    <td className="p-5">
                                        <p className="font-bold text-gray-900">{tuition.class_level} - {tuition.subject}</p>
                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3 mr-1" /> {tuition.location}
                                        </div>
                                    </td>
                                    <td className="p-5 text-sm text-gray-600">
                                        {/* 🟢 SHOWS NAME, ROLE, EMAIL */}
                                        <div className="font-bold text-gray-800">{tuition.profiles?.full_name || 'Unknown'}</div>
                                        <div className="text-xs uppercase font-bold text-blue-600 mt-0.5">{tuition.profiles?.role}</div>
                                        <div className="text-xs text-gray-400">{tuition.profiles?.email}</div>
                                    </td>
                                    <td className="p-5 text-right flex justify-end gap-2">
                                        <button onClick={() => openModal(tuition, 'tuition')} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => confirmDelete(tuition.id, 'tuitions')} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'users' && (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr><th className="p-5">Details</th><th className="p-5">Status</th><th className="p-5 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.filter(u => (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="p-5">
                                        <p className="font-bold text-gray-900">{user.full_name || 'No Name'}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        {user.is_verified ? <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">Verified</span> : <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">Unverified</span>}
                                    </td>
                                    <td className="p-5 text-right flex justify-end gap-2">
                                        <button onClick={() => openModal(user, 'user')} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Eye className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
         </div>
      </main>
    </div>
  );
}