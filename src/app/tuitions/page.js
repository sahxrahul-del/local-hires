"use client";
import { useEffect, useState, Fragment } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Navbar from '../../components/Navbar';
import { 
  MapPin, Clock, Banknote, User, BookOpen, Phone, X, Search, 
  Loader2, ArrowRight, MessageCircle 
} from 'lucide-react';
import { nepalLocations, provinces } from '../../lib/nepalLocations';
import AdBanner from '../../components/AdBanner'; 

export default function Tuitions() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [tuitions, setTuitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTuition, setSelectedTuition] = useState(null);

  // --- 3-LEVEL FILTERS ---
  const [filterProvince, setFilterProvince] = useState('All Provinces');
  const [filterDistrict, setFilterDistrict] = useState('All Districts');
  const [filterZone, setFilterZone] = useState('All Zones'); 

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableZones, setAvailableZones] = useState([]); 

  // --- SMART LOCATION LOGIC ---
  useEffect(() => {
      if (filterProvince !== 'All Provinces') {
          const provinceData = nepalLocations[filterProvince] || {};
          setAvailableDistricts(Object.keys(provinceData));
          setFilterDistrict('All Districts'); setFilterZone('All Zones'); setAvailableZones([]);
      } else {
          setAvailableDistricts([]); setFilterDistrict('All Districts'); setFilterZone('All Zones'); setAvailableZones([]);
      }
  }, [filterProvince]);

  useEffect(() => {
      if (filterDistrict !== 'All Districts' && filterProvince !== 'All Provinces') {
          const zones = nepalLocations[filterProvince][filterDistrict] || [];
          setAvailableZones(zones);
          setFilterZone('All Zones');
      } else {
          setAvailableZones([]); setFilterZone('All Zones');
      }
  }, [filterDistrict, filterProvince]);

  // --- SERVER-SIDE FILTERING ---
  useEffect(() => {
    const fetchTuitions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('tuitions')
                .select('*')
                .eq('status', 'active') 
                .order('created_at', { ascending: false });
            
            if (filterProvince !== 'All Provinces') {
                query = query.eq('province', filterProvince);
            }
            if (filterDistrict !== 'All Districts') {
                query = query.eq('district', filterDistrict);
            }
            if (filterZone !== 'All Zones') {
                query = query.ilike('location', `%${filterZone}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTuitions(data || []);
        } catch (error) {
            console.error('Error fetching tuitions:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchTuitions();
  }, [filterProvince, filterDistrict, filterZone, supabase]);

  // --- SMART WHATSAPP LINK ---
  // Uses whatsapp_number if available, otherwise falls back to contact_phone
  const getWhatsappLink = (tuition) => {
      const numberToUse = tuition.whatsapp_number || tuition.contact_phone;
      if (!numberToUse) return '#';
      
      const cleanNumber = numberToUse.replace(/\D/g, ''); // Remove non-digits
      const fullNumber = cleanNumber.length === 10 ? `977${cleanNumber}` : cleanNumber;
      
      return `https://wa.me/${fullNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Navbar />

      {/* --- POPUP MODAL (Glass + Purple Theme) --- */}
      {selectedTuition && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedTuition(null)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-purple-900 p-6 text-white relative shrink-0">
                <button onClick={() => setSelectedTuition(null)} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-start gap-2">
                    <span className="bg-purple-800 border border-purple-700 text-xs font-bold px-3 py-1 rounded-full text-purple-100 uppercase tracking-wider">
                        Vacancy #{selectedTuition.vacancy_no}
                    </span>
                    <h3 className="text-2xl font-bold">Class {selectedTuition.class_level} Tutor</h3>
                    <p className="opacity-90 flex items-center text-sm font-medium text-purple-200">
                        <MapPin className="w-3.5 h-3.5 mr-1"/> {selectedTuition.location}, {selectedTuition.district}
                    </p>
                </div>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto">
                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="bg-purple-200 p-2.5 rounded-lg text-purple-900 shrink-0">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-purple-600 font-bold uppercase">Subject(s) Required</p>
                        <p className="font-extrabold text-gray-900 text-lg">{selectedTuition.subject || 'All Subjects'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Time Slot</p>
                        <p className="font-bold text-gray-800 flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-2 text-orange-500"/> {selectedTuition.time_slot}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Salary</p>
                        <p className="font-bold text-green-700 flex items-center text-sm">
                            <Banknote className="w-4 h-4 mr-2 text-green-600"/> {selectedTuition.salary}
                        </p>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 font-bold uppercase">Preference</span>
                    </div>
                    <p className={`font-bold px-4 py-2 rounded-lg text-sm inline-flex items-center ${selectedTuition.teacher_gender === 'Female' ? 'bg-pink-50 text-pink-700 border border-pink-100' : selectedTuition.teacher_gender === 'Male' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-700'}`}>
                        {selectedTuition.teacher_gender === 'Any' ? 'Any Gender' : `${selectedTuition.teacher_gender} Teacher Only`}
                    </p>
                </div>

                {selectedTuition.description && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
                        <span className="font-bold text-gray-900 block mb-1">Additional Note:</span>
                        {selectedTuition.description}
                    </div>
                )}

                {/* --- CONTACT ACTIONS --- */}
                <div className="pt-4 mt-2 border-t border-gray-100 space-y-3">
                    <p className="text-center text-gray-400 text-xs uppercase font-bold mb-1">Contact to Apply</p>
                    
                    {/* 1. CALL BUTTON */}
                    <a href={`tel:${selectedTuition.contact_phone}`} className="flex items-center justify-center w-full bg-blue-900 text-white py-3.5 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-900/20 active:scale-95 text-lg">
                        <Phone className="w-5 h-5 mr-2" /> Call {selectedTuition.contact_phone}
                    </a>

                    {/* 2. WHATSAPP BUTTON (UPDATED LOGIC) */}
                    <a 
                        href={getWhatsappLink(selectedTuition)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full bg-[#25D366] text-white py-3.5 rounded-xl font-bold hover:bg-[#20bd5a] transition shadow-lg shadow-green-500/20 active:scale-95 text-lg"
                    >
                        <MessageCircle className="w-5 h-5 mr-2 fill-current" /> Chat on WhatsApp
                    </a>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HERO HEADER --- */}
      <div className="bg-purple-900 text-white pt-16 pb-24 px-6 text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-10 translate-x-10 animate-blob"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-10 -translate-x-10 animate-blob animation-delay-2000"></div>

         <div className="relative z-10">
             <span className="inline-block py-1 px-3 rounded-full bg-purple-800 text-purple-200 text-xs font-bold mb-4 border border-purple-700">
                🚀 For Teachers & Students
             </span>
             <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Find Home Tuitions</h1>
             <p className="text-purple-100 text-lg max-w-2xl mx-auto mb-10">Connect directly with students and parents looking for tutors in your area.</p>

             {/* --- 3-LEVEL FILTER BAR --- */}
             <div className="max-w-5xl mx-auto p-2 bg-white/10 backdrop-blur-md rounded-2xl flex flex-col md:flex-row gap-3 border border-white/20 shadow-2xl">
                <div className="flex-1 relative group">
                    <MapPin className="absolute left-4 top-3.5 text-purple-200 w-5 h-5 group-hover:text-white transition"/>
                    <select value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} className="w-full bg-purple-900/60 text-white rounded-xl pl-11 pr-4 py-3.5 outline-none font-medium appearance-none hover:bg-purple-800/80 transition cursor-pointer border border-transparent focus:border-purple-300">
                        <option>All Provinces</option>
                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="flex-1 relative group">
                    <MapPin className="absolute left-4 top-3.5 text-purple-200 w-5 h-5 group-hover:text-white transition"/>
                    <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="w-full bg-purple-900/60 text-white rounded-xl pl-11 pr-4 py-3.5 outline-none font-medium appearance-none hover:bg-purple-800/80 transition cursor-pointer border border-transparent focus:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={filterProvince === 'All Provinces'}>
                        <option>All Districts</option>
                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="flex-1 relative group">
                    <MapPin className="absolute left-4 top-3.5 text-purple-200 w-5 h-5 group-hover:text-white transition"/>
                    <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className="w-full bg-purple-900/60 text-white rounded-xl pl-11 pr-4 py-3.5 outline-none font-medium appearance-none hover:bg-purple-800/80 transition cursor-pointer border border-transparent focus:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={filterDistrict === 'All Districts' || availableZones.length === 0}>
                        <option>All Zones / Areas</option>
                        {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                </div>
             </div>
         </div>
      </div>

      {/* --- GRID --- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 pb-12">
        {loading ? (
            <div className="flex justify-center py-20 bg-white rounded-3xl shadow-xl min-h-[300px] items-center">
                <div className="text-center">
                    <Loader2 className="animate-spin w-12 h-12 text-purple-900 mx-auto mb-4"/>
                    <p className="text-gray-500 font-medium">Finding perfect tuitions...</p>
                </div>
            </div>
        ) : tuitions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No tuitions found</h3>
                <p className="text-gray-500">Try changing your location filters to see more results.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tuitions.map((item, index) => (
                    <Fragment key={item.id}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col h-full cursor-pointer" onClick={() => setSelectedTuition(item)}>
                            <div className="bg-gradient-to-r from-purple-50/50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-[10px] font-extrabold text-purple-900 bg-purple-100 px-3 py-1 rounded-full tracking-wider border border-purple-200">
                                    #{item.vacancy_no}
                                </span>
                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center border ${item.teacher_gender === 'Female' ? 'bg-pink-50 text-pink-700 border-pink-100' : item.teacher_gender === 'Male' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    <User className="w-3 h-3 mr-1"/> {item.teacher_gender}
                                </span>
                            </div>
                            <div className="p-6 flex-1">
                                <h3 className="text-2xl font-extrabold text-gray-900 mb-3 group-hover:text-purple-700 transition">
                                    Class {item.class_level}
                                </h3>
                                <p className="text-sm font-bold text-purple-700 mb-6 flex items-center bg-purple-50 w-fit px-4 py-2 rounded-lg border border-purple-100">
                                    <BookOpen className="w-4 h-4 mr-2"/> {item.subject || 'All Subjects'}
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start text-gray-600 text-sm">
                                        <Clock className="w-5 h-5 mr-3 text-orange-400 mt-0.5 shrink-0"/>
                                        <span className="font-medium pt-0.5">{item.time_slot}</span>
                                    </div>
                                    <div className="flex items-start text-gray-600 text-sm">
                                        <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5 shrink-0"/>
                                        <span className="font-medium pt-0.5 line-clamp-2">{item.location}, {item.district}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 pb-6 pt-0 mt-auto">
                                <div className="flex justify-between items-center border-t border-gray-100 pt-5 mb-5">
                                     <div className="flex items-center text-gray-900 font-extrabold text-lg">
                                        <Banknote className="w-5 h-5 mr-2 text-green-600"/>
                                        {item.salary}
                                     </div>
                                </div>
                                <button className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold text-base hover:bg-purple-800 transition flex items-center justify-center shadow-md hover:shadow-lg">
                                    View Details <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>
                        </div>

                        {/* --- HIGH DENSITY ADS: EVERY 2 ITEMS --- */}
                        {(index + 1) % 6 === 0 && (
                            <div className="col-span-1 md:col-span-2 my-2 animate-in fade-in">
                                <AdBanner 
                                    dataAdSlot="1234567890" 
                                    dataAdFormat="fluid" 
                                    dataLayoutKey="-fb+5w+4e-db+86"
                                />
                            </div>
                        )}
                    </Fragment>
                ))}
            </div>
        )}

        {/* --- BOTTOM AD --- */}
        <div className="mt-16">
            <AdBanner 
                dataAdSlot="1234567890" 
                dataAdFormat="auto" 
                dataFullWidthResponsive="true" 
            />
        </div>
      </main>
    </div>
  );
}