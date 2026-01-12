"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr'; 
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { MapPin, Briefcase, Clock, Calendar, CheckCircle, Phone, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AppliedJobs() {
  const router = useRouter();

  // 2. INITIALIZE THE CLIENT 
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState([]);

  // --- POPUP STATES ---
  const [selectedJob, setSelectedJob] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      // 3. Authenticate using the Cookie
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
  
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          jobs (
            id,
            employer_id,
            title,
            company_name,
            location,
            province,    
            district,    
            pay_rate,
            category,
            description,
            work_day_from,
            work_day_to,
            work_hour_start,
            work_hour_end
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
  
      if (!error && data) {
        setAppliedJobs(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [router, supabase]);

  // --- HELPER: Parse Job Data ---
  const parseJobData = (job) => {
    let displaySchedule = "Flexible";
    let displayDescription = job.description || "";

    if (job.work_day_from && job.work_day_to && job.work_hour_start && job.work_hour_end) {
      displaySchedule = `${job.work_day_from} - ${job.work_day_to}, ${job.work_hour_start} - ${job.work_hour_end}`;
    }

    return { ...job, displaySchedule, displayDescription };
  };

  // --- HANDLE VIEW CLICK ---
  const handleViewClick = async (rawJob) => {
    const job = parseJobData(rawJob);
    setSelectedJob(job);
    setLoadingContact(true);
    setContactInfo(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone, email, full_name, business_name')
        .eq('id', job.employer_id)
        .single();

      if (error) throw error;
      setContactInfo(data);
    } catch (error) {
      console.error(error); 
    } finally {
      setLoadingContact(false);
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navbar />

      {/* --- POPUP MODAL --- */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Details for {selectedJob.title}</h3>
                <p className="text-gray-500 text-sm mt-1">at {selectedJob.company_name}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-green-50 border border-green-100 p-4 rounded-lg mb-6 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800 font-medium">
                  You have already viewed/applied to this job.
                </p>
              </div>

              {loadingContact ? (
                <div className="py-8 text-center text-gray-500 flex justify-center items-center">
                    <Loader2 className="animate-spin w-5 h-5 mr-2" /> Fetching details...
                </div>
              ) : contactInfo ? (
                <div className="space-y-4 mb-8">
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="bg-green-100 p-3 rounded-full mr-4">
                            <Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Call Employer</p>
                            <a href={`tel:${contactInfo.phone}`} className="text-xl font-bold text-gray-900 hover:underline">
                                {contactInfo.phone}
                            </a>
                        </div>
                    </div>
                    {/* Location Display */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="bg-gray-200 p-3 rounded-full mr-4">
                            <MapPin className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                            <p className="text-gray-900 font-bold">
                                {selectedJob.district ? `${selectedJob.district}, ${selectedJob.province}` : selectedJob.location}
                            </p>
                            {selectedJob.district && <p className="text-sm text-gray-500">{selectedJob.location}</p>}
                        </div>
                    </div>
                </div>
              ) : (
                <div className="text-red-500 text-center mb-6">Contact info not available.</div>
              )}

              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-bold text-base text-gray-900 mb-3">Job Description</h4>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedJob.displayDescription}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Application History</h1>
        <p className="text-gray-500 mb-8">Jobs you have viewed contact details for.</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading history...</div>
        ) : appliedJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">No applications yet</h3>
             <p className="text-gray-500 mb-6">When you click &quot;Apply Now&quot; on a job, it will appear here.</p>
             <Link href="/find-jobs">
                <button className="bg-blue-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition">
                   Browse Jobs
                </button>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appliedJobs.map((item) => {
              const job = item.jobs;
              if (!job) return null;

              return (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition">
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Contacted
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                        {timeAgo(item.created_at)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-4">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {job.company_name}
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-gray-600">
                      <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {job.district ? `${job.district}, ${job.province}` : job.location}
                      </div>
                  </div>

                  {/* VIEW AGAIN BUTTON */}
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => handleViewClick(job)}
                      className="w-full flex items-center justify-center text-blue-900 font-bold text-sm bg-blue-50 py-2.5 rounded-lg hover:bg-blue-100 transition"
                    >
                      View Details & Phone <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}