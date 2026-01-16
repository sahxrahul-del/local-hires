"use client";
import { useState, useRef } from 'react';
import Navbar from '../../components/Navbar';
import { 
  Mail, Phone, MapPin, Send, Loader2, CheckCircle, MessageCircle 
} from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function Contact() {
  const form = useRef();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();
    setLoading(true);

    emailjs.sendForm(
        'service_sidgv6h', 
        'template_fn85s3c', 
        form.current, 
        'MVlaoctT4ln9ZN2QD'
    )
    .then((result) => {
        console.log('Email sent:', result.text);
        setLoading(false);
        setSubmitted(true);
    }, (error) => {
        console.error('Error sending email:', error.text);
        setLoading(false);
        alert("Failed to send message. Please try again.");
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Get in Touch</h1>
        <p className="text-blue-200 max-w-2xl mx-auto text-lg">
           Have a question about posting a job or finding a tuition? We are here to help.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Info Cards */}
            <div className="space-y-4 lg:col-span-1">
                
                {/* Phone */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-4">
                        <Phone className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Phone Support</h3>
                        <p className="text-sm text-gray-500 mb-1">Sun-Fri, 9am - 6pm</p>
                        <p className="text-lg font-bold text-blue-900">+977 9800000000</p>
                    </div>
                </div>

                {/* WHATSAPP CARD (New) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start hover:border-green-300 transition group cursor-pointer" onClick={() => window.open('https://wa.me/9779800000000', '_blank')}>
                    <div className="bg-green-100 p-3 rounded-full text-green-600 mr-4 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-6 h-6 fill-current"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition">Chat on WhatsApp</h3>
                        <p className="text-sm text-gray-500 mb-1">Instant Support</p>
                        <p className="text-lg font-bold text-green-600 group-hover:underline">Click to Chat</p>
                    </div>
                </div>

                {/* Email */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start">
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600 mr-4">
                        <Mail className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Email Us</h3>
                        <p className="text-sm text-gray-500 mb-1">For general inquiries</p>
                        <a href="mailto:workxnepal@gmail.com" className="text-lg font-bold text-blue-900 hover:underline">workxnepal@gmail.com</a>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start">
                    <div className="bg-gray-100 p-3 rounded-full text-gray-600 mr-4">
                        <MapPin className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Office</h3>
                        <p className="text-sm text-gray-500 mb-1">Visit us (Appointment only)</p>
                        <p className="text-lg font-bold text-blue-900">Janakpur, Dhanusha, Nepal</p>
                    </div>
                </div>

            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 lg:col-span-2">
                {submitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent Successfully!</h2>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Thank you for contacting us. We will check your message and get back to you within 24 hours.
                        </p>
                        <button onClick={() => setSubmitted(false)} className="mt-8 text-blue-600 font-bold hover:underline">
                            Send another message
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                        
                        <form ref={form} onSubmit={sendEmail} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                                    <input type="text" name="user_name" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ram" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone / Email</label>
                                    <input type="text" name="user_email" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="98XXXXXXXX" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                                <select name="subject" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
                                    <option>General Inquiry</option>
                                    <option>Post a new job</option>
                                    <option>Problem with Job Posting</option>
                                    <option>Tuition Help</option>
                                    <option>Report a User</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                                <textarea name="message" required rows="5" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="How can we help you?"></textarea>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg flex items-center justify-center disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin w-6 h-6"/> : <><Send className="w-5 h-5 mr-2"/> Send Message</>}
                            </button>
                        </form>
                    </>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}