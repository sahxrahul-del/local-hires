"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { 
  User, Phone, Mail, Building2, Save, Loader2, CheckCircle, 
  ArrowLeft, AlertCircle, MapPin, Briefcase, FileText 
} from 'lucide-react';
import { nepalLocations, provinces } from '../../lib/nepalLocations';
import Image from 'next/image';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Micah',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Christopher',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sophia',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jake',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Mason'
];

export default function Profile() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [originalEmail, setOriginalEmail] = useState(''); 
  
  const [formData, setFormData] = useState({
    id: '', email: '', full_name: '', phone: '', role: 'seeker', avatar_url: '',
    province: '', district: '',
    business_name: '', business_type: '', business_address: '', business_email: '', pan_number: ''
  });

  const [availableDistricts, setAvailableDistricts] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { router.push('/login'); return; }
          setOriginalEmail(user.email);
    
          const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (error && error.code !== 'PGRST116') throw error;
    
          const meta = user.user_metadata || {};
          const profile = data || {};
          const currentProvince = profile.province || '';
          
          setFormData({
            id: user.id,
            email: user.email,
            full_name: profile.full_name || meta.full_name || '',
            avatar_url: profile.avatar_url || meta.avatar_url || AVATAR_OPTIONS[0],
            phone: profile.phone || '',
            role: profile.role || meta.role || 'seeker',
            province: currentProvince,
            district: profile.district || '',
            business_name: profile.business_name || meta.business_name || '',
            business_type: profile.business_type || '',
            business_address: profile.business_address || '',
            business_email: profile.business_email || '',
            pan_number: profile.pan_number || ''
          });
    
          // --- FIX: HANDLE NEW LOCATION STRUCTURE ---
          if (currentProvince && nepalLocations[currentProvince]) {
            // Get keys (District Names) from the object
            setAvailableDistricts(Object.keys(nepalLocations[currentProvince]));
          } else {
            setAvailableDistricts([]);
          }
    
        } catch (error) {
          console.error(error);
          setMessage({ type: 'error', text: 'Failed to load profile data.' });
        } finally {
          setLoading(false);
        }
    };
    fetchProfile();
  }, [router, supabase]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(null);
  };

  // --- FIX: HANDLE PROVINCE CHANGE CORRECTLY ---
  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    
    // Reset district
    setFormData({ ...formData, province: newProvince, district: '' });
    
    // Get District List (Keys)
    if (newProvince && nepalLocations[newProvince]) {
        setAvailableDistricts(Object.keys(nepalLocations[newProvince]));
    } else {
        setAvailableDistricts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMessage(null);

    const isBizOrAdmin = formData.role === 'business' || formData.role === 'admin';

    try {
      if (formData.email !== originalEmail) {
         const { error } = await supabase.auth.updateUser({ email: formData.email });
         if (error) throw error;
         setMessage({ type: 'success', text: "Email updated! Check inbox to confirm." });
         setSaving(false); return; 
      }

      const { error } = await supabase.from('profiles').upsert({
          id: formData.id,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          role: formData.role,
          province: formData.province,
          district: formData.district,

          business_name: isBizOrAdmin ? formData.business_name : null,
          business_type: isBizOrAdmin ? formData.business_type : null,
          business_address: isBizOrAdmin ? formData.business_address : null,
          business_email: isBizOrAdmin ? formData.business_email : null,
          pan_number: isBizOrAdmin ? formData.pan_number : null,

          updated_at: new Date(),
        });

      if (error) throw error;

      setMessage({ type: 'success', text: "Profile saved! Redirecting..." });
      router.refresh();

      setTimeout(() => {
        if (formData.role === 'admin') {
            router.push('/admin'); 
        } else if (formData.role === 'business') {
            router.push('/dashboard');
        } else {
            router.push('/find-jobs'); 
        }
      }, 1500);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  const isBusiness = formData.role === 'business' || formData.role === 'admin';
  
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";
  const inputClass = "w-full p-3 pl-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none transition-all bg-white text-gray-900 font-medium";

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto mt-8 px-4 sm:px-6">
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-900 h-32 relative">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-800 opacity-90"></div>
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg relative group">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-gray-100 relative">
                        <Image src={formData.avatar_url} alt="Avatar" width={128} height={128} className="object-cover" unoptimized />
                    </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 max-w-full px-2 custom-scrollbar">
                    {AVATAR_OPTIONS.map((url, idx) => (
                        <button key={idx} onClick={() => setFormData({...formData, avatar_url: url})} className={`w-12 h-12 rounded-full border-2 transition-all shrink-0 overflow-hidden bg-gray-50 ${formData.avatar_url === url ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent hover:border-gray-300'}`}>
                            <Image src={url} alt={`Avatar ${idx}`} width={48} height={48} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-extrabold text-gray-900">{formData.business_name || formData.full_name}</h1>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-wide bg-blue-50 inline-block px-3 py-1 rounded-full mt-2">
                    {formData.role === 'admin' ? 'Administrator' : (formData.role === 'business' ? 'Business Account' : 'Job Seeker')}
                </p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl mb-6 flex items-start animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-100' : 'bg-red-50 text-red-900 border border-red-100'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />}
                <span className="font-bold text-sm">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
              
              {/* --- 1. BUSINESS PROFILE --- */}
              {isBusiness && (
                  <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                         <span className="w-8 h-[1px] bg-gray-300 mr-2"></span> Business Details <span className="w-full h-[1px] bg-gray-300 ml-2"></span>
                      </h3>
                      <div>
                        <label className={labelClass}>Business Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Building2 className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="e.g. Himalayan Coffee" required />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Business Type <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Briefcase className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <select name="business_type" value={formData.business_type} onChange={handleChange} className={`${inputClass} pl-11`} required>
                                <option value="">Select business type</option>
                                <option value="Retail">Retail Store</option>
                                <option value="Food">Restaurant / Cafe</option>
                                <option value="Service">Service Provider</option>
                                <option value="Tech">IT / Tech / Agency</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                      </div>
                      <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                           <div className="flex items-center mb-4 text-blue-900 font-bold text-sm">
                                <MapPin className="w-4 h-4 mr-2" /> Business Location
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <select name="province" value={formData.province} onChange={handleProvinceChange} className={inputClass} required>
                                        <option value="">Select Province</option>
                                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <select name="district" value={formData.district} onChange={handleChange} className={inputClass} required disabled={!formData.province}>
                                        <option value="">Select District</option>
                                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                           </div>
                           <input type="text" name="business_address" value={formData.business_address} onChange={handleChange} className={inputClass} placeholder="Specific Address (e.g. Main Street, Ward 5)" />
                      </div>
                      <div>
                        <label className={labelClass}>Business Email <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="email" name="business_email" value={formData.business_email} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="contact@business.com" />
                        </div>
                      </div>
                      <div>
                         <label className={labelClass}>Tax Details <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
                         <div className="relative">
                            <FileText className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="PAN Number" />
                         </div>
                      </div>
                  </section>
              )}

              {/* --- 2. PERSONAL INFO --- */}
              <section className="space-y-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                       <span className="w-8 h-[1px] bg-gray-300 mr-2"></span> {isBusiness ? 'Owner Details' : 'Personal Details'} <span className="w-full h-[1px] bg-gray-300 ml-2"></span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>{isBusiness ? 'Owner Name' : 'Full Name'} <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`${inputClass} pl-11`} required placeholder="John Doe"/>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Phone Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} pl-11`} required placeholder="9800000000" />
                        </div>
                      </div>
                  </div>

                  {/* Seeker Location (Only shown if NOT business AND NOT admin) */}
                  {!isBusiness && (
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-4">
                           <div className="flex items-center mb-4 text-gray-700 font-bold text-sm">
                                <MapPin className="w-4 h-4 mr-2" /> Your Location
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <select name="province" value={formData.province} onChange={handleProvinceChange} className={inputClass} required>
                                        <option value="">Select Province</option>
                                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <select name="district" value={formData.district} onChange={handleChange} className={inputClass} required disabled={!formData.province}>
                                        <option value="">Select District</option>
                                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                           </div>
                      </div>
                  )}

                  <div>
                    <label className={labelClass}>Login Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClass} pl-11`} required />
                    </div>
                    {formData.email !== originalEmail && (
                        <p className="text-xs text-amber-600 font-bold mt-2 ml-1 flex items-center">
                           <AlertCircle className="w-3 h-3 mr-1"/> Changing this will require email re-verification.
                        </p>
                    )}
                  </div>
              </section>

              <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <button type="submit" disabled={saving} className="w-full md:w-auto flex-1 bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition shadow-lg hover:shadow-xl flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed text-lg">
                  {saving ? <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Changes... </> : <> <Save className="w-5 h-5 mr-2" /> Save Profile </>}
                </button>
                <button type="button" onClick={() => router.push('/change-password')} className="w-full md:w-auto px-6 py-4 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition flex justify-center items-center">
                   Change Password
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}