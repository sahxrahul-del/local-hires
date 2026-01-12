"use client";
import Navbar from '../../components/Navbar';
import { Check, XCircle, GraduationCap } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <Navbar />

      <section className="bg-white border-b border-gray-200 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
             <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Terms & Conditions</h1>
             <p className="text-gray-500">Last Updated: January 2026</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 mt-10 space-y-8">
        
        {/* Section 1 */}
        <div className="bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
                Welcome to Work X Nepal. By using our platform for Jobs or Home Tuitions, you agree to these terms.
            </p>
        </div>

        {/* Section 2: Payments */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-blue-600">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-blue-900">2. Fees & Payments</h2>
            <ul className="space-y-3 text-gray-600">
                <li className="flex items-start"><Check className="w-5 h-5 text-green-500 mr-2 mt-0.5"/> <strong>For Job Seekers & Tutors:</strong> Our platform is 100% free to browse and apply.</li>
                <li className="flex items-start"><Check className="w-5 h-5 text-green-500 mr-2 mt-0.5"/> <strong>For Businesses:</strong> Posting a job requires a fee (e.g., Rs. 99) per listing.</li>
                <li className="flex items-start"><Check className="w-5 h-5 text-green-500 mr-2 mt-0.5"/> <strong>For Parents/Guardians:</strong> Posting a tuition requirement is currently free (subject to change).</li>
                <li className="flex items-start"><XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5"/> <strong>Refund Policy:</strong> All fees are non-refundable once the post is live.</li>
            </ul>
        </div>

        {/* Section 3: Tuitions Specific */}
        <div className="bg-white p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold mb-4 flex items-center"><GraduationCap className="w-6 h-6 mr-2 text-blue-500"/> 3. Home Tuitions</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
                Work X Nepal acts only as a bridge between Parents and Tutors. We do not conduct background checks on tutors or guarantee the payment behavior of parents.
            </p>
            <p className="text-gray-600 leading-relaxed">
                Users are advised to verify credentials and negotiate fees independently before starting classes.
            </p>
        </div>

      </div>
    </div>
  );
}