"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
// ✅ FIXED IMPORTS: Using '@' allows us to find these files from anywhere
import Navbar from '@/components/Navbar'; 
import { nepalLocations, provinces } from '@/lib/nepalLocations'; 
import { 
  ShieldCheck, Save, BookOpen, MapPin, Clock, 
  Phone, User, Banknote, Loader2, ArrowLeft, Hash, 
  MessageCircle, CheckCircle, XCircle 
} from 'lucide-react';

const TIME_OPTIONS = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", 
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", 
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", 
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", 
  "8:00 PM", "8:30 PM", "9:00 PM"
];

export default function EditTuition() {
  const router = useRouter();
  const { id } = useParams(); // Gets ID from URL (e.g. /edit-tuition/123)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState(''); 
  
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);

  // Contact
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(''); // NEW FIELD
  const [contactPerson, setContactPerson] = useState('');

  // Schedule
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');

  useEffect(() => {
    const fetchTuitionData = async () => {
        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // 2. Fetch Data
        const { data, error } = await supabase
            .from('tuitions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) { 
            setErrorMsg("Tuition not found or deleted."); 
            return; 
        }

        // 3. Populate State
        setVacancyNo(data.vacancy_no);
        setClassLevel(data.class_level);
        setSubject(data.subject);
        setSalary(data.salary);
        setTeacherGender(data.teacher_gender);
        setDescription(data.description);
        setContactPhone(data.contact_phone);
        setWhatsappNumber(data.whatsapp_number || ''); // Load WhatsApp
        setContactPerson(data.contact_person);

        // Parse Time (e.g., "5:00 PM - 6:00 PM")
        if (data.time_slot) {
            const parts = data.time_slot.split(' - ');
            if (parts.length === 2) {
                setTimeStart(parts[0]);
                setTimeEnd(parts[1]);
            }
        }

        // Parse Location
        setProvince(data.province || '');
        setDistrict(data.district || '');
        
        // Try to separate location parts if possible, else dump in address
        const locParts = (data.location || '').split(',').map(s => s.trim());
        if (locParts.length >= 1) setCityZone(locParts[0]); 
        
        // Simple heuristic to recover address fields
        if (locParts.length === 3) {
            setLandmark(locParts[1]);
            setAddress(locParts[2]);
        } else if (locParts.length === 2) {
            setAddress(locParts[1]);
        } else {
             // Fallback: put everything except zone in address if format doesn't match
             setAddress(data.location ? data.location.replace(locParts[0] + ',', '').trim() : '');
        }

        // Load Lists
        if (data.province && nepalLocations[data.province]) {
            setAvailableDistricts(Object.keys(nepalLocations[data.province]));
            
            if (data.district && nepalLocations[data.province][data.district]) {
                setAvailableZones(nepalLocations[data.province][data.district]);
            }
        }

        setLoading(false);
    };
    fetchTuitionData();
  }, [id, router, supabase]);

  // Handle Location Changes
  const handleProvinceChange = (e) => {
    const newProv = e.target.value;
    setProvince(newProv);
    setDistrict(''); setCityZone(''); setAvailableZones([]);
    if (newProv) setAvailableDistricts(Object.keys(nepalLocations[newProv] || {}));
  };

  const handleDistrictChange = (e) => {
    const newDist = e.target.value;
    setDistrict(newDist);
    setCityZone('');
    if (province && newDist) setAvailableZones(nepalLocations[province][newDist] || []);
  };

  const handleUpdate = async (e) => {
      e.preventDefault();
      setUpdating(true);
      setErrorMsg('');
      
      const fullTimeSlot = `${timeStart} - ${timeEnd}`;
      const displayLocation = `${cityZone}, ${landmark ? landmark + ', ' : ''}${address}`;
      
      // Smart Fallback: If WhatsApp is empty, fallback to Contact Phone is handled in the View Page,
      // but here we just save what the user typed.
      const finalWhatsapp = whatsappNumber || contactPhone;

      const { error } = await supabase
          .from('tuitions')
          .update({
              vacancy_no: vacancyNo,
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
              time_slot: fullTimeSlot
          })
          .eq('id', id);

      if (error) {
          setErrorMsg(error.message);
          setUpdating(false);
      } else {
          setShowSuccess(true);
      }
  };

  const handleSuccessRedirect = () => {
      router.push('/admin/manage-tuitions');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-purple-900 w-10 h-10" /></div>;

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
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Updated!</h3>
                <p className="text-gray-500 mb-6">Tuition details have been saved successfully.</p>
                <button onClick={handleSuccessRedirect} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20">
                    Back to Dashboard
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
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Error</h3>
                <p className="text-gray-500 mb-6">{errorMsg}</p>
                <button onClick={() => setErrorMsg('')} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20">
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
                <h1 className="text-3xl font-extrabold flex items-center relative z-10"><ShieldCheck className="mr-3 w-8 h-8"/> Edit Tuition</h1>
                <p className="text-purple-100 mt-2 relative z-10">Update vacancy #{vacancyNo}</p>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-8">
                
                {/* Vacancy */}
                <section className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                     <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider flex items-center mb-4">
                        <Hash className="w-4 h-4 mr-2"/> Record Keeping
                    </h3>
                    <div>
                        <label className={labelClass}>Vacancy Number</label>
                        <input type="number" className={inputClass} value={vacancyNo} onChange={e => setVacancyNo(e.target.value)} required/>
                    </div>
                </section>

                {/* Academic */}
                <section className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <BookOpen className="w-4 h-4 mr-2"/> Academic Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Class / Grade</label>
                            <input type="text" className={inputClass} value={classLevel} onChange={e => setClassLevel(e.target.value)} required/>
                        </div>
                        <div>
                            <label className={labelClass}>Subject(s)</label>
                            <input type="text" className={inputClass} value={subject} onChange={e => setSubject(e.target.value)} />
                        </div>
                    </div>
                </section>

                {/* Schedule */}
                <section className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <Clock className="w-4 h-4 mr-2"/> Schedule & Pay
                    </h3>
                    <div>
                        <label className={labelClass}>Time Slot</label>
                        <div className="flex items-center gap-2">
                            <select value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className={inputClass} required>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="font-bold">-</span>
                            <select value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className={inputClass} required>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div>
                            <label className={labelClass}>Salary</label>
                            <input type="text" className={inputClass} value={salary} onChange={e => setSalary(e.target.value)} required/>
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

                {/* Location */}
                <section className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <MapPin className="w-4 h-4 mr-2"/> Exact Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Province</label>
                            <select className={inputClass} value={province} onChange={handleProvinceChange} required>
                                <option value="">Select Province</option>
                                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>District</label>
                            <select className={inputClass} value={district} onChange={handleDistrictChange} required disabled={!province}>
                                <option value="">Select District</option>
                                {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                             <label className={labelClass}>City Zone</label>
                             {availableZones.length > 0 ? (
                                <select className={inputClass} value={cityZone} onChange={e => setCityZone(e.target.value)}>
                                    <option value="">Select Area (Optional)</option>
                                    {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                                </select>
                             ) : (
                                <input type="text" className={inputClass} value={cityZone} onChange={e => setCityZone(e.target.value)} placeholder="Area"/>
                             )}
                        </div>
                        <div>
                             <label className={labelClass}>Address / Details</label>
                             <input type="text" className={inputClass} value={address} onChange={e => setAddress(e.target.value)} required/>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Landmark (Optional)</label>
                        <input type="text" className={inputClass} value={landmark} onChange={e => setLandmark(e.target.value)}/>
                    </div>
                </section>

                {/* Contact */}
                <section className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                        <Phone className="w-4 h-4 mr-2"/> Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Phone <span className="text-red-500">*</span></label>
                            <input type="tel" className={inputClass} value={contactPhone} onChange={e => setContactPhone(e.target.value)} required/>
                        </div>
                        
                        {/* WHATSAPP FIELD (New) */}
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
                         <input type="text" className={inputClass} value={contactPerson} onChange={e => setContactPerson(e.target.value)}/>
                    </div>

                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea className={`${inputClass} min-h-[120px]`} value={description} onChange={e => setDescription(e.target.value)}></textarea>
                    </div>
                </section>

                <button type="submit" disabled={updating} className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold hover:bg-purple-800 transition shadow-lg flex items-center justify-center text-lg disabled:opacity-70">
                    {updating ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
                </button>

            </form>
        </div>
      </main>
    </div>
  );
}