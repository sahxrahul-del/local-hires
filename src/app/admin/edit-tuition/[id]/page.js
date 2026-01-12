"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../../components/Navbar'; // Adjust path (4 levels deep)
import { 
  ShieldCheck, Save, BookOpen, MapPin, Clock, 
  Phone, User, Banknote, Loader2, ArrowLeft, Hash 
} from 'lucide-react';
import { nepalLocations, provinces } from '../../../../lib/nepalLocations'; // Adjust path

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
  const { id } = useParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
  const [address, setAddress] = useState(''); // Fallback for old data or specific address
  
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);

  // Contact
  const [contactPhone, setContactPhone] = useState('');
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

        if (error) { alert("Tuition not found!"); router.push('/admin/manage-tuitions'); return; }

        // 3. Populate State
        setVacancyNo(data.vacancy_no);
        setClassLevel(data.class_level);
        setSubject(data.subject);
        setSalary(data.salary);
        setTeacherGender(data.teacher_gender);
        setDescription(data.description);
        setContactPhone(data.contact_phone);
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
        // Note: For existing data, 'location' might be a combined string. 
        // We'll put the raw location into 'address' so you don't lose it, 
        // or you can manually split it if you want.
        setAddress(data.location || ''); 

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
      
      const fullTimeSlot = `${timeStart} - ${timeEnd}`;
      
      // Combine Location: Zone + Landmark + Address (Address is fallback or street name)
      const displayLocation = `${cityZone}, ${landmark ? landmark + ', ' : ''}${address}`;

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
              contact_person: contactPerson,
              time_slot: fullTimeSlot
          })
          .eq('id', id);

      if (error) {
          alert("Error: " + error.message);
          setUpdating(false);
      } else {
          router.push('/admin/manage-tuitions'); 
      }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-blue-900"/></div>;

  const inputClass = "w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none transition-all bg-white text-gray-900 font-medium";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <Navbar />
      <main className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
        
        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-blue-900 p-8 text-white">
                <h1 className="text-3xl font-extrabold flex items-center"><ShieldCheck className="mr-3 w-8 h-8"/> Edit Tuition</h1>
                <p className="text-blue-100 mt-2">Update vacancy #{vacancyNo}</p>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-8">
                
                {/* Vacancy */}
                <section className="bg-blue-50 p-5 rounded-xl border border-blue-100">
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
                            <label className={labelClass}>Phone</label>
                            <input type="tel" className={inputClass} value={contactPhone} onChange={e => setContactPhone(e.target.value)} required/>
                        </div>
                        <div>
                            <label className={labelClass}>Contact Person</label>
                            <input type="text" className={inputClass} value={contactPerson} onChange={e => setContactPerson(e.target.value)}/>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea className={`${inputClass} min-h-[120px]`} value={description} onChange={e => setDescription(e.target.value)}></textarea>
                    </div>
                </section>

                <button type="submit" disabled={updating} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg flex items-center justify-center text-lg disabled:opacity-70">
                    {updating ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
                </button>

            </form>
        </div>
      </main>
    </div>
  );
}