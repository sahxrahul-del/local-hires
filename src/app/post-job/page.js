"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Briefcase, MapPin, ArrowLeft, Loader2, Clock, Phone, Building2, FileText, CheckCircle, LayoutDashboard, PlusCircle, X } from 'lucide-react';
import { nepalLocations, provinces } from '../../lib/nepalLocations';

const TIME_OPTIONS = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", 
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", 
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", 
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", 
  "8:00 PM", "8:30 PM", "9:00 PM"
];

export default function PostJob() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Job Form State
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [payRate, setPayRate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(''); 
  const [contactPhone, setContactPhone] = useState(''); 

  // Location State
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [cityZone, setCityZone] = useState('');
  const [address, setAddress] = useState(''); 
  const [landmark, setLandmark] = useState(''); 
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);

  // Schedule State
  const [workDayFrom, setWorkDayFrom] = useState('');
  const [workDayTo, setWorkDayTo] = useState('');
  const [workHourStart, setWorkHourStart] = useState('');
  const [workHourEnd, setWorkHourEnd] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      const role = profileData?.role;
      if (role !== 'business' && role !== 'admin') { 
          router.push('/find-jobs'); 
          return; 
      }

      setUser(user);
      setCompanyName(profileData?.business_name || profileData?.full_name || '');
      if (profileData?.phone) {
          setContactPhone(profileData.phone);
      }

      setLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setProvince(newProvince);
    setDistrict(''); 
    setCityZone('');
    setAvailableZones([]);

    if (newProvince && nepalLocations[newProvince]) {
        setAvailableDistricts(Object.keys(nepalLocations[newProvince]));
    } else {
        setAvailableDistricts([]);
    }
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setDistrict(newDistrict);
    setCityZone('');

    if (province && newDistrict && nepalLocations[province][newDistrict]) {
        setAvailableZones(nepalLocations[province][newDistrict]);
    } else {
        setAvailableZones([]);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const fullLocationString = `${cityZone}, ${landmark ? landmark + ', ' : ''}${address}`;
    const jobId = crypto.randomUUID();

    try {
        const { error } = await supabase.from('jobs').insert([
            {
                id: jobId,
                employer_id: user.id,
                company_name: companyName,
                title,
                description, 
                pay_rate: payRate,
                province,
                district,
                location: fullLocationString,
                category,
                work_day_from: workDayFrom,
                work_day_to: workDayTo,
                work_hour_start: workHourStart,
                work_hour_end: workHourEnd,
                contact_phone: contactPhone,
                
                // FORCE LIVE STATUS FOR FREE MODE
                payment_status: 'PAID', 
                payment_id: 'FREE_TIER', 
                
                views: 0
            },
        ]);

        if (error) throw error;
        setSubmitting(false);
        setShowSuccessModal(true); 

    } catch (error) {
        alert('Error posting job: ' + error.message);
        setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  const inputClass = "w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 relative">
      <Navbar />

      {/* --- SUCCESS POPUP MODAL --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative border border-gray-100">
               <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition">
                   <X className="w-5 h-5 text-gray-400" />
               </button>
               
               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <CheckCircle className="w-10 h-10 text-green-600" />
               </div>
               
               <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Job Posted Live!</h2>
               <p className="text-gray-500 mb-8">
                   Your listing is now visible to thousands of job seekers instantly.
               </p>
               
               <div className="space-y-3">
                   <button onClick={() => router.push('/dashboard')} className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition flex items-center justify-center">
                       <LayoutDashboard className="w-4 h-4 mr-2"/> Go to Dashboard
                   </button>
                   <button onClick={() => { setShowSuccessModal(false); window.location.reload(); }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center">
                       <PlusCircle className="w-4 h-4 mr-2"/> Post Another Job
                   </button>
               </div>
           </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-900 p-8 text-white text-center">
             <h1 className="text-3xl font-extrabold">Post a Free Job</h1>
             <p className="text-blue-100 mt-2">Find the perfect candidate instantly. 100% Free.</p>
          </div>

          <form onSubmit={handlePostJob} className="p-8 space-y-8">
            
            {/* Job Details Section */}
            <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Briefcase className="w-4 h-4 mr-2"/> Job Details
                </h3>
                
                <div>
                    <label className={labelClass}>Hiring For (Company Name) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Building2 className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          value={companyName} 
                          onChange={(e) => setCompanyName(e.target.value)} 
                          className={`${inputClass} pl-11`} 
                          placeholder="e.g. ABC School or Himalayan Cafe" 
                          required 
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Job Title <span className="text-red-500">*</span></label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Waiter, Sales Assistant" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} required>
                            <option value="">Select Category</option>
                            <option value="Retail">Retail</option>
                            <option value="Hospitality">Hospitality</option>
                            <option value="Labor">Labor</option>
                            <option value="Office">Office</option>
                            <option value="Education">Education</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Pay Rate <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 font-bold">Rs.</span>
                            <input type="text" value={payRate} onChange={(e) => setPayRate(e.target.value)} className={`${inputClass} pl-10`} placeholder="15000 / month" required />
                        </div>
                    </div>
                </div>
            </section>

            {/* Schedule Section */}
            <section className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Clock className="w-4 h-4 mr-2"/> Work Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>Work Days</label>
                        <div className="flex items-center gap-2">
                            <select value={workDayFrom} onChange={(e) => setWorkDayFrom(e.target.value)} className={inputClass} required>
                                <option value="">From</option>
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <span className="text-gray-400 font-bold">-</span>
                            <select value={workDayTo} onChange={(e) => setWorkDayTo(e.target.value)} className={inputClass} required>
                                <option value="">To</option>
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Work Hours</label>
                        <div className="flex items-center gap-2">
                            <select value={workHourStart} onChange={(e) => setWorkHourStart(e.target.value)} className={inputClass} required>
                                <option value="">Start</option>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-gray-400 font-bold">-</span>
                            <select value={workHourEnd} onChange={(e) => setWorkHourEnd(e.target.value)} className={inputClass} required>
                                <option value="">End</option>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <MapPin className="w-4 h-4 mr-2"/> Job Location
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className={labelClass}>1. Province <span className="text-red-500">*</span></label>
                        <select value={province} onChange={handleProvinceChange} className={inputClass} required>
                            <option value="">Select Province</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>2. District <span className="text-red-500">*</span></label>
                        <select value={district} onChange={handleDistrictChange} className={inputClass} required disabled={!province}>
                            <option value="">Select District</option>
                            {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>3. City Zone <span className="text-red-500">*</span></label>
                        {availableZones.length > 0 ? (
                            <select value={cityZone} onChange={(e) => setCityZone(e.target.value)} className={inputClass} required disabled={!district}>
                                <option value="">Select Area</option>
                                {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        ) : (
                            <input type="text" value={cityZone} onChange={(e) => setCityZone(e.target.value)} className={inputClass} placeholder="Specific Area" required disabled={!district}/>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>4. Address <span className="text-red-500">*</span></label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="e.g. Street 5" required />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>5. Landmark <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
                    <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} className={inputClass} placeholder="e.g. Behind Krishna Mandir" />
                </div>
            </section>

            {/* Contact Section */}
            <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Phone className="w-4 h-4 mr-2"/> Contact Information
                </h3>
                <div>
                    <label className={labelClass}>Contact Phone</label>
                    <input 
                      type="tel" 
                      value={contactPhone} 
                      onChange={(e) => setContactPhone(e.target.value)} 
                      className={inputClass} 
                      placeholder="9800000000" 
                    />
                </div>
            </section>

            {/* Description Section */}
            <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <FileText className="w-4 h-4 mr-2"/> Job Description
                </h3>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className={`${inputClass} min-h-[150px]`} 
                    placeholder="Describe the role, requirements, and benefits..." 
                    required 
                />
            </section>

            {/* Submit Button (Free Mode) */}
            <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg transition shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-800 shadow-blue-800/20"
            >
                {submitting ? (
                    <> <Loader2 className="animate-spin w-6 h-6 mr-2" /> Posting... </>
                ) : (
                    <> Post Job Now </>
                )}
            </button>
            
          </form>
        </div>
      </main>
    </div>
  );
}