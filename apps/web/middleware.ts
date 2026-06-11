import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAll(cookiesToSet: any[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;

  if (!supabaseUrl) {
    // If environment variables are missing, skip edge auth to prevent infinite loops
    return response;
  }

  try {
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Token is invalid or expired
      user = null;
    } else {
      user = supabaseUser;
    }
  } catch (e) {
    // Network failure (e.g. timeout) - do not force logout, let client handle it
    return response;
  }

  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/offline',
    '/auth/callback',
  ];
  const path = request.nextUrl.pathname;

  // Protect all routes except explicitly public ones or internal static routes
  const isPublicRoute = publicRoutes.includes(path);
  const isInternal =
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') ||
    path === '/manifest.webmanifest' ||
    path === '/sw.js';

  if (!user && !isPublicRoute && !isInternal) {
    // If the user is unauthenticated on a protected route, we must redirect.
    // However, to prevent infinite loops where the client thinks they are logged in,
    // we clear the sb-access-token cookie so the client also logs out.
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.cookies.delete('sb-access-token');
    redirectResponse.cookies.delete('sb-refresh-token');
    return redirectResponse;
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === '/login' || path === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
