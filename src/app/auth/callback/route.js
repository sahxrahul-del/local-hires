import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const roleParam = searchParams.get('role'); // Get role from URL

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // --- FORCE UPDATE ROLE & PREVENT OVERWRITE LOGIC ---
        let finalRole = 'seeker';
        
        // 1. Check existing profile first (Added full_name and avatar_url to selection)
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('role, phone, full_name, avatar_url')
            .eq('id', user.id)
            .single();

        // 2. Decide Role
        if (roleParam === 'business') {
             finalRole = 'business'; // URL override (Highest Priority)
        } else if (existingProfile?.role) {
             finalRole = existingProfile.role; // Respect existing
        }

        // 3. Extract Google Info
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const metaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

        // 4. UPSERT (Smart Update)
        // FIX: If they already have a name in DB, keep it. If not, use Google name.
        await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            role: finalRole,
            full_name: existingProfile?.full_name || metaName, 
            avatar_url: existingProfile?.avatar_url || metaAvatar,
            updated_at: new Date().toISOString(),
        });

        // 5. REDIRECT
        const isProfileComplete = existingProfile?.phone; 
        
        if (!isProfileComplete) {
           return NextResponse.redirect(`${origin}/profile?role=${finalRole}`);
        }

        if (finalRole === 'business') {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else {
          return NextResponse.redirect(`${origin}/find-jobs`);
        }
      }
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}