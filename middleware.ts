import { NextResponse } from 'next/server';

export function middleware() {
  // Example middleware logic
  return NextResponse.next();
}

// Don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};