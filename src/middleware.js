import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  // 1. Setup the Response & Supabase Client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Refresh Session (Critical for Auth to work)
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 3. FORCE REDIRECT FROM HOME IF LOGGED IN
  if (user) {
    
    // Determine Role (Try Metadata first, it's faster)
    let role = user.user_metadata?.role;

    // Fallback: If metadata is empty, check DB
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      role = profile?.role;
    }
    
    // Default Fallback
    role = role || 'seeker';

    // Map Roles to Dashboards
    const homeBases = {
      admin: '/admin',
      business: '/dashboard',
      business_manager: '/dashboard',
      business_tuition_manager: '/dashboard',
      tuition_manager: '/admin/manage-tuitions',
      seeker: '/find-jobs'
    };

    const targetUrl = homeBases[role] || '/find-jobs';

    // 🟢 THE FIX: If they are at Root ('/') or Login, KICK them to dashboard
    if (path === '/' || path === '/login' || path === '/signup') {
        const redirectRes = NextResponse.redirect(new URL(targetUrl, request.url));
        // Prevent Caching of the Redirect
        redirectRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return redirectRes;
    }

    // 🔴 SECURITY: Protect Routes based on Role
    // If a Tuition Manager tries to go to /dashboard (Business area), kick them back to their allowed area
    const protectedRoutes = {
        business: ['/dashboard', '/post-job'],
        tuition_manager: ['/admin/manage-tuitions'],
        admin: ['/admin'] // Admin dashboard
    };

    // Example: Protect /dashboard for non-business types
    if (path.startsWith('/dashboard') && !['business', 'business_manager', 'business_tuition_manager'].includes(role)) {
       return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // Example: Protect /admin (Main Admin) for non-admins
    // Note: Tuition managers need access to /admin/manage-tuitions, but NOT /admin (main)
    if (path === '/admin' && role !== 'admin') {
       return NextResponse.redirect(new URL(targetUrl, request.url));
    }

    return response;
  }

  // 4. USER IS NOT LOGGED IN
  
  // Public Paths (Everyone allowed)
  const publicPaths = [
    '/', 
    '/login', 
    '/signup', 
    '/find-jobs', 
    '/tuitions',
    '/forgot-password', 
    '/auth',
    '/contact',
    '/privacy',
    '/terms',
    '/our-story'
  ];

  // If path is NOT public, redirect to Login
  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + '/'));
  const isStatic = path.startsWith('/_next') || path.startsWith('/static') || path.includes('.');

  if (!isPublic && !isStatic) {
     return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};