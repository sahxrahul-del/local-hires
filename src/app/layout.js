import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from '../components/Footer';
import Script from 'next/script'; // <--- Import Script for Ads

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Work X Nepal",
  description: "Find your next local opportunity in Nepal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50`}
      >
        {/* Main Content Area - grows to push footer down */}
        <div className="flex-1">
            {children}
        </div>

        {/* --- PROFESSIONAL FOOTER --- */}
        <Footer />

        {/* --- GOOGLE ADSENSE SCRIPT --- */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID_HERE" // <--- REPLACE THIS ID LATER
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}