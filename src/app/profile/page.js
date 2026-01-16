"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { 
  User, Phone, Mail, Building2, Save, Loader2, CheckCircle, 
  ArrowLeft, AlertCircle, MapPin, Briefcase, FileText, 
  ShieldCheck, GraduationCap, Settings, Hash
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
    province: '', district: '', city_zone: '', address: '', // Full Location
    business_name: '', business_type: '', business_address: '', business_email: '', pan_number: ''
  });

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);

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
          const currentProvince = profile.province || meta.province || '';
          const currentDistrict = profile.district || meta.district || '';
          
          setFormData({
            id: user.id,
            email: user.email,
            full_name: profile.full_name || meta.full_name || meta.name || '',
            avatar_url: profile.avatar_url || meta.avatar_url || meta.picture || AVATAR_OPTIONS[0],
            phone: profile.phone || meta.phone || '', 
            role: profile.role || meta.role || 'seeker', 
            
            // Location Fields
            province: currentProvince, 
            district: currentDistrict, 
            city_zone: profile.city_zone || '',
            address: profile.address || '',

            // Business Fields
            business_name: profile.business_name || meta.business_name || '',
            business_type: profile.business_type || meta.business_type || '',
            business_address: profile.business_address || meta.business_address || '',
            business_email: profile.business_email || meta.business_email || '',
            pan_number: profile.pan_number || meta.pan_number || ''
          });
    
          // Populate Location Lists
          if (currentProvince && nepalLocations[currentProvince]) {
            setAvailableDistricts(Object.keys(nepalLocations[currentProvince]));
            if (currentDistrict && nepalLocations[currentProvince][currentDistrict]) {
                setAvailableZones(nepalLocations[currentProvince][currentDistrict]);
            }
          }
        } catch (error) {
          console.error(error);
          setMessage({ type: 'error', text: 'Failed to load profile.' });
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

  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setFormData({ ...formData, province: newProvince, district: '', city_zone: '' });
    setAvailableZones([]);
    if (newProvince && nepalLocations[newProvince]) {
        setAvailableDistricts(Object.keys(nepalLocations[newProvince]));
    } else {
        setAvailableDistricts([]);
    }
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setFormData({ ...formData, district: newDistrict, city_zone: '' });
    if (formData.province && newDistrict && nepalLocations[formData.province][newDistrict]) {
        setAvailableZones(nepalLocations[formData.province][newDistrict]);
    } else {
        setAvailableZones([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMessage(null);

    const role = formData.role;
    const isBusiness = role === 'business';
    const isSeeker = role === 'seeker';

    try {
      if (formData.email !== originalEmail) {
         const { error } = await supabase.auth.updateUser({ email: formData.email });
         if (error) throw error;
         setMessage({ type: 'success', text: "Email updated! Check inbox." });
         setSaving(false); return; 
      }

      // Construct Data Payload - Clean for each role
      const updates = {
          id: formData.id,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          role: formData.role,
          updated_at: new Date(),
          
          // Location (Seeker & Business)
          province: (isSeeker || isBusiness) ? formData.province : null,
          district: (isSeeker || isBusiness) ? formData.district : null,
          city_zone: (isSeeker) ? formData.city_zone : null, // Only seeker needs granular zone in profile
          address: (isSeeker) ? formData.address : null,

          // Business Specific
          business_name: isBusiness ? formData.business_name : null,
          business_type: isBusiness ? formData.business_type : null,
          business_address: isBusiness ? formData.business_address : null,
          business_email: isBusiness ? formData.business_email : null,
          pan_number: isBusiness ? formData.pan_number : null,
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      
      setMessage({ type: 'success', text: "Profile updated! Redirecting..." });
      router.refresh();

      setTimeout(() => {
          if (role === 'admin') router.push('/admin');
          else if (role === 'tuition_manager') router.push('/admin/manage-tuitions');
          else if (['business', 'business_manager', 'business_tuition_manager'].includes(role)) router.push('/dashboard');
          else router.push('/find-jobs');
      }, 1500);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";
  const inputClass = "w-full p-3 pl-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none transition-all bg-white text-gray-900 font-medium";

  // --- THEME & ROLE CONFIG ---
  const getTheme = (role) => {
    switch(role) {
      case 'admin': 
        return { 
            banner: 'bg-red-900', 
            badge: 'bg-red-50 text-red-700 border-red-100', 
            alert: 'bg-red-50 text-red-900 border-red-200',
            icon: ShieldCheck, 
            label: 'Administrator' 
        };
      case 'business': 
        return { 
            banner: 'bg-blue-900', 
            badge: 'bg-blue-50 text-blue-700 border-blue-100', 
            alert: 'bg-blue-50 text-blue-900 border-blue-200',
            icon: Building2, 
            label: 'Business Owner' 
        };
      case 'tuition_manager': 
        return { 
            banner: 'bg-purple-900', 
            badge: 'bg-purple-50 text-purple-700 border-purple-100', 
            alert: 'bg-purple-50 text-purple-900 border-purple-200',
            icon: GraduationCap, 
            label: 'Tuition Manager' 
        };
      case 'business_manager': 
        return { 
            banner: 'bg-indigo-900', 
            badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', 
            alert: 'bg-indigo-50 text-indigo-900 border-indigo-200',
            icon: Briefcase, 
            label: 'Business Manager' 
        };
      case 'business_tuition_manager': 
        return { 
            banner: 'bg-amber-800', 
            badge: 'bg-amber-50 text-amber-800 border-amber-100', 
            alert: 'bg-amber-50 text-amber-900 border-amber-200',
            icon: Settings, 
            label: 'Operations Manager' 
        };
      default: 
        return { 
            banner: 'bg-slate-700', 
            badge: 'bg-gray-100 text-gray-700 border-gray-200', 
            alert: 'bg-gray-50 text-gray-900 border-gray-200',
            icon: User, 
            label: 'Job Seeker' 
        };
    }
  };

  const theme = getTheme(formData.role);
  const Icon = theme.icon;
  const isBusiness = formData.role === 'business';
  const isSeeker = formData.role === 'seeker';
  const isManagerOrAdmin = !isBusiness && !isSeeker;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />
      <main className="max-w-4xl mx-auto mt-8 px-4 sm:px-6">
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Dynamic Banner */}
          <div className={`h-32 relative ${theme.banner}`}>
             <div className="absolute inset-0 bg-white/10"></div>
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg relative group">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-gray-100">
                        <Image src={formData.avatar_url} alt="Avatar" width={128} height={128} className="object-cover" unoptimized />
                    </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 max-w-full px-2 custom-scrollbar">
                    {AVATAR_OPTIONS.map((url, idx) => (
                        <button key={idx} type="button" onClick={() => setFormData({...formData, avatar_url: url})} className={`w-12 h-12 rounded-full border-2 transition-all shrink-0 overflow-hidden bg-gray-50 ${formData.avatar_url === url ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent hover:border-gray-300'}`}>
                            <Image src={url} alt={`Avatar ${idx}`} width={48} height={48} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-extrabold text-gray-900">{formData.business_name || formData.full_name}</h1>
                <p className={`text-sm font-bold uppercase tracking-wide inline-flex items-center px-4 py-1.5 rounded-full mt-3 border ${theme.badge}`}>
                    <Icon className="w-4 h-4 mr-2"/> {theme.label} 
                </p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl mb-6 flex items-start animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-100' : 'bg-red-50 text-red-900 border border-red-100'}`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />}
                <span className="font-bold text-sm">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
              
              {/* =========================================================
                  1. JOB SEEKER PROFILE (Personal Info + Full Location)
              ========================================================= */}
              {isSeeker && (
                  <section className="space-y-6 animate-in fade-in">
                      <div>
                        <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`${inputClass} pl-11`} required placeholder="Enter your full name"/>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} pl-11`} required placeholder="9800000000" />
                        </div>
                      </div>
                      
                      {/* FULL LOCATION FOR SEEKER */}
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                           <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center">
                               <MapPin className="w-4 h-4 mr-2" /> Current Address
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Province</label>
                                    <select name="province" value={formData.province} onChange={handleProvinceChange} className={inputClass} required>
                                        <option value="">Select Province</option>
                                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">District</label>
                                    <select name="district" value={formData.district} onChange={handleDistrictChange} className={inputClass} required disabled={!formData.province}>
                                        <option value="">Select District</option>
                                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">City / Zone</label>
                                    {availableZones.length > 0 ? (
                                        <select name="city_zone" value={formData.city_zone} onChange={handleChange} className={inputClass} required disabled={!formData.district}>
                                            <option value="">Select Zone</option>
                                            {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" name="city_zone" value={formData.city_zone} onChange={handleChange} className={inputClass} placeholder="Area Name" required disabled={!formData.district}/>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Street Address</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="e.g. Ward 4, Chowk" required />
                                </div>
                           </div>
                      </div>
                  </section>
              )}

              {/* =========================================================
                  2. BUSINESS PROFILE (Business Info + Owner Info)
              ========================================================= */}
              {isBusiness && (
                  <section className="space-y-6 animate-in fade-in">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center border-b pb-2">
                         <Building2 className="w-4 h-4 mr-2" /> Company Information
                      </h3>
                      <div>
                        <label className={labelClass}>Business Name <span className="text-red-500">*</span></label>
                        <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} className={inputClass} required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Industry / Type <span className="text-red-500">*</span></label>
                            <select name="business_type" value={formData.business_type} onChange={handleChange} className={inputClass} required>
                                <option value="">Select Type</option>
                                <option value="Retail">Retail Store</option>
                                <option value="Food">Restaurant / Cafe</option>
                                <option value="Service">Service Provider</option>
                                <option value="Tech">IT / Education</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>PAN Number <span className="text-gray-400 text-xs">(Optional)</span></label>
                            <input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} className={inputClass} placeholder="Ex: 123456789" />
                          </div>
                      </div>
                      
                      <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                           <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Business Location</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <select name="province" value={formData.province} onChange={handleProvinceChange} className={inputClass} required>
                                    <option value="">Select Province</option>
                                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <select name="district" value={formData.district} onChange={handleChange} className={inputClass} required disabled={!formData.province}>
                                    <option value="">Select District</option>
                                    {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                           </div>
                           <input type="text" name="business_address" value={formData.business_address} onChange={handleChange} className={inputClass} placeholder="Full Address (e.g. Bhanu Chowk, Janakpur)" />
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center border-b pb-2 pt-4">
                         <User className="w-4 h-4 mr-2" /> Owner Contact
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Owner Name</label>
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputClass} required />
                          </div>
                          <div>
                            <label className={labelClass}>Contact Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} required />
                          </div>
                      </div>
                      <div>
                        <label className={labelClass}>Public Email <span className="text-gray-400 text-xs">(Optional)</span></label>
                        <input type="email" name="business_email" value={formData.business_email} onChange={handleChange} className={inputClass} placeholder="contact@business.com" />
                      </div>
                  </section>
              )}

              {/* =========================================================
                  3. MANAGER & ADMIN PROFILE (Simple Staff View)
              ========================================================= */}
              {isManagerOrAdmin && (
                  <section className="space-y-6 animate-in fade-in">
                      {/* FIXED ALERT BOX: Now uses specific theme.alert color */}
                      <div className={`p-4 rounded-xl border mb-6 flex items-start ${theme.alert}`}>
                          <ShieldCheck className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"/>
                          <div className="text-sm">
                              <strong>Staff Account Active:</strong> This profile is for internal verification only. It does not appear in public job searches.
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className={labelClass}>Staff Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`${inputClass} pl-11`} required placeholder="Your Name"/>
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Contact Mobile <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} pl-11`} required placeholder="9800000000" />
                            </div>
                          </div>
                      </div>
                  </section>
              )}

              {/* --- COMMON LOGIN EMAIL --- */}
              <div className="pt-6 border-t border-gray-100">
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

              <div className="pt-2 flex flex-col md:flex-row gap-4 items-center">
                <button type="submit" disabled={saving} className="w-full md:w-auto flex-1 bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition shadow-lg hover:shadow-xl flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed text-lg">
                  {saving ? <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving... </> : <> <Save className="w-5 h-5 mr-2" /> Save Profile </>}
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