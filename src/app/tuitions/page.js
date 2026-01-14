"use client";
import { useEffect, useState, Fragment } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Navbar from '../../components/Navbar';
import { MapPin, Clock, Banknote, User, BookOpen, Phone, X, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import { nepalLocations, provinces } from '../../lib/nepalLocations';
import AdBanner from '../../components/AdBanner'; // Import Ad Component

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

  // Dynamic Lists
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableZones, setAvailableZones] = useState([]); 

  // --- SMART LOCATION LOGIC (Updates Dropdowns) ---
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

  // --- OPTIMIZED SERVER-SIDE FILTERING (The Speed Fix) ---
  useEffect(() => {
    const fetchTuitions = async () => {
        setLoading(true);
        try {
            // 1. Start the query
            let query = supabase
                .from('tuitions')
                .select('*')
                .order('created_at', { ascending: false });
            
            // 2. Apply Filters (Server-Side)
            if (filterProvince !== 'All Provinces') {
                query = query.eq('province', filterProvince);
            }
            if (filterDistrict !== 'All Districts') {
                query = query.eq('district', filterDistrict);
            }
            if (filterZone !== 'All Zones') {
                // Uses 'ilike' to find the zone inside the location text
                query = query.ilike('location', `%${filterZone}%`);
            }

            // 3. Fetch only the matching data
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
  }, [filterProvince, filterDistrict, filterZone, supabase]); // Re-runs when filters change

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Navbar />

      {/* --- POPUP MODAL --- */}
      {selectedTuition && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100">
            <div className="bg-blue-900 p-6 text-white relative">
                <button onClick={() => setSelectedTuition(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition">
                    <X className="w-6 h-6" />
                </button>
                <span className="bg-blue-800 text-xs font-bold px-2 py-1 rounded text-blue-100 mb-2 inline-block border border-blue-700">
                    Vacancy #{selectedTuition.vacancy_no}
                </span>
                <h3 className="text-2xl font-bold">Class {selectedTuition.class_level}</h3>
                <p className="opacity-90 flex items-center mt-1 text-sm font-medium"><MapPin className="w-3.5 h-3.5 mr-1"/> {selectedTuition.location}, {selectedTuition.district}</p>
            </div>
            
            <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700 shrink-0">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Subject(s)</p>
                        <p className="font-bold text-gray-900 text-lg">{selectedTuition.subject || 'All Subjects'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Time</p>
                        <p className="font-bold text-gray-800 flex items-center text-sm"><Clock className="w-4 h-4 mr-1.5 text-orange-500"/> {selectedTuition.time_slot}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Salary</p>
                        <p className="font-bold text-green-700 flex items-center text-sm"><Banknote className="w-4 h-4 mr-1.5"/> {selectedTuition.salary}</p>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 font-bold uppercase">Teacher Requirement</span>
                    </div>
                    <p className={`font-bold px-3 py-2 rounded-lg text-sm inline-block ${selectedTuition.teacher_gender === 'Female' ? 'bg-pink-100 text-pink-800' : selectedTuition.teacher_gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {selectedTuition.teacher_gender} Teacher Wanted
                    </p>
                </div>

                {selectedTuition.description && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-900 leading-relaxed">
                        <span className="font-bold block mb-1">Note:</span>
                        {selectedTuition.description}
                    </div>
                )}

                <div className="pt-4 mt-2 border-t border-gray-100">
                    <p className="text-center text-gray-400 text-xs uppercase font-bold mb-3">Contact to Apply</p>
                    <a href={`tel:${selectedTuition.contact_phone}`} className="flex items-center justify-center w-full bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20 active:scale-95">
                        <Phone className="w-5 h-5 mr-2" /> Call {selectedTuition.contact_phone}
                    </a>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="bg-blue-900 text-white py-16 px-6 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-800 z-0"></div>
         <div className="relative z-10">
             <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Find Home Tuitions</h1>
             <p className="text-blue-100 text-lg max-w-2xl mx-auto">Connect with students and parents looking for tutors in your area.</p>

             {/* --- 3-LEVEL FILTER BAR --- */}
             <div className="max-w-4xl mx-auto mt-10 p-2 bg-white/10 backdrop-blur-md rounded-2xl flex flex-col md:flex-row gap-2 border border-white/20 shadow-xl">
                
                {/* 1. Province */}
                <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-3.5 text-blue-200 w-5 h-5"/>
                    <select value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} className="w-full bg-blue-900/50 text-white rounded-xl pl-11 pr-4 py-3 outline-none font-medium appearance-none hover:bg-blue-800/50 transition cursor-pointer border border-transparent focus:border-blue-300">
                        <option>All Provinces</option>
                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                {/* 2. District */}
                <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-3.5 text-blue-200 w-5 h-5"/>
                    <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="w-full bg-blue-900/50 text-white rounded-xl pl-11 pr-4 py-3 outline-none font-medium appearance-none hover:bg-blue-800/50 transition cursor-pointer border border-transparent focus:border-blue-300" disabled={filterProvince === 'All Provinces'}>
                        <option>All Districts</option>
                        {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* 3. City Zone (NEW) */}
                <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-3.5 text-blue-200 w-5 h-5"/>
                    <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className="w-full bg-blue-900/50 text-white rounded-xl pl-11 pr-4 py-3 outline-none font-medium appearance-none hover:bg-blue-800/50 transition cursor-pointer border border-transparent focus:border-blue-300" disabled={filterDistrict === 'All Districts' || availableZones.length === 0}>
                        <option>All Zones / Areas</option>
                        {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                </div>

             </div>
         </div>
      </div>

      {/* --- GRID --- */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-blue-900"/></div>
        ) : tuitions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No tuitions found</h3>
                <p className="text-gray-500">Try changing your location filters to see more results.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tuitions.map((item, index) => (
                    <Fragment key={item.id}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col h-full">
                            
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                    VAC #{item.vacancy_no}
                                </span>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center ${item.teacher_gender === 'Female' ? 'bg-pink-100 text-pink-700' : item.teacher_gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                    <User className="w-3 h-3 mr-1"/> {item.teacher_gender} Teacher
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1">
                                <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Class {item.class_level}</h3>
                                <p className="text-base font-semibold text-blue-600 mb-6 flex items-center bg-blue-50 w-fit px-4 py-1.5 rounded-full">
                                    <BookOpen className="w-4 h-4 mr-2"/> {item.subject || 'All Subjects'}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-start text-gray-600 text-base">
                                        <Clock className="w-5 h-5 mr-3 text-orange-400 mt-0.5 shrink-0"/>
                                        <span className="font-medium">{item.time_slot}</span>
                                    </div>
                                    <div className="flex items-start text-gray-600 text-base">
                                        <MapPin className="w-5 h-5 mr-3 text-green-500 mt-0.5 shrink-0"/>
                                        <span className="font-medium line-clamp-2">{item.location}, {item.district}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-6 pb-6 pt-0 mt-auto">
                                <div className="flex justify-between items-center border-t border-gray-100 pt-5 mb-5">
                                     <div className="flex items-center text-gray-900 font-extrabold text-xl">
                                        <Banknote className="w-6 h-6 mr-2 text-emerald-600"/>
                                        {item.salary}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTuition(item)} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition flex items-center justify-center group-hover:shadow-lg">
                                    View Details & Apply <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>
                        </div>

                        {/* --- AD BANNER 2: IN-FEED (EVERY 4 ITEMS for High Density) --- */}
                        {(index + 1) % 4 === 0 && (
                            <div className="col-span-1 md:col-span-2 my-6">
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

        {/* --- AD BANNER 3: BOTTOM --- */}
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