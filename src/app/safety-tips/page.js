"use client";
import Navbar from '../../components/Navbar';
import { ShieldAlert, UserCheck, MapPin, Banknote, AlertTriangle, Lock } from 'lucide-react';

export default function SafetyTips() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 bg-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="text-blue-300 font-bold tracking-widest uppercase text-sm mb-4 block">Trust & Safety</span>
          <h1 className="text-5xl font-extrabold mb-6">Stay Safe While You Search</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Your safety is our priority. Here is how to protect yourself from scams and bad actors.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        
        {/* Tip 1: The Golden Rule */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border-l-8 border-red-500 mb-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-red-100 p-4 rounded-full text-red-600 shrink-0">
                <Banknote className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">NEVER Pay for a Job Offer</h3>
                <p className="text-gray-600 leading-relaxed">
                    Legitimate employers will <strong>never</strong> ask you to pay money for "registration fees," "uniforms," or "document processing" before hiring you. If someone asks for money to give you a job, it is 100% a scam. Report them immediately.
                </p>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            
            {/* Tip 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition">
                <div className="bg-blue-100 p-3 rounded-2xl w-fit text-blue-600 mb-4">
                    <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Meet in Public Places</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    For interviews, always choose a public location like an office, café, or busy area. Avoid private homes or secluded locations for your first meeting.
                </p>
            </div>

            {/* Tip 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition">
                <div className="bg-green-100 p-3 rounded-2xl w-fit text-green-600 mb-4">
                    <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Verify the Business</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Check if the company exists. Look for their physical signboard, Google Maps location, or social media presence before going for an interview.
                </p>
            </div>

            {/* Tip 4 */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition">
                <div className="bg-orange-100 p-3 rounded-2xl w-fit text-orange-600 mb-4">
                    <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Protect Personal Info</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Do not share your bank password, OTP, or citizenship (Nagrita) original copy until you are officially hired and in the office.
                </p>
            </div>

            {/* Tip 5 */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition">
                <div className="bg-purple-100 p-3 rounded-2xl w-fit text-purple-600 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Trust Your Gut</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    If an offer sounds too good to be true (e.g., extremely high salary for zero experience), it probably is. Walk away.
                </p>
            </div>

        </div>

      </section>
    </div>
  );
}