"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle, Loader2, PlusCircle, LayoutDashboard } from 'lucide-react'; // Changed icons
import Link from 'next/link';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);

  // Get eSewa params from URL
  const dataFromEsewa = searchParams.get('data'); 

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const verifyPayment = async () => {
      if (!dataFromEsewa) return;

      try {
        // 1. Decode eSewa Response
        const decodedData = atob(dataFromEsewa);
        const parsedData = JSON.parse(decodedData);
        const jobId = parsedData.transaction_uuid;

        // 2. Update Job Status to 'PAID'
        const { error } = await supabase
            .from('jobs')
            .update({ payment_status: 'PAID' })
            .eq('id', jobId);

        if (error) throw error;
        
        setVerifying(false);

      } catch (error) {
        console.error("Payment Verification Failed", error);
        alert("Something went wrong verifying payment.");
        router.push('/dashboard');
      }
    };

    verifyPayment();
  }, [dataFromEsewa, supabase, router]);

  if (verifying) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Verifying Payment...</h2>
        <p className="text-gray-500">Please wait while we activate your job post.</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6 font-sans">
       <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-green-100">
           
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle className="w-10 h-10 text-green-600" />
           </div>
           
           <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h1>
           <p className="text-gray-500 mb-8">Your job is now <span className="font-bold text-green-600">LIVE</span> and visible to thousands of job seekers.</p>
           
           <div className="space-y-3">
               {/* Button 1: Go to Dashboard */}
               <Link href="/dashboard">
                   <button className="w-full bg-blue-900 text-white py-3.5 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg flex items-center justify-center">
                       <LayoutDashboard className="w-4 h-4 mr-2"/> Go to Dashboard
                   </button>
               </Link>

               {/* Button 2: Post Another Job (Fixed Link) */}
               <Link href="/post-job">
                   <button className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center">
                       <PlusCircle className="w-4 h-4 mr-2"/> Post Another Job
                   </button>
               </Link>
           </div>

       </div>
    </div>
  );
}