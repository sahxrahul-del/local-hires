"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function UpdatePassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: "Password must be at least 6 characters." });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setMessage({ type: 'success', text: "Password updated successfully! Redirecting..." });

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const target = profile?.role === 'business' ? '/dashboard' : '/find-jobs';

      setTimeout(() => {
        router.push(target);
      }, 2000);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <Navbar />

      <main className="max-w-md mx-auto mt-10 px-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-green-700" />
            </div>

            <h1 className="text-2xl font-extrabold text-center text-gray-900 mb-2">Set New Password</h1>
            <p className="text-gray-600 text-center mb-8 text-sm font-medium">
                Please create a new password for your account.
            </p>

            {message && (
              <div className={`p-4 rounded-lg mb-6 flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                <span className="text-sm font-bold">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">New Password</label>
                  <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-gray-900 font-medium"
                        required 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-800 transition"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Confirm Password</label>
                  <input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-gray-900 font-medium"
                      required 
                  />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition flex justify-center items-center disabled:opacity-70 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Password'}
                </button>
            </form>
        </div>
      </main>
    </div>
  );
}