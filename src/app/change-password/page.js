"use client";
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Lock, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ChangePassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  // 2. Initialize inside the component
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Basic Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: "New passwords do not match." });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: "Password must be at least 6 characters." });
      setLoading(false);
      return;
    }

    try {
      // 2. Verify OLD Password by trying to sign in with it
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.oldPassword,
      });

      if (signInError) {
        throw new Error("Incorrect old password.");
      }

      // 3. Update to NEW Password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) throw updateError;

      // 4. Success!
      setMessage({ type: 'success', text: "Password changed successfully! Redirecting..." });
      
      // Determine where to send them based on role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const redirectUrl = profile?.role === 'business' ? '/dashboard' : '/find-jobs';

      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Helper to toggle password visibility
  const toggleVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-10">
        
        <button onClick={() => router.back()} className="flex items-center text-gray-500 mb-6 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-blue-900 p-6 text-center">
            <div className="w-16 h-16 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Change Password</h1>
            <p className="text-blue-200 text-sm">Secure your account</p>
          </div>

          <div className="p-8">
            {message && (
              <div className={`p-4 rounded-lg mb-6 flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Old Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Old Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="oldPassword" 
                    value={formData.oldPassword} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-gray-900 transition"
                    required 
                  />
                  <button type="button" onClick={toggleVisibility} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">New Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="newPassword" 
                  value={formData.newPassword} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-gray-900 transition"
                  required 
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Confirm New Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-gray-900 transition"
                  required 
                />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white font-bold py-3.5 rounded-lg hover:bg-blue-800 transition shadow-md flex justify-center items-center disabled:opacity-70">
                  {loading ? <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Updating... </> : <> <Save className="w-5 h-5 mr-2" /> Update Password </>}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}