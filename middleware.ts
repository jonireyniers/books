import { type NextRequest, NextResponse } from 'next/server'
// import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Tijdelijk uitgeschakeld voor Next.js 16 edge runtime issues
  return NextResponse.next()
  // return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
