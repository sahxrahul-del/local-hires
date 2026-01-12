"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  User, LogOut, PlusCircle, ShieldCheck, Menu, X, 
  GraduationCap, LayoutDashboard, Briefcase, Heart, History 
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        let userRole = user.user_metadata?.role;
        let userAvatar = user.user_metadata?.avatar_url;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
           userRole = profile.role;
           userAvatar = profile.avatar_url;
        }

        setRole(userRole);
        setAvatarUrl(userAvatar || 'https://api.dicebear.com/9.x/open-peeps/svg?seed=1');
      } else {
        setUser(null); setRole(null); setAvatarUrl(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { checkUser(); router.refresh(); }
      else { setUser(null); setRole(null); setAvatarUrl(null); router.refresh(); }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setRole(null); setAvatarUrl(null);
    router.push('/login'); router.refresh();
  };

  const getHomeLink = () => {
    if (role === 'business') return '/dashboard';
    if (role === 'admin') return '/admin'; 
    if (user) return '/find-jobs';
    return '/';
  };

  // Helper for Active Link Styling
  const NavLink = ({ href, children, icon: Icon }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href} 
        className={`flex items-center text-sm font-bold transition-colors ${
            isActive ? 'text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg' : 'text-gray-500 hover:text-blue-700'
        }`}
      >
        {Icon && <Icon className={`w-4 h-4 mr-1.5 ${isActive ? 'text-blue-900' : 'text-gray-400'}`} />}
        {children}
      </Link>
    );
  };

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* --- LOGO --- */}
          <Link href={getHomeLink()} className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white p-1 group-hover:shadow-md transition">
                <Image src="/image2.png" alt="Logo" fill sizes="48px" className="object-cover" />
            </div>
            <span className="text-xl font-extrabold text-blue-900 tracking-tight hidden sm:block">
                Work X <span className="text-blue-500">Nepal</span>
            </span>
          </Link>

          {/* --- DESKTOP MENU --- */}
          <div className="hidden lg:flex items-center space-x-6">
            
            {/* 1. Public Link (Only if not logged in) */}
            {!user && <NavLink href="/">Home</NavLink>}

            {/* 2. TUITIONS (Hide for Business) */}
            {role !== 'business' && (
                <NavLink href="/tuitions" icon={GraduationCap}>Tuitions</NavLink>
            )}

            {/* 3. JOB SEEKER ONLY */}
            {user && role === 'seeker' && (
              <>
                <NavLink href="/find-jobs" icon={Briefcase}>Browse Jobs</NavLink>
                <NavLink href="/saved-jobs" icon={Heart}>Saved</NavLink>
                <NavLink href="/applied-jobs" icon={History}>History</NavLink>
              </>
            )}

            {/* 4. BUSINESS & ADMIN (Core Tools) */}
            {user && (role === 'business' || role === 'admin') && (
              <>
                 <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                 <Link href="/post-job" className="bg-blue-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 transition flex items-center shadow-md hover:shadow-lg">
                    <PlusCircle className="w-4 h-4 mr-1.5"/> Post Job
                 </Link>
              </>
            )}

            {/* 5. ADMIN EXCLUSIVE TOOLS */}
            {role === 'admin' && (
              <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 ml-2">
                 {/* Admin can browse jobs to moderate/check */}
                 <NavLink href="/find-jobs" icon={Briefcase}>All Jobs</NavLink>
                 
                 <Link href="/admin/post-tuition" className="text-purple-700 font-bold text-xs bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 border border-purple-100 transition flex items-center">
                    <PlusCircle className="w-3.5 h-3.5 mr-1"/> Tuition
                 </Link>
                 <Link href="/admin/manage-tuitions" className="text-purple-700 font-bold text-xs bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 border border-purple-100 transition flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1"/> Manage
                 </Link>
              </div>
            )}

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center space-x-4 ml-4">
                 <Link href="/profile" className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                    {avatarUrl ? (
                      <Image src={avatarUrl} width={40} height={40} alt="Avatar" className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-5 h-5"/></div>
                    )}
                 </Link>
                 <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition">
                    <LogOut className="w-5 h-5" />
                 </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                 <Link href="/login" className="text-gray-600 font-bold hover:text-blue-900 transition text-sm">Sign In</Link>
                 <Link href="/signup" className="bg-blue-100 text-blue-900 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-200 transition">Create Account</Link>
              </div>
            )}
          </div>

          {/* --- MOBILE HAMBURGER BUTTON --- */}
          <div className="lg:hidden flex items-center">
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 hover:text-blue-900 p-2">
                {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
             </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU (SLIDE DOWN) --- */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full left-0 top-20 shadow-xl py-4 px-6 flex flex-col space-y-4 animate-in slide-in-from-top-2">
            
            {!user && <Link href="/" className="mobile-link">Home</Link>}
            
            {/* Hide Tuition Link for Business on Mobile too */}
            {role !== 'business' && (
                <Link href="/tuitions" className="mobile-link">Tuitions</Link>
            )}
            
            {/* Seeker Mobile Links */}
            {user && role === 'seeker' && (
              <>
                <Link href="/find-jobs" className="mobile-link">Browse Jobs</Link>
                <Link href="/saved-jobs" className="mobile-link">Saved Jobs</Link>
                <Link href="/applied-jobs" className="mobile-link">History</Link>
              </>
            )}
            
            {/* Business & Admin Mobile Links */}
            {user && (role === 'business' || role === 'admin') && (
                <>
                    <Link href="/dashboard" className="mobile-link">Dashboard</Link>
                    <Link href="/post-job" className="mobile-link text-blue-600 font-bold">Post New Job</Link>
                </>
            )}

            {/* Admin Exclusive Mobile Links */}
            {role === 'admin' && (
                <div className="bg-purple-50 p-3 rounded-lg space-y-2 border border-purple-100">
                    <p className="text-xs font-bold text-purple-800 uppercase mb-2">Admin Panel</p>
                    <Link href="/admin" className="block text-sm font-bold text-purple-900">Admin Console</Link>
                    <Link href="/admin/post-tuition" className="block text-sm font-medium text-purple-700 hover:text-purple-900">Post Tuition</Link>
                    <Link href="/admin/manage-tuitions" className="block text-sm font-medium text-purple-700 hover:text-purple-900">Manage Tuitions</Link>
                    <Link href="/find-jobs" className="block text-sm font-medium text-gray-600 hover:text-gray-900 mt-2 pt-2 border-t border-purple-100">Browse All Jobs</Link>
                </div>
            )}

            <div className="border-t border-gray-100 pt-4 mt-2">
                {user ? (
                    <div className="flex items-center justify-between">
                        <Link href="/profile" className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                                {avatarUrl && <Image src={avatarUrl} width={32} height={32} alt="Avatar" />}
                             </div>
                             <span className="font-bold text-gray-700">My Profile</span>
                        </Link>
                        <button onClick={handleSignOut} className="text-red-500 font-bold text-sm">Sign Out</button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <Link href="/login" className="w-full text-center py-3 rounded-xl border border-gray-200 font-bold text-gray-600">Sign In</Link>
                        <Link href="/signup" className="w-full text-center py-3 rounded-xl bg-blue-900 text-white font-bold">Create Account</Link>
                    </div>
                )}
            </div>
        </div>
      )}
    </nav>
  );
}