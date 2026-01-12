"use client";
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import { Quote, Users, TrendingUp, Heart, MapPin, Loader2 } from 'lucide-react';

export default function OurStory() {
  const [seekerCount, setSeekerCount] = useState(0);
  const [businessCount, setBusinessCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchRealStats = async () => {
        try {
            // 1. Count Real Job Seekers
            const { count: seekers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true }) // head:true means we only get the count, not data (faster)
                .eq('role', 'seeker');

            // 2. Count Real Businesses
            const { count: businesses } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'business');

            setSeekerCount(seekers || 0);
            setBusinessCount(businesses || 0);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    fetchRealStats();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative py-24 bg-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="text-blue-300 font-bold tracking-widest uppercase text-sm mb-4 block">The Journey</span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            We didn't start as a company.<br/>
            <span className="text-blue-200">We started as a frustration.</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            From a small coffee shop in Kathmandu to a nationwide movement connecting talent with opportunity.
          </p>
        </div>
      </section>

      {/* --- THE ORIGIN STORY --- */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          
          <div className="prose prose-lg text-gray-600 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">It began with a cup of tea and a goodbye.</h2>
            <p>
              It was late 2023. I was sitting in a café in New Baneshwor with two of my closest friends. We weren't celebrating; we were saying goodbye. Like thousands of other capable, educated Nepali youths, they were leaving for foreign employment. Not because they wanted to leave their families, but because they couldn't find dignified work here.
            </p>
            <p>
              The irony was painful. Just days earlier, my uncle—who runs a small hardware business—was complaining that he couldn't find a reliable accountant or even a delivery rider.
            </p>
            <div className="my-8 pl-6 border-l-4 border-blue-600 italic text-xl text-gray-800 bg-gray-50 py-4 pr-4 rounded-r-lg">
              "The jobs were there. The talent was there. But the bridge between them was broken."
            </div>
            <p>
              Existing job sites were too corporate, too complicated, or ignored the "blue-collar" and "grey-collar" jobs that actually drive our economy—tuitions, retail staff, delivery, and technicians.
            </p>
            <p>
              That night, <strong>Work X Nepal</strong> wasn't a business plan. It was a scribble on a napkin. The goal was simple: <em>Stop the brain drain by making local work visible, accessible, and dignified.</em>
            </p>
          </div>

          {/* --- MILESTONES (Timeline) --- */}
          <div className="border-l-2 border-blue-100 pl-8 space-y-12 relative my-20">
            
            {/* Item 1 */}
            <div className="relative">
              <span className="absolute -left-[41px] top-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white">1</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">The "Google Form" Era</h3>
              <p className="text-gray-500">
                We didn't have money for a website. We used a simple Google Form and an Instagram page. In the first week, we manually matched 15 students with home tuitions. It was messy, but it worked.
              </p>
            </div>

            {/* Item 2 */}
            <div className="relative">
              <span className="absolute -left-[41px] top-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white">2</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">The First Business Partner</h3>
              <p className="text-gray-500">
                A local restaurant owner in Pokhara trusted us to hire his entire waitstaff. When he told us, <em>"You saved me weeks of stress,"</em> we knew this had to be bigger than just a side project.
              </p>
            </div>

            {/* Item 3 */}
            <div className="relative">
              <span className="absolute -left-[41px] top-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white">3</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Building Work X Nepal</h3>
              <p className="text-gray-500">
                We poured our savings into building a real platform. One that handles the chaos of hiring—sorting location, salary, and skills—so you don't have to.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* --- LIVE REAL STATS --- */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                
                {/* SEEKERS COUNT */}
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition group">
                    <Users className="w-10 h-10 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform"/>
                    {loadingStats ? (
                        <div className="flex justify-center h-10 mb-2 items-center"><Loader2 className="animate-spin text-gray-300"/></div>
                    ) : (
                        <h4 className="text-4xl font-extrabold text-gray-900 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                           {seekerCount.toLocaleString()}
                        </h4>
                    )}
                    <p className="text-gray-500 font-medium">Job Seekers Connected</p>
                </div>

                {/* BUSINESS COUNT */}
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition group">
                    <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform"/>
                    {loadingStats ? (
                        <div className="flex justify-center h-10 mb-2 items-center"><Loader2 className="animate-spin text-gray-300"/></div>
                    ) : (
                        <h4 className="text-4xl font-extrabold text-gray-900 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                           {businessCount.toLocaleString()}
                        </h4>
                    )}
                    <p className="text-gray-500 font-medium">Businesses Helping</p>
                </div>

                {/* STATIC STAT */}
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition group">
                    <Heart className="w-10 h-10 text-red-500 mx-auto mb-4 group-hover:scale-110 transition-transform"/>
                    <h4 className="text-4xl font-extrabold text-gray-900 mb-2">100%</h4>
                    <p className="text-gray-500 font-medium">Made in Nepal</p>
                </div>

            </div>
            
            <p className="text-center text-xs text-gray-400 mt-6 font-medium uppercase tracking-widest">
                * Real-time platform data
            </p>
        </div>
      </section>

      {/* --- MISSION STATEMENT --- */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Promise</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-10">
                We believe that <strong>talent is universal, but opportunity is not.</strong> Our mission is to democratize opportunity in Nepal. Whether you are a student looking for pocket money, a professional seeking a career, or a business owner building a dream—we are here to make the connection simple, honest, and fast.
            </p>
            <div className="flex justify-center gap-4">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold text-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-2"/> Proudly Based in Nepal
                </div>
            </div>
        </div>
      </section>

    </div>
  );
}