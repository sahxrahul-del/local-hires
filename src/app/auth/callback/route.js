import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const code = searchParams.get('code');
  const roleParam = searchParams.get('role'); 
  const next = searchParams.get('next'); 

  // 🟢 VERCEL HTTPS FIX: Determine the correct public origin
  // On Vercel, 'requestOrigin' might be 'http', so we check headers to force 'https'
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  
  let validOrigin = requestOrigin;

  if (!isLocalEnv && forwardedHost) {
    validOrigin = `https://${forwardedHost}`;
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // --- 2. PRIORITY REDIRECT (Fixes the Reset Password Issue) ---
      // Use 'validOrigin' instead of 'origin'
      if (next) {
          return NextResponse.redirect(`${validOrigin}${next}`);
      }

      // --- STANDARD LOGIN FLOW ---
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch existing profile to check role
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('role, phone, full_name, avatar_url')
            .eq('id', user.id)
            .single();

        let finalRole = 'seeker';
        
        // Priority: URL Param -> Existing DB Role -> Default 'seeker'
        if (roleParam === 'business') {
             finalRole = 'business'; 
        } else if (existingProfile?.role) {
             finalRole = existingProfile.role;
        }

        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const metaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

        await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            role: finalRole,
            full_name: existingProfile?.full_name || metaName, 
            avatar_url: existingProfile?.avatar_url || metaAvatar,
            updated_at: new Date().toISOString(),
        });

        // --- STRICT REDIRECT LOGIC (Using validOrigin) ---
        if (finalRole === 'admin') {
            return NextResponse.redirect(`${validOrigin}/admin`);
        } else if (finalRole === 'tuition_manager') {
            return NextResponse.redirect(`${validOrigin}/admin/manage-tuitions`);
        } else if (['business', 'business_manager', 'business_tuition_manager'].includes(finalRole)) {
            return NextResponse.redirect(`${validOrigin}/dashboard`);
        } else {
            return NextResponse.redirect(`${validOrigin}/find-jobs`);
        }
      }
    }
  }
  
  // Return to login with error if something fails
  return NextResponse.redirect(`${validOrigin}/login?error=auth_failed`);
}