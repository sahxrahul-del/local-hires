"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         // Middleware usually handles this, but we keep it safe
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleGoogleLogin = async () => {
    // Dynamically get the base URL (works for localhost AND Vercel)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    // 🔴 FIXED: Added 'try {' here
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ✅ This ensures it redirects to https://your-site.vercel.app/auth/callback
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Authenticate
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // 2. Fetch user role to direct them correctly
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role;

      // --- NEW REDIRECT LOGIC FOR ALL 6 ROLES ---
      
      // 1. Admin
      if (role === 'admin') {
        router.push('/admin'); 
      } 
      // 2. Tuition Manager (Has their own dashboard)
      else if (role === 'tuition_manager') {
        router.push('/admin/manage-tuitions');
      } 
      // 3. Business Team (Owner, Manager, Hybrid all go to Business Dashboard)
      else if (['business', 'business_manager', 'business_tuition_manager'].includes(role)) {
        router.push('/dashboard');
      } 
      // 4. Everyone else (Seekers)
      else {
        router.push('/find-jobs');
      }

    } catch (error) {
      setErrorMessage("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-gray-900";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* LEFT SIDE: BRANDING */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-blue-800/90 z-10" />
          <Image src="/image2.png" alt="Work X Nepal Context" fill className="object-cover" priority />
          <div className="relative z-20 text-white p-12 text-center max-w-lg">
            <h2 className="text-4xl font-extrabold mb-6">Welcome to Work X Nepal</h2>
            <p className="text-lg text-blue-100">Connecting Nepal&apos;s top talent with the best local businesses.</p>
          </div>
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sign In</h1>
              <p className="text-gray-500 mt-2">Enter your details to access your account.</p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-4">
              <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700">
                <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">or sign in with email</span></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@company.com" required />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <Link href="/forgot-password"><span className="text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">Forgot password?</span></Link>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-3.5 rounded-lg font-bold hover:bg-blue-800 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md">
                  {loading ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Signing in...</> : 'Sign In'}
                </button>
              </form>
            </div>
            <p className="text-center text-gray-600 text-sm">Don&apos;t have an account? <Link href="/signup" className="text-blue-700 font-bold hover:underline">Create an account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}