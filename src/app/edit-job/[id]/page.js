"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { Briefcase, MapPin, ArrowLeft, Loader2, Clock, Phone, Trash2, AlertTriangle, X, Building2 } from 'lucide-react';
import { nepalLocations, provinces } from '../../../lib/nepalLocations';

const TIME_OPTIONS = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", 
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", 
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", 
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", 
  "8:00 PM", "8:30 PM", "9:00 PM"
];

export default function EditJob() {
  const router = useRouter();
  const { id } = useParams(); 
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
    const fetchJobDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      
      if (profile?.role !== 'business' && profile?.role !== 'admin') { 
          router.push('/find-jobs'); 
          return; 
      }

      const { data: job, error } = await supabase.from('jobs').select('*').eq('id', id).single();

      if (error) { alert("Job not found!"); router.push('/dashboard'); return; }

      // Populate State
      setCompanyName(job.company_name || '');
      setTitle(job.title);
      setPayRate(job.pay_rate);
      setDescription(job.description);
      setCategory(job.category || '');
      setContactPhone(job.contact_phone || ''); 

      // Location
      setProvince(job.province || '');
      setDistrict(job.district || '');
      setAddress(job.location || ''); 

      setWorkDayFrom(job.work_day_from || '');
      setWorkDayTo(job.work_day_to || '');
      setWorkHourStart(job.work_hour_start || '');
      setWorkHourEnd(job.work_hour_end || '');

      // Load Lists
      if (job.province && nepalLocations[job.province]) {
         setAvailableDistricts(Object.keys(nepalLocations[job.province]));
         if (job.district && nepalLocations[job.province][job.district]) {
             setAvailableZones(nepalLocations[job.province][job.district]);
         }
      }

      setLoading(false);
    };

    fetchJobDetails();
  }, [id, router, supabase]);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const fullLocationString = `${cityZone}, ${landmark ? landmark + ', ' : ''}${address}`;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          company_name: companyName,
          title,
          description,
          pay_rate: payRate,
          location: fullLocationString,
          province,
          district,
          category,
          work_day_from: workDayFrom,
          work_day_to: workDayTo,
          work_hour_start: workHourStart,
          work_hour_end: workHourEnd,
          contact_phone: contactPhone,
          
          // --- SECURITY FIX: FORCE RE-APPROVAL ---
          // This prevents "Bait & Switch" scams. 
          // If a user edits a live job, it goes back to pending until you approve it.
          payment_status: 'PENDING' 
        })
        .eq('id', id);

      if (error) throw error;
      
      alert("Job updated successfully! It has been submitted for admin approval.");
      router.push('/dashboard'); 
    } catch (error) {
      alert('Error updating job: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async () => {
      setDeleting(true);
      try {
          const { error } = await supabase.from('jobs').delete().eq('id', id);
          if (error) throw error;
          router.push('/dashboard');
      } catch (error) {
          alert(error.message);
          setDeleting(false);
          setShowDeleteModal(false);
      }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-900 w-10 h-10" /></div>;

  const inputClass = "w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium";
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 relative">
      <Navbar />

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-red-100 p-2.5 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <button onClick={() => setShowDeleteModal(false)} className="hover:bg-gray-100 p-1 rounded-full transition"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Delete Job Listing?</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-gray-800">{title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg flex items-center justify-center">
                {deleting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto mt-8 px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 transition font-bold text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="flex items-center text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl border border-red-100 transition shadow-sm">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Job
            </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-900 p-8 text-white">
             <h1 className="text-3xl font-extrabold">Edit Job Listing</h1>
             <p className="text-blue-100 mt-2">Update details for {title}.</p>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-8">
            
            <section className="space-y-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Briefcase className="w-4 h-4 mr-2"/> Job Details
                </h3>
                
                {/* --- EDIT COMPANY NAME --- */}
                <div>
                    <label className={labelClass}>Company Name</label>
                    <div className="relative">
                        <Building2 className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          value={companyName} 
                          onChange={(e) => setCompanyName(e.target.value)} 
                          className={`${inputClass} pl-11`} 
                          required 
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Job Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>Category</label>
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
                        <label className={labelClass}>Pay Rate</label>
                        <input type="text" value={payRate} onChange={(e) => setPayRate(e.target.value)} className={inputClass} required />
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>1. Province</label>
                        <select value={province} onChange={handleProvinceChange} className={inputClass} required>
                            <option value="">Select Province</option>
                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>2. District</label>
                        <select value={district} onChange={handleDistrictChange} className={inputClass} required disabled={!province}>
                            <option value="">Select District</option>
                            {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className={labelClass}>3. City Zone</label>
                        {availableZones.length > 0 ? (
                            <select value={cityZone} onChange={(e) => setCityZone(e.target.value)} className={inputClass} disabled={!district}>
                                <option value="">Select Area (Optional)</option>
                                {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        ) : (
                            <input type="text" value={cityZone} onChange={(e) => setCityZone(e.target.value)} className={inputClass} placeholder="Specific Area" disabled={!district}/>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>4. Address</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} required />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>5. Landmark</label>
                    <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} className={inputClass} />
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
                    />
                </div>
            </section>

            <section className="space-y-5">
                <div>
                    <label className={labelClass}>Job Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} min-h-[150px]`} required />
                </div>
            </section>

            <button type="submit" disabled={updating} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition shadow-lg hover:shadow-xl flex justify-center items-center text-lg disabled:opacity-70">
                {updating ? <Loader2 className="animate-spin w-6 h-6 mr-2" /> : 'Update Job Listing'}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}