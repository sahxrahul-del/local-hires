"use client";
import Navbar from '../../components/Navbar';
import { Shield, Eye, Database, Lock, GraduationCap } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <Navbar />

      <section className="bg-blue-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
             <div className="w-16 h-16 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8" />
             </div>
             <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Privacy Policy</h1>
             <p className="text-gray-600 max-w-2xl mx-auto">
                Transparency is key. Here is how we handle data for Job Seekers, Businesses, Tutors, and Parents.
             </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 mt-12 grid gap-12">
        
        {/* Data Collection */}
        <div className="flex gap-6">
            <div className="bg-blue-100 p-3 rounded-2xl h-fit text-blue-600 shrink-0"><Database className="w-6 h-6"/></div>
            <div>
                <h3 className="text-xl font-bold mb-3">What We Collect</h3>
                <p className="text-gray-600 leading-relaxed">
                    We collect basic contact details (Name, Phone, Email) when you register. 
                    <br/>
                    For <strong>Tuitions</strong>, we collect the location and grade details to match tutors with students.
                    <br/>
                    We do <strong>not</strong> store payment card details; all transactions are handled securely by eSewa.
                </p>
            </div>
        </div>

        {/* Data Usage */}
        <div className="flex gap-6">
            <div className="bg-green-100 p-3 rounded-2xl h-fit text-green-600 shrink-0"><Eye className="w-6 h-6"/></div>
            <div>
                <h3 className="text-xl font-bold mb-3">How We Use It</h3>
                <p className="text-gray-600 leading-relaxed">
                    Your data is used solely to make connections:
                    <br/><br/>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Job Seekers:</strong> Your info is shared with an employer only when you apply.</li>
                        <li><strong>Businesses:</strong> Your contact number is visible on job posts so candidates can call you.</li>
                        <li><strong>Parents/Guardians:</strong> Your tuition vacancy details (Class, Subject, Location) are public, but your phone number is only shown to interested tutors.</li>
                    </ul>
                </p>
            </div>
        </div>

        {/* Data Protection */}
        <div className="flex gap-6">
            <div className="bg-purple-100 p-3 rounded-2xl h-fit text-purple-600 shrink-0"><Lock className="w-6 h-6"/></div>
            <div>
                <h3 className="text-xl font-bold mb-3">Data Protection</h3>
                <p className="text-gray-600 leading-relaxed">
                    We use industry-standard encryption. We do not sell your personal information to third-party marketing agencies.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}