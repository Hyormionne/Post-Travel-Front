import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증 없이 접근 가능한 경로.
const PUBLIC_PATHS = ['/login', '/profile-setup'];

// Next.js 자산·API는 미들웨어 대상 제외.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // yh_session 쿠키가 없으면 로그인 페이지로.
  // 쿠키는 클라이언트의 setTokens() 호출 시 설정된다.
  const session = request.cookies.get('yh_session');
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 로그인은 됐지만 프로필이 없으면 프로필 설정 페이지로.
  // profile-setup 자체로의 리디렉트 루프를 막기 위해 경로 확인.
  const hasProfile = request.cookies.get('yh_profile');
  if (!hasProfile && !pathname.startsWith('/profile-setup')) {
    const profileUrl = new URL('/profile-setup', request.url);
    return NextResponse.redirect(profileUrl);
  }

  return NextResponse.next();
}
