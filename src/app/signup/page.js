"use client";
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, Search, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff, MapPin, Loader2, User, Store } from 'lucide-react';
import { nepalLocations, provinces } from '../../lib/nepalLocations';

export default function Signup() {
  const router = useRouter();

  // 1. Initialize Supabase Client for the Browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [userType, setUserType] = useState('seeker'); 
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Verification State
  const [showVerification, setShowVerification] = useState(false);
  const [otp, setOtp] = useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);

  // Location
  const [availableDistricts, setAvailableDistricts] = useState([]);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phone: '',
    businessName: '', businessType: '', businessAddress: '', businessEmail: '', panNumber: '',
    province: '', district: '' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  // --- THE FIX IS HERE ---
  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setFormData({ ...formData, province: newProvince, district: '' });
    
    // Get the object for the selected province
    const provinceData = nepalLocations[newProvince] || {};
    // Convert the object keys (District Names) into an array
    setAvailableDistricts(Object.keys(provinceData));
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/auth/callback?role=${userType}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match."); setLoading(false); return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters."); setLoading(false); return;
    }
    if (!formData.province || !formData.district) {
        setErrorMessage("Please select your Province and District."); setLoading(false); return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: userType,
            phone: formData.phone,
            province: formData.province,
            district: formData.district,
            
            business_name: userType === 'business' ? formData.businessName : null,
            business_type: userType === 'business' ? formData.businessType : null,
            business_address: userType === 'business' ? formData.businessAddress : null,
            business_email: userType === 'business' ? formData.businessEmail : null,
            pan_number: userType === 'business' ? formData.panNumber : null
          }
        }
      });

      if (error) throw error;
      setShowVerification(true);

    } catch (error) {
       setErrorMessage(error.message.includes('unique_phone') 
        ? "Phone number already in use." 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMessage('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email, token: otp, type: 'signup'
      });
      if (error) throw error;
      router.push(userType === 'business' ? '/dashboard' : '/find-jobs');
    } catch (error) {
      setErrorMessage("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";
  const inputClass = "w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <main className="max-w-2xl mx-auto mt-8 px-4 sm:px-6">
        
        {/* Back Link */}
        {!showVerification && (
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-blue-900 transition font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
          </div>
        )}

        {showVerification ? (
          /* --- VERIFICATION UI --- */
          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Check your Email</h2>
            <p className="text-gray-500 mb-8 text-lg">
              We&apos;ve sent a 6-digit code to <br/><span className="font-bold text-gray-900">{formData.email}</span>
            </p>

            {errorMessage && (
              <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium border border-red-100">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerify} className="max-w-sm mx-auto space-y-6">
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000" 
                className="w-full text-center text-4xl tracking-[0.5em] p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none font-bold text-gray-800 transition-all placeholder-gray-200"
                maxLength={6} 
                required
              />
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Verify Account'}
              </button>
            </form>
            
            <button onClick={() => setShowVerification(false)} className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline">
              Correct my email address
            </button>
          </div>

        ) : (
          /* --- SIGNUP FORM UI --- */
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900">
                Join Work X <span className="text-blue-500">Nepal</span>
              </h1>
              <p className="text-gray-500 mt-3 text-lg">Select your account type to get started</p>
            </div>

            {/* Account Type Toggle */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setUserType('seeker')} 
                className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
                  userType === 'seeker' 
                  ? 'border-blue-600 bg-blue-50/50 shadow-md' 
                  : 'border-white bg-white shadow-sm hover:border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${userType === 'seeker' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    <User className="w-6 h-6" />
                </div>
                <span className={`font-bold ${userType === 'seeker' ? 'text-blue-900' : 'text-gray-500'}`}>Job Seeker</span>
                {userType === 'seeker' && <div className="absolute top-3 right-3 text-blue-600"><CheckCircle className="w-5 h-5 fill-current" /></div>}
              </button>

              <button 
                onClick={() => setUserType('business')} 
                className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
                  userType === 'business' 
                  ? 'border-blue-600 bg-blue-50/50 shadow-md' 
                  : 'border-white bg-white shadow-sm hover:border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${userType === 'business' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    <Store className="w-6 h-6" />
                </div>
                <span className={`font-bold ${userType === 'business' ? 'text-blue-900' : 'text-gray-500'}`}>Business Owner</span>
                {userType === 'business' && <div className="absolute top-3 right-3 text-blue-600"><CheckCircle className="w-5 h-5 fill-current" /></div>}
              </button>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
               {/* Google Button */}
              <button onClick={handleGoogleLogin} className="w-full mb-8 flex items-center justify-center gap-3 border border-gray-300 py-3.5 rounded-xl hover:bg-gray-50 transition font-bold text-gray-700">
                <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" className="w-5 h-5" />
                Sign up with Google
              </button>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-500">Or continue with email</span></div>
              </div>

              {errorMessage && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg flex items-start text-sm font-medium">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-6">
                
                {/* --- BUSINESS SECTION --- */}
                {userType === 'business' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                     <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
                        <h3 className="font-bold text-blue-900 flex items-center"><Store className="w-4 h-4 mr-2"/> Business Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Business Name <span className="text-red-500">*</span></label>
                                <input required name="businessName" onChange={handleChange} type="text" className={inputClass} placeholder="e.g. Himalayan Coffee" />
                            </div>
                            <div>
                                <label className={labelClass}>Type <span className="text-red-500">*</span></label>
                                <select required name="businessType" onChange={handleChange} className={inputClass}>
                                    <option value="">Select Type</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Food">Hospitality (Food/Hotel)</option>
                                    <option value="Service">Services</option>
                                    <option value="Tech">IT / Tech</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                           <label className={labelClass}>Tax (PAN) <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                           <input name="panNumber" onChange={handleChange} type="text" className={inputClass} placeholder="PAN Number" />
                        </div>
                     </div>
                  </div>
                )}

                {/* --- PERSONAL/CONTACT SECTION --- */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className={labelClass}>{userType === 'business' ? 'Owner Name' : 'Full Name'} <span className="text-red-500">*</span></label>
                           <input required name="fullName" onChange={handleChange} type="text" className={inputClass} placeholder="Ram" />
                        </div>
                        <div>
                           <label className={labelClass}>Phone <span className="text-red-500">*</span></label>
                           <input required name="phone" onChange={handleChange} type="tel" className={inputClass} placeholder="9800000000" />
                        </div>
                    </div>
                </div>

                {/* --- LOCATION SECTION --- */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 flex items-center mb-4 text-sm uppercase tracking-wider">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600"/> 
                        {userType === 'business' ? 'Business Location' : 'Your Location'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Province <span className="text-red-500">*</span></label>
                            <select name="province" value={formData.province} onChange={handleProvinceChange} className={inputClass} required>
                                <option value="">Select Province</option>
                                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>District <span className="text-red-500">*</span></label>
                            <select name="district" value={formData.district} onChange={handleChange} className={inputClass} required disabled={!formData.province}>
                                <option value="">Select District</option>
                                {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        {userType === 'business' && (
                            <div className="md:col-span-2">
                                <label className={labelClass}>Street Address</label>
                                <input required name="businessAddress" onChange={handleChange} type="text" className={inputClass} placeholder="e.g. Ward 4, Durbar Marg" />
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CREDENTIALS SECTION --- */}
                <div className="space-y-4 pt-2">
                    <div>
                        <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                        <input required name="email" onChange={handleChange} type="email" className={inputClass} placeholder="you@example.com" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input required name="password" onChange={handleChange} type={showPassword ? "text" : "password"} className={`${inputClass} pr-10`} placeholder="Min 6 chars" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Confirm Password <span className="text-red-500">*</span></label>
                            <input required name="confirmPassword" onChange={handleChange} type="password" className={inputClass} placeholder="Re-type password" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg hover:shadow-xl disabled:opacity-70 text-lg flex items-center justify-center">
                   {loading ? <Loader2 className="animate-spin mr-2" /> : 'Create Account'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  Already have an account? <Link href="/login" className="text-blue-900 font-bold hover:underline">Sign In</Link>
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}