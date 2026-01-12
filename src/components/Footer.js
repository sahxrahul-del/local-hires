import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, ShieldCheck, FileText, Lock, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Column 1: Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5">
                 <Image src="/image2.png" alt="Logo" fill className="object-cover" />
             </div>
             <span className="text-2xl font-extrabold text-white tracking-tight">
                Work X <span className="text-blue-500">Nepal</span>
             </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Connecting local businesses with local talent. The easiest way to find work, hire staff, or find home tuitions in your community.
          </p>
          <div className="flex space-x-4 pt-4">
            <Link href="#" className="bg-slate-800 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition"><Facebook className="w-5 h-5" /></Link>
            <Link href="#" className="bg-slate-800 p-2 rounded-lg hover:bg-blue-400 hover:text-white transition"><Twitter className="w-5 h-5" /></Link>
            <Link href="#" className="bg-slate-800 p-2 rounded-lg hover:bg-pink-600 hover:text-white transition"><Instagram className="w-5 h-5" /></Link>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-white font-bold mb-6 text-lg">Quick Links</h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/" className="hover:text-white transition flex items-center group"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition"></span>Home</Link></li>
            <li><Link href="/our-story" className="hover:text-white transition flex items-center group"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition"></span>Our Story</Link></li>
            <li><Link href="/find-jobs" className="hover:text-white transition flex items-center group"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition"></span>Browse Jobs</Link></li>
            <li><Link href="/tuitions" className="hover:text-white transition flex items-center group"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition"></span>Find Tuitions</Link></li>
          </ul>
        </div>

        {/* Column 3: Legal & Support (ADDED CONTACT US) */}
        <div>
          <h3 className="text-white font-bold mb-6 text-lg">Support & Legal</h3>
          <ul className="space-y-3 text-sm">
            <li>
                <Link href="/contact" className="hover:text-white transition flex items-center group">
                  <MessageCircle className="w-4 h-4 mr-2 text-slate-500 group-hover:text-blue-400 transition" />
                  Contact Us
                </Link>
            </li>
            <li>
                <Link href="/safety-tips" className="hover:text-white transition flex items-center group">
                  <ShieldCheck className="w-4 h-4 mr-2 text-slate-500 group-hover:text-green-400 transition" />
                  Safety Tips
                </Link>
            </li>
            <li>
                <Link href="/privacy" className="hover:text-white transition flex items-center group">
                  <Lock className="w-4 h-4 mr-2 text-slate-500 group-hover:text-blue-400 transition" />
                  Privacy Policy
                </Link>
            </li>
            <li>
                <Link href="/terms" className="hover:text-white transition flex items-center group">
                  <FileText className="w-4 h-4 mr-2 text-slate-500 group-hover:text-orange-400 transition" />
                  Terms & Conditions
                </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact Info */}
        <div>
          <h3 className="text-white font-bold mb-6 text-lg">Contact</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 text-blue-500 shrink-0" />
              <span>Janakpur, Dhanusha, Nepal</span>
            </li>
            <li className="flex items-center">
              <Phone className="w-5 h-5 mr-3 text-blue-500 shrink-0" />
              <span>+977 9800000000</span>
            </li>
            <li className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-blue-500 shrink-0" />
              <a href="mailto:workxnepal@gmail.com" className="hover:text-white transition border-b border-transparent hover:border-white">workxnepal@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Work X Nepal. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Made with in Nepal</p>
      </div>
    </footer>
  );
}