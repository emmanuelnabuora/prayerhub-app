import { NextRequest, NextResponse } from 'next/server';

// Route guard at the edge: no admin_token cookie means no admin page renders,
// full stop, regardless of what any individual page does or forgets to check.
// The actual authorization (which role can see what) still happens API-side —
// this middleware only gates "logged in as *something*," not "logged in as an
// admin," since that check requires a network call the middleware doesn't make.
export function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
