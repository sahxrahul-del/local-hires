import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const roleParam = searchParams.get('role'); 
  const next = searchParams.get('next'); // <--- 1. CAPTURE THE 'NEXT' PAGE

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
      // If the email link told us to go somewhere specific (like /update-password), go there immediately.
      if (next) {
          return NextResponse.redirect(`${origin}${next}`);
      }

      // --- STANDARD LOGIN FLOW (Your existing logic) ---
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

        // --- STRICT REDIRECT LOGIC ---
        if (finalRole === 'admin') {
            return NextResponse.redirect(`${origin}/admin`);
        } else if (finalRole === 'tuition_manager') {
            return NextResponse.redirect(`${origin}/admin/manage-tuitions`);
        } else if (finalRole === 'business' || finalRole === 'business_manager' || finalRole === 'business_tuition_manager') {
            return NextResponse.redirect(`${origin}/dashboard`);
        } else {
            return NextResponse.redirect(`${origin}/find-jobs`);
        }
      }
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}