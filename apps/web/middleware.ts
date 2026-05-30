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

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    }
  );

  let user = null;
  const isPlaceholder = supabaseUrl.includes('placeholder') || !supabaseUrl;

  if (isPlaceholder) {
    // Development Mock Bypass: Read custom expensio secure mock session cookie directly!
    const mockSessionCookie = request.cookies.get('expensio-session');
    if (mockSessionCookie?.value) {
      try {
        user = JSON.parse(decodeURIComponent(mockSessionCookie.value));
      } catch (e) {
        user = null;
      }
    }
  } else {
    // Standard Production Supabase Authenticated Session retrieval
    try {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
      user = supabaseUser;
    } catch (e) {
      user = null;
    }
  }

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/offline'];
  const path = request.nextUrl.pathname;

  // Protect all routes except explicitly public ones or internal static routes
  const isPublicRoute = publicRoutes.includes(path);
  const isInternal = path.startsWith('/_next') || path.startsWith('/api') || path.includes('.') || path === '/manifest.webmanifest' || path === '/sw.js';

  if (!user && !isPublicRoute && !isInternal) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === '/login' || path === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)₹).*)',
  ],
};
