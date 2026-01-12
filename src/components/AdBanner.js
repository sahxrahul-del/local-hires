"use client";
import { useEffect, useRef } from 'react';

export default function AdBanner({ dataAdSlot, dataAdFormat, dataFullWidthResponsive }) {
  // 1. Automatically detect environment
  // 'development' = npm run dev (Your computer)
  // 'production' = npm run build (Live Website)
  const isDevelopment = process.env.NODE_ENV === 'development';

  const adRef = useRef(null);

  useEffect(() => {
    // Only run the AdSense script if we are NOT in development mode
    if (!isDevelopment) {
      try {
        if (window) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error("AdSense Error:", err);
      }
    }
  }, [isDevelopment]);

  // 2. Render the Placeholder if in Development
  if (isDevelopment) {
    return (
      <div className="my-8 flex items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 text-gray-500 font-bold rounded-lg"
           style={{ 
             // Approximate height for visual testing
             height: dataAdFormat === 'auto' ? '280px' : 'auto',
             width: '100%',
             minHeight: '100px',
             padding: '20px'
           }}>
         <div className="text-center">
            Ad Placeholder <br/> 
            <span className="text-xs font-normal">(Slot: {dataAdSlot})</span>
         </div>
      </div>
    );
  }

  // 3. Render the Real AdSense code if in Production
  return (
    <div className="my-8 text-center overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID_HERE" // <--- REPLACE THIS WITH YOUR REAL ID
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat || "auto"}
        data-full-width-responsive={dataFullWidthResponsive || "true"}
      ></ins>
    </div>
  );
}