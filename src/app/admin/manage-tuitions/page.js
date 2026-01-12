"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar'; // Adjust path if needed
import Link from 'next/link';
import { 
  ShieldCheck, Trash2, Pencil, MapPin, Clock, 
  BookOpen, Loader2, AlertTriangle, X, PlusCircle 
} from 'lucide-react';

export default function ManageTuitions() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [tuitions, setTuitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMyTuitions();
  }, []);

  const fetchMyTuitions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // Fetch tuitions posted by this Admin
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
          setTuitions(tuitions.filter(t => t.id !== selectedId));
          setShowDeleteModal(false);
      } catch (error) {
          alert("Error deleting: " + error.message);
      } finally {
          setDeleting(false);
      }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-blue-900"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Navbar />

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-red-100 p-2.5 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <button onClick={() => setShowDeleteModal(false)} className="hover:bg-gray-100 p-1 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Tuition?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center justify-center">
                {deleting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-blue-900 flex items-center">
                    <ShieldCheck className="mr-3 w-8 h-8"/> Manage Tuitions
                </h1>
                <p className="text-gray-500 mt-1">You have posted <span className="font-bold text-blue-900">{tuitions.length}</span> tuitions.</p>
            </div>
            <Link href="/admin">
                <button className="flex items-center bg-blue-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg hover:shadow-blue-900/20">
                    <PlusCircle className="w-5 h-5 mr-2" /> Post New Tuition
                </button>
            </Link>
        </div>

        {/* Grid */}
        {tuitions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-bold">No active tuitions found.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tuitions.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col relative group overflow-hidden">
                        
                        {/* Status Bar */}
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-1 rounded">
                                VAC #{item.vacancy_no}
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                                {new Date(item.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="p-5 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Class {item.class_level}</h3>
                            <p className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                                <BookOpen className="w-4 h-4 mr-1 text-blue-500"/> {item.subject || 'All Subjects'}
                            </p>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center text-gray-600">
                                    <Clock className="w-4 h-4 mr-2 text-orange-400"/>
                                    <span className="font-medium">{item.time_slot}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-4 h-4 mr-2 text-green-500"/>
                                    <span className="font-medium truncate">{item.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                            <Link href={`/admin/edit-tuition/${item.id}`} className="flex-1">
                                <button className="w-full flex items-center justify-center py-2.5 rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-white hover:text-blue-900 hover:border-blue-200 transition bg-white">
                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                </button>
                            </Link>
                            <button 
                                onClick={() => { setSelectedId(item.id); setShowDeleteModal(true); }}
                                className="flex-1 flex items-center justify-center py-2.5 rounded-lg border border-red-100 bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition"
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