"use client";
import Navbar from '../../components/Navbar';
import { Check, XCircle, GraduationCap, Info } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Terms & Conditions</h1>
        <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Please read these terms carefully before using our platform.
        </p>
        <p className="text-blue-300 text-sm mt-4 font-mono">Last Updated: January 2026</p>
      </section>

      <div className="max-w-3xl mx-auto px-6 -mt-10 space-y-8">
        
        {/* Section 1: Intro */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800">
                <Info className="w-6 h-6 mr-2 text-blue-600"/> 1. Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg">
                Welcome to <span className="font-bold text-blue-900">Work X Nepal</span>. We operate as an open marketplace connecting Job Seekers with Businesses and Tutors with Parents. By using our services, you agree to comply with these terms.
            </p>
        </div>

        {/* Section 2: Fees */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-green-500">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-green-700">
                2. Fees & Payments
            </h2>
            <p className="text-gray-600 mb-4">
                We have simplified our model to support the community.
            </p>
            <ul className="space-y-4 text-gray-700">
                <li className="flex items-start bg-green-50 p-3 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5"/> 
                    <div>
                        <strong className="block text-green-900">100% Free for Everyone</strong>
                        Posting jobs, applying for jobs, posting tuition needs, and contacting tutors is completely free.
                    </div>
                </li>
                <li className="flex items-start bg-gray-50 p-3 rounded-lg">
                    <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5"/> 
                    <div>
                        <strong className="block text-gray-900">Direct Transactions</strong>
                        All salary and fee negotiations happen directly between users. We do not take any commission from your earnings.
                    </div>
                </li>
            </ul>
        </div>

        {/* Section 3: Safety (FIXED) */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-red-600">
                <XCircle className="w-6 h-6 mr-2"/> 3. Safety & Disclaimer
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                    <strong>We are a Connector, not an Employer:</strong> Work X Nepal acts solely as a bridge. We do not conduct background checks on every individual user.
                </p>
                
                {/* 🟢 FIXED: Changed <p> to <div> so the <ul> is valid */}
                <div>
                    <strong>User Responsibility:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Seekers/Tutors:</strong> Verify the business or household safety before visiting.</li>
                        <li><strong>Employers/Parents:</strong> Verify the candidate's ID and qualifications before hiring.</li>
                    </ul>
                </div>

                <p className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100 mt-4 font-medium text-sm">
                    ⚠️ Never pay anyone money for a "job application fee" or "processing fee". If an employer asks for money upfront, please report them immediately.
                </p>
            </div>
        </div>

        {/* Section 4: Tuitions Specific */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-purple-700">
                <GraduationCap className="w-6 h-6 mr-2"/> 4. Home Tuitions Policy
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
                For home tuitions, we provide the connection details only.
            </p>
            <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 shrink-0"></span>
                    Tutors are independent freelancers, not our employees.
                </li>
                <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 shrink-0"></span>
                    Parents are responsible for negotiating the monthly fee and schedule directly with the tutor.
                </li>
            </ul>
        </div>

      </div>
    </div>
  );
}