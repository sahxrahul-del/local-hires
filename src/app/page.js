"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { 
  Search, Briefcase, Users, ArrowRight, UserPlus, 
  FileText, PhoneCall, Loader2, GraduationCap, 
  ArrowRightCircle
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    // 1. Check User Session & Redirect
    const checkRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role || user.user_metadata?.role;

        if (role === 'admin') router.push('/admin');
        else if (role === 'business') router.push('/dashboard');
        else router.push('/find-jobs');
      } else {
        setLoading(false);
      }
    };

    checkRedirect();
  }, [router, supabase]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-10">
      <Navbar />
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-gradient-to-b from-white to-blue-50/50">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center bg-white border border-blue-100 rounded-full px-5 py-2 mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            <span className="text-sm font-bold text-blue-900 tracking-wide uppercase">The #1 Job Board in Nepal</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-900 tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Hire Local Talent. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
              Find Your Dream Job.
            </span>
          </h1>

          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            Stop searching in the dark. Connect directly with <span className="font-bold text-gray-900">verified businesses</span> and <span className="font-bold text-gray-900">skilled workers</span> in your community today.
          </p>
          
          {/* --- ACTION BUTTONS (ALL 3) --- */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 flex-wrap z-20 relative">
            
            {/* 1. FIND JOBS (Dark Blue - Matches 'Work X') */}
            <Link href="/find-jobs">
              <button className="w-full sm:w-auto px-8 py-4 bg-blue-900 text-white rounded-xl font-bold text-lg hover:bg-blue-950 transition shadow-lg hover:shadow-blue-900/30 hover:-translate-y-1 flex items-center justify-center group min-w-[200px]">
                Find a Job
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                
              </button>
            </Link>

            {/* 2. POST A JOB (Light Blue - Matches 'Nepal') */}
            <Link href="/post-job">
              <button className="w-full sm:w-auto px-8 py-4 bg-blue-500 text-white rounded-xl font-bold text-lg hover:bg-blue-600 transition shadow-lg hover:shadow-blue-500/30 flex items-center justify-center min-w-[200px] hover:-translate-y-1">
                <Briefcase className="w-5 h-5 mr-2" />
                Post a Job
              </button>
            </Link>

            {/* 3. FIND TUITIONS (White) */}
            <Link href="/tuitions">
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-purple-700 border-2 border-purple-100 rounded-xl font-bold text-lg hover:border-purple-300 hover:bg-purple-50 transition flex items-center justify-center min-w-[200px] hover:-translate-y-1">
                <GraduationCap className="w-5 h-5 mr-2" />
                Find Tuitions
              </button>
            </Link>

          </div>

        </div>

        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 pointer-events-none opacity-40">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl mix-blend-multiply"></div>
            <div className="absolute top-40 right-0 w-96 h-96 bg-cyan-100 rounded-full blur-3xl mix-blend-multiply"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-100 rounded-full blur-3xl mix-blend-multiply"></div>
        </div>
      </section>

      {/* --- HOW IT WORKS BANNER --- */}
      <div className="bg-blue-900 text-white py-20 border-y border-blue-800">
        <div className="max-w-6xl mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
               <div className="flex flex-col items-center group">
                  <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-900/50">
                    <UserPlus className="w-8 h-8 text-blue-200" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">1. Create Account</h3>
                  <p className="text-blue-200 text-sm max-w-xs leading-relaxed">Sign up in seconds. We only ask for what's necessary to get you hired or help you hire.</p>
               </div>
               <div className="flex flex-col items-center group">
                  <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-900/50">
                    <FileText className="w-8 h-8 text-blue-200" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">2. Browse or Post</h3>
                  <p className="text-blue-200 text-sm max-w-xs leading-relaxed">Businesses post jobs for free. Seekers use smart filters to find local openings instantly.</p>
               </div>
               <div className="flex flex-col items-center group">
                  <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-900/50">
                    <PhoneCall className="w-8 h-8 text-blue-200" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">3. Connect Directly</h3>
                  <p className="text-blue-200 text-sm max-w-xs leading-relaxed">No middleman. No hidden fees. Call or email to schedule an interview immediately.</p>
               </div>
           </div>
        </div>
      </div>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-gray-50">
         <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-extrabold text-blue-900 mb-4">Why Nepal Chooses Us</h2>
               <p className="text-gray-500 max-w-2xl mx-auto text-lg">We stripped away the complexity. No long forms, no corporate nonsense. Just people connecting with people.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                   <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                       <Search className="w-7 h-7 text-blue-600" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Search</h3>
                   <p className="text-gray-500 leading-relaxed">
                       Filter jobs by Province, District, and even specific City Zones to find work within walking distance.
                   </p>
               </div>

               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                   <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                       <Briefcase className="w-7 h-7 text-green-600" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900">Incredibly Affordable</h3>
                      <p className="text-gray-500 mt-2">
                         Hiring shouldn't be expensive. Post a job for just <span className="text-green-600 font-bold">Rs. 99</span> and reach thousands of local candidates instantly.
                     </p>
               </div>

               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                   <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                       <Users className="w-7 h-7 text-orange-600" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-3">Community Verified</h3>
                   <p className="text-gray-500 leading-relaxed">
                       We are building a safe community. Profiles are linked to real people and real local businesses.
                   </p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}