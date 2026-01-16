"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
// ✅ FIXED IMPORT: Uses '@' to work from anywhere
import Navbar from '@/components/Navbar'; 
import Link from 'next/link';
import { 
  ShieldCheck, Trash2, Pencil, MapPin, Clock, 
  BookOpen, Loader2, AlertTriangle, X, PlusCircle, Calendar 
} from 'lucide-react';

export default function ManageTuitions() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [tuitions, setTuitions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMyTuitions();
  }, []);

  const fetchMyTuitions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // Fetch tuitions posted by this Admin/Manager
    const { data, error } = await supabase
      .from('tuitions')
      .select('*')
      .eq('posted_by', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setTuitions(data || []);
    setLoading(false);
  };

  const handleDelete = async () => {
      setDeleting(true);
      try {
          const { error } = await supabase.from('tuitions').delete().eq('id', selectedId);
          if (error) throw error;
          // UI Update: Remove item locally without refreshing
          setTuitions(tuitions.filter(t => t.id !== selectedId));
          setShowDeleteModal(false);
      } catch (error) {
          alert("Error deleting: " + error.message);
      } finally {
          setDeleting(false);
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin w-10 h-10 text-purple-900"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      <Navbar />

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
               <div className="bg-red-100 p-3 rounded-full">
                   <AlertTriangle className="w-6 h-6 text-red-600" />
               </div>
               <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                   <X className="w-5 h-5" />
               </button>
            </div>
            
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Delete Tuition?</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Are you sure you want to remove this vacancy? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition">
                  Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center shadow-lg shadow-red-600/20">
                {deleting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER SECTION --- */}
      <div className="bg-purple-900 text-white pt-10 pb-20 px-6 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl opacity-30 -translate-y-10 translate-x-10"></div>
         
         <div className="max-w-6xl mx-auto relative z-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <span className="inline-block py-1 px-3 rounded-full bg-purple-800 border border-purple-700 text-purple-200 text-xs font-bold mb-3">
                        Admin Dashboard
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold flex items-center">
                        <ShieldCheck className="mr-3 w-8 h-8 md:w-10 md:h-10 text-purple-300"/> Manage Tuitions
                    </h1>
                    <p className="text-purple-100 mt-2 text-lg">
                        You have posted <span className="font-bold bg-white text-purple-900 px-2 py-0.5 rounded-md ml-1">{tuitions.length}</span> active vacancies.
                    </p>
                </div>
                
                <Link href="/admin/post-tuition">
                    <button className="flex items-center bg-white text-purple-900 px-6 py-4 rounded-xl font-bold hover:bg-purple-50 transition shadow-xl shadow-purple-900/20 active:scale-95">
                        <PlusCircle className="w-5 h-5 mr-2" /> Post New Tuition
                    </button>
                </Link>
             </div>
         </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 pb-20">
        
        {tuitions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Tuitions</h3>
                <p className="text-gray-500 mb-6">You haven't posted any tuition vacancies yet.</p>
                <Link href="/admin/post-tuition">
                    <button className="text-purple-700 font-bold hover:underline">Post your first tuition &rarr;</button>
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tuitions.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative group overflow-hidden">
                        
                        {/* Status Bar */}
                        <div className="bg-gradient-to-r from-purple-50 to-white px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-purple-900 bg-purple-100 px-2 py-1 rounded border border-purple-200 tracking-wider">
                                #{item.vacancy_no}
                            </span>
                            <span className="text-[11px] font-bold text-gray-400 flex items-center">
                                <Calendar className="w-3 h-3 mr-1"/> {new Date(item.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 flex-1">
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Class {item.class_level}</h3>
                            <p className="text-sm font-bold text-purple-700 mb-5 flex items-center bg-purple-50 w-fit px-3 py-1.5 rounded-lg">
                                <BookOpen className="w-4 h-4 mr-1.5"/> {item.subject || 'All Subjects'}
                            </p>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-start text-gray-600">
                                    <Clock className="w-4 h-4 mr-2.5 text-orange-400 mt-0.5 shrink-0"/>
                                    <span className="font-medium">{item.time_slot}</span>
                                </div>
                                <div className="flex items-start text-gray-600">
                                    <MapPin className="w-4 h-4 mr-2.5 text-gray-400 mt-0.5 shrink-0"/>
                                    <span className="font-medium line-clamp-1">{item.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                            {/* EDIT BUTTON */}
                            <Link href={`/admin/edit-tuition/${item.id}`} className="flex-1">
                                <button className="w-full flex items-center justify-center py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-white hover:text-purple-900 hover:border-purple-200 hover:shadow-md transition bg-white">
                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                </button>
                            </Link>
                            
                            {/* DELETE BUTTON */}
                            <button 
                                onClick={() => { setSelectedId(item.id); setShowDeleteModal(true); }}
                                className="flex-1 flex items-center justify-center py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white hover:shadow-md transition"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}