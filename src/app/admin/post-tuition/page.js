"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar'; 
import { 
  ShieldCheck, Plus, BookOpen, MapPin, Clock, 
  Phone, User, Banknote, Loader2, ArrowLeft, Hash, MessageCircle, CheckCircle, XCircle 
} from 'lucide-react';
import { nepalLocations, provinces } from '../../../lib/nepalLocations';

const TIME_OPTIONS = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", 
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", 
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", 
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", 
  "8:00 PM", "8:30 PM", "9:00 PM"
];

export default function PostTuitionPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Modals State
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [vacancyNo, setVacancyNo] = useState(''); 
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [salary, setSalary] = useState('');
  const [teacherGender, setTeacherGender] = useState('Any');
  const [description, setDescription] = useState('');
  
  // Location
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState(''); 
  const [cityZone, setCityZone] = useState(''); 
  const [address, setAddress] = useState(''); 
  const [landmark, setLandmark] = useState(''); 
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);

  // Contact
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(''); 
  const [contactPerson, setContactPerson] = useState('');

  // Schedule
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role;

        // Allowed: Admin, Tuition Manager, Business-Tuition Manager
        const allowedRoles = ['admin', 'tuition_manager', 'business_tuition_manager'];
        
        if (!allowedRoles.includes(role)) {
            router.push('/'); 
        } else {
            setHasAccess(true);
        }
        setLoading(false);
    };
    checkAccess();
  }, [router, supabase]);

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setProvince(selectedProvince);
    setDistrict(''); setCityZone(''); setAvailableZones([]);
    if (selectedProvince && nepalLocations[selectedProvince]) {
        setAvailableDistricts(Object.keys(nepalLocations[selectedProvince]));
    }
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setDistrict(selectedDistrict);
    setCityZone('');
    if (province && selectedDistrict && nepalLocations[province][selectedDistrict]) {
        setAvailableZones(nepalLocations[province][selectedDistrict]);
    }
  };

  const handlePost = async (e) => {
      e.preventDefault();
      setPosting(true);
      setErrorMsg(''); // Reset error

      const { data: { user } } = await supabase.auth.getUser();
      const fullTimeSlot = `${timeStart} - ${timeEnd}`;
      const displayLocation = `${cityZone}, ${landmark ? landmark + ', ' : ''}${address}`;
      const finalWhatsapp = whatsappNumber || contactPhone;

      const { error } = await supabase.from('tuitions').insert({
          vacancy_no: vacancyNo,
          posted_by: user.id,
          class_level: classLevel,
          subject,
          salary,
          teacher_gender: teacherGender,
          province,
          district,
          location: displayLocation, 
          description,
          contact_phone: contactPhone,
          whatsapp_number: finalWhatsapp, 
          contact_person: contactPerson,
          time_slot: fullTimeSlot,
          status: 'active'
      });

      if (error) {
          setErrorMsg(error.message); // Show Error Modal
          setPosting(false);
      } else {
          setShowSuccess(true); // Show Success Modal
          // Don't setPosting(false) yet, keep spinner until redirect happens
      }
  };

  const handleSuccessRedirect = () => {
      router.push('/admin/manage-tuitions');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-purple-900 w-10 h-10" /></div>;
  if (!hasAccess) return null;

  const inputClass = "w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-900 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 relative">
      <Navbar />

      {/* --- SUCCESS MODAL --- */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-500 mb-6">The tuition vacancy has been published successfully.</p>
                <button 
                    onClick={handleSuccessRedirect}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
      )}

      {/* --- ERROR MODAL --- */}
      {errorMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setErrorMsg('')}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Error Failed</h3>
                <p className="text-gray-500 mb-6">{errorMsg}</p>
                <button 
                    onClick={() => setErrorMsg('')}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20"
                >
                    Try Again
                </button>
            </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
        
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-purple-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <h1 className="text-3xl font-extrabold flex items-center relative z-10"><ShieldCheck className="mr-3 w-8 h-8"/> Post Tuition</h1>
                <p className="text-purple-100 mt-2 relative z-10">Create a new vacancy record for students/teachers.</p>
            </div>

            <form onSubmit={handlePost} className="p-8 space-y-8">
                {/* 0. VACANCY NO */}
                <section className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                     <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider flex items-center mb-4">
                        <Hash className="w-4 h-4 mr-2"/> Record Keeping
                    </h3>
                    <div>
                        <label className={labelClass}>Vacancy Number</label>
                        <input type="number" className={inputClass} value={vacancyNo} onChange={e => setVacancyNo(e.target.value)} required placeholder="e.g. 1001"/>
                    </div>
                </section>

                {/* 1. Academic Details */}
                <section className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <BookOpen className="w-4 h-4 mr-2"/> Academic Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Class / Grade</label>
                            <input type="text" className={inputClass} value={classLevel} onChange={e => setClassLevel(e.target.value)} required placeholder="e.g. Class 10"/>
                        </div>
                        <div>
                            <label className={labelClass}>Subject(s)</label>
                            <input type="text" className={inputClass} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Math, Science"/>
                        </div>
                    </div>
                </section>

                {/* 2. Schedule */}
                <section className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <Clock className="w-4 h-4 mr-2"/> Schedule & Pay
                    </h3>
                    <div>
                        <label className={labelClass}>Time Slot</label>
                        <div className="flex items-center gap-2">
                            <select value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className={inputClass} required>
                                <option value="">Start Time</option>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="font-bold text-gray-400">-</span>
                            <select value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className={inputClass} required>
                                <option value="">End Time</option>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div>
                            <label className={labelClass}>Monthly Salary</label>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input type="text" className={`${inputClass} pl-10`} value={salary} onChange={e => setSalary(e.target.value)} required placeholder="e.g. Rs. 5000"/>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Teacher Gender</label>
                            <select className={inputClass} value={teacherGender} onChange={e => setTeacherGender(e.target.value)}>
                                <option value="Any">Any Gender</option>
                                <option value="Male">Male Only</option>
                                <option value="Female">Female Only</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* 3. Location */}
                <section className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <MapPin className="w-4 h-4 mr-2"/> Exact Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>1. Province</label>
                            <select className={inputClass} value={province} onChange={handleProvinceChange} required>
                                <option value="">Select Province</option>
                                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>2. District</label>
                            <select className={inputClass} value={district} onChange={handleDistrictChange} required disabled={!province}>
                                <option value="">Select District</option>
                                {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                             <label className={labelClass}>3. City Zone</label>
                             {availableZones.length > 0 ? (
                                <select className={inputClass} value={cityZone} onChange={e => setCityZone(e.target.value)} required disabled={!district}>
                                    <option value="">Select Area</option>
                                    {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                                </select>
                             ) : (
                                <input type="text" className={inputClass} value={cityZone} onChange={e => setCityZone(e.target.value)} placeholder="Type Area" required disabled={!district}/>
                             )}
                        </div>
                        <div>
                             <label className={labelClass}>4. Address / Details</label>
                             <input type="text" className={inputClass} value={address} onChange={e => setAddress(e.target.value)} required placeholder="Street, Ward No."/>
                        </div>
                    </div>
                    <div>
                         <label className={labelClass}>5. Landmark</label>
                         <input type="text" className={inputClass} value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Near Temple/Hospital"/>
                    </div>
                </section>

                {/* 4. Contact */}
                <section className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <Phone className="w-4 h-4 mr-2"/> Contact Info
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Contact Phone <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input type="tel" className={`${inputClass} pl-10`} value={contactPhone} onChange={e => setContactPhone(e.target.value)} required placeholder="98XXXXXXXX"/>
                            </div>
                        </div>
                        
                        {/* WHATSAPP FIELD */}
                        <div>
                            <label className={labelClass}>WhatsApp Number <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                            <div className="relative">
                                <MessageCircle className="absolute left-3 top-3.5 w-5 h-5 text-green-500" />
                                <input 
                                    type="tel" 
                                    className={`${inputClass} pl-10`} 
                                    value={whatsappNumber} 
                                    onChange={e => setWhatsappNumber(e.target.value)} 
                                    placeholder="Same as phone if empty"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                         <label className={labelClass}>Contact Person</label>
                         <div className="relative">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="text" className={`${inputClass} pl-10`} value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Parent / Student Name"/>
                         </div>
                    </div>
                    
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea className={`${inputClass} min-h-[120px]`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional requirements..."></textarea>
                    </div>
                </section>

                <button type="submit" disabled={posting} className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold hover:bg-purple-800 transition shadow-lg flex items-center justify-center text-lg disabled:opacity-70">
                    {posting ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : <><Plus className="w-5 h-5 mr-2" /> Publish Tuition</>}
                </button>
            </form>
        </div>
      </main>
    </div>
  );
}