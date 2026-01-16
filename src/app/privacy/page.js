"use client";
import Navbar from '../../components/Navbar';
import { Shield, Eye, Database, Lock, Check } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <Navbar />

      {/* Hero Section (Matches Terms Page) */}
      <section className="bg-blue-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Privacy Policy</h1>
        <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Transparency is key. Here is how we handle data for Job Seekers, Businesses, Tutors, and Parents.
        </p>
        <p className="text-blue-300 text-sm mt-4 font-mono">Last Updated: January 2026</p>
      </section>

      <div className="max-w-3xl mx-auto px-6 -mt-10 space-y-8">
        
        {/* Section 1: Data Collection */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-blue-700">
                <Database className="w-6 h-6 mr-2"/> 1. What We Collect
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
                We only collect the information necessary to connect you with opportunities.
            </p>
            <ul className="space-y-4 text-gray-700">
                <li className="flex items-start bg-blue-50 p-3 rounded-lg">
                    <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5"/> 
                    <div>
                        <strong className="block text-blue-900">Basic Info</strong>
                        Name, Phone Number, and Email Address for registration.
                    </div>
                </li>
                <li className="flex items-start bg-blue-50 p-3 rounded-lg">
                    <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5"/> 
                    <div>
                        <strong className="block text-blue-900">Tuition Details</strong>
                        Location, Grade, and Subject preferences to match tutors with students.
                    </div>
                </li>
                <li className="flex items-start bg-green-50 p-3 rounded-lg border border-green-100">
                    <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5"/> 
                    <div>
                        <strong className="block text-green-900">No Payment Data</strong>
                        Since our platform is <strong>100% Free</strong>, we never ask for or store your credit card or banking details.
                    </div>
                </li>
            </ul>
        </div>

        {/* Section 2: Data Usage */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-green-700">
                <Eye className="w-6 h-6 mr-2"/> 2. How We Use It
            </h2>
            <div className="text-gray-600 leading-relaxed">
                <p className="mb-4">Your data is used solely to facilitate connections between users:</p>
                
                <div className="space-y-3">
                    <div className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 shrink-0"></span>
                        <p><strong>Job Seekers:</strong> Your info is shared with an employer only when you actively apply for a job.</p>
                    </div>
                    <div className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 shrink-0"></span>
                        <p><strong>Businesses:</strong> Your contact number is publicly visible on job posts so candidates can call you directly.</p>
                    </div>
                    <div className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 shrink-0"></span>
                        <p><strong>Parents/Guardians:</strong> Tuition details (Class, Location) are public, but your phone number is only shown to interested tutors.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 3: Data Protection */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-purple-700">
                <Lock className="w-6 h-6 mr-2"/> 3. Data Protection
            </h2>
            <p className="text-gray-600 leading-relaxed">
                We treat your data with respect. We use industry-standard encryption to protect your personal information.
            </p>
            <p className="mt-4 bg-purple-50 text-purple-900 p-4 rounded-xl border border-purple-100 font-medium">
                We strictly <strong>do not sell</strong> your personal information to third-party marketing agencies or spammers.
            </p>
        </div>

      </div>
    </div>
  );
}