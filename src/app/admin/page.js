"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  ShieldCheck, PlusCircle, LayoutDashboard, 
  Briefcase, GraduationCap, Loader2 
} from 'lucide-react';

export default function AdminLanding() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
      
      if (profile?.role !== 'admin') {
          router.push('/'); 
      } else {
          setAdminName(profile.full_name || 'Admin');
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router, supabase]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      {/* Hero Section with Animation */}
      <div className="relative bg-blue-900 text-white py-20 px-6 overflow-hidden">
         {/* Animated Background Elements */}
         <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
         <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>

         <div className="relative z-10 max-w-5xl mx-auto text-center animate-in fade-in slide-in-from-bottom-10 duration-700">
             <div className="inline-flex items-center bg-blue-800/50 backdrop-blur-sm border border-blue-700 px-4 py-2 rounded-full mb-6">
                <ShieldCheck className="w-5 h-5 mr-2 text-blue-300" />
                <span className="text-sm font-bold text-blue-100 tracking-wide uppercase">Admin Console</span>
             </div>
             
             <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">{adminName}</span>
             </h1>
             <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Manage your job marketplace and tuition vacancies from one central command center.
             </p>
         </div>
      </div>

      {/* Quick Actions Grid */}
      <main className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 pb-20">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Post Tuition Card */}
            <Link href="/admin/post-tuition" className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 delay-100">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                    <GraduationCap className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Post Tuition</h3>
                <p className="text-gray-500">Create a new home tuition vacancy record manually.</p>
            </Link>

            {/* 2. Manage Tuitions Card */}
            <Link href="/admin/manage-tuitions" className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 delay-200">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                    <LayoutDashboard className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Manage Tuitions</h3>
                <p className="text-gray-500">Edit, update or delete existing tuition listings.</p>
            </Link>

            {/* 3. Post Job Card */}
            <Link href="/post-job" className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 delay-300">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                    <PlusCircle className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Post a Job</h3>
                <p className="text-gray-500">Post a commercial job vacancy for a business.</p>
            </Link>

            {/* 4. Job Dashboard Card */}
            <Link href="/dashboard" className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 delay-400">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
                    <Briefcase className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Job Dashboard</h3>
                <p className="text-gray-500">View applicants and manage your job postings.</p>
            </Link>

         </div>
      </main>
    </div>
  );
}