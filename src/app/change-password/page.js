"use client";
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Lock, Loader2, CheckCircle, ArrowLeft, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function ChangePassword() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility States
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Basic Validation
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "New passwords do not match." });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
        setMessage({ type: 'error', text: "New password must be at least 6 characters." });
        setLoading(false);
        return;
    }

    try {
      // 2. GET CURRENT USER
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found.");

      // 3. VERIFY OLD PASSWORD
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        throw new Error("Incorrect old password.");
      }

      // 4. UPDATE TO NEW PASSWORD
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: "Password updated successfully!" });
      
      // 5. REDIRECT LOGIC
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role;

      setTimeout(() => {
          if (role === 'admin') router.push('/admin');
          else if (role === 'tuition_manager') router.push('/admin/manage-tuitions');
          else if (['business', 'business_manager', 'business_tuition_manager'].includes(role)) router.push('/dashboard');
          else router.push('/find-jobs');
      }, 1500);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  const inputClass = "w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none transition-all bg-white text-gray-900 font-medium";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  // Helper for toggle buttons
  const ToggleButton = ({ isVisible, onToggle }) => (
    <button 
        type="button" 
        onClick={onToggle}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
    >
        {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />
      <main className="max-w-md mx-auto mt-10 px-6">
        
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-blue-900" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">Change Password</h1>
                <p className="text-gray-500 mt-2 text-sm">Secure your account with a new password.</p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl mb-6 flex items-start animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-100' : 'bg-red-50 text-red-900 border border-red-100'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />}
                <span className="font-bold text-sm">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
                
                {/* OLD PASSWORD FIELD */}
                <div>
                    <label className={labelClass}>Current Password</label>
                    <div className="relative">
                        <KeyRound className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                        <input 
                            type={showOld ? "text" : "password"} 
                            value={oldPassword} 
                            onChange={(e) => setOldPassword(e.target.value)} 
                            className={`${inputClass} pl-12 pr-12`} 
                            placeholder="Enter current password"
                            required 
                        />
                        <ToggleButton isVisible={showOld} onToggle={() => setShowOld(!showOld)} />
                    </div>
                </div>

                <div className="border-t border-gray-100 my-4 pt-4">
                    <div>
                        <label className={labelClass}>New Password</label>
                        <div className="relative">
                            <input 
                                type={showNew ? "text" : "password"} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className={`${inputClass} pr-12`} 
                                placeholder="Min. 6 characters"
                                required 
                            />
                            <ToggleButton isVisible={showNew} onToggle={() => setShowNew(!showNew)} />
                        </div>
                    </div>
                    <div className="mt-5">
                        <label className={labelClass}>Confirm New Password</label>
                        <div className="relative">
                            <input 
                                type={showConfirm ? "text" : "password"} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                className={`${inputClass} pr-12`} 
                                placeholder="Re-enter new password"
                                required 
                            />
                            <ToggleButton isVisible={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition shadow-lg hover:shadow-xl flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed text-lg mt-2"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Update Password'}
                </button>
            </form>
        </div>
      </main>
    </div>
  );
}