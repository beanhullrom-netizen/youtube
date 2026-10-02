import React, { useEffect, useState, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../services/youtubeAnalytics';
import { ShieldCheck, ShieldAlert, Lock, UserCheck, LogOut, ArrowRight, Sparkles } from 'lucide-react';

export const OWNER_EMAIL = 'beanhullrom@gmail.com';

declare const google: any;

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface AuthGateProps {
  children: (user: AuthUser, onLogout: () => void) => React.ReactNode;
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT', e);
    return null;
  }
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'access_denied'>('loading');
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 1. 초기 세션 확인 (sessionStorage 사용 - 브라우저 종료 시 자동 소멸)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cds_auth_session');
      if (stored) {
        const user: AuthUser = JSON.parse(stored);
        if (user && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          setCurrentUser(user);
          setAuthStatus('authenticated');
          return;
        } else {
          sessionStorage.removeItem('cds_auth_session');
        }
      }
    } catch (e) {
      sessionStorage.removeItem('cds_auth_session');
    }
    setAuthStatus('unauthenticated');
  }, []);

  // 2. Google Identity Services 버튼 렌더링
  useEffect(() => {
    if (authStatus !== 'unauthenticated') return;

    let checkInterval: any = null;

    const renderGoogleBtn = () => {
      if (typeof google === 'undefined' || !google.accounts?.id || !buttonRef.current) {
        return false;
      }

      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonRef.current.innerHTML = '';
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 300,
        });
        return true;
      } catch (err: any) {
        console.error('Google button render error', err);
        setErrorMessage('Google 로그인 스크립트 초기화 오류가 발생했습니다.');
        return false;
      }
    };

    if (!renderGoogleBtn()) {
      checkInterval = setInterval(() => {
        if (renderGoogleBtn()) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [authStatus]);

  // 3. Google 인증 응답 검증 및 화이트리스트 검사
  const handleCredentialResponse = (response: any) => {
    setErrorMessage(null);
    if (!response || !response.credential) {
      setErrorMessage('구글 인증 정보를 수신하지 못했습니다.');
      return;
    }

    const payload = parseJwt(response.credential);
    if (!payload || !payload.email) {
      setErrorMessage('토큰에서 계정 정보를 추출할 수 없습니다.');
      return;
    }

    const email = String(payload.email).trim().toLowerCase();

    // 엄격한 단독 계정(OWNER_EMAIL) 화이트리스트 검증
    if (email === OWNER_EMAIL.toLowerCase()) {
      const user: AuthUser = {
        email: payload.email,
        name: payload.name || '크리에이터',
        picture: payload.picture || '',
        sub: payload.sub || '',
      };
      try {
        sessionStorage.setItem('cds_auth_session', JSON.stringify(user));
      } catch {}
      setCurrentUser(user);
      setAuthStatus('authenticated');
    } else {
      // 비인가 계정 접근 즉각 차단
      sessionStorage.removeItem('cds_auth_session');
      setCurrentUser(null);
      setDeniedEmail(payload.email);
      setAuthStatus('access_denied');
    }
  };

  // 4. 로그아웃 핸들러
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('cds_auth_session');
      if (typeof google !== 'undefined' && google.accounts?.id?.disableAutoSelect) {
        google.accounts.id.disableAutoSelect();
      }
    } catch {}
    setCurrentUser(null);
    setDeniedEmail(null);
    setAuthStatus('unauthenticated');
  };

  // 5. 로딩 화면
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#090a0d] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 animate-pulse flex items-center justify-center shadow-lg shadow-red-600/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs text-zinc-400 font-medium">보안 인증 상태 확인 중...</span>
        </div>
      </div>
    );
  }

  // 6. 비인가 계정 차단 화면 (Access Denied)
  if (authStatus === 'access_denied') {
    return (
      <div className="min-h-screen bg-[#090a0d] text-zinc-100 flex items-center justify-center p-4 font-['Pretendard',sans-serif]">
        <div className="max-w-md w-full bg-zinc-950/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/50 backdrop-blur-xl animate-in zoom-in-95 duration-200 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-5 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold mb-3">
            비인가 계정 접근 차단
          </span>

          <h2 className="text-xl font-bold text-white tracking-tight mb-2">
            접근이 거부되었습니다
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            이 스튜디오는 소유자 전용 프라이빗 공간입니다.<br />
            허가되지 않은 계정으로는 데이터에 접근할 수 없습니다.
          </p>

          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-6 text-left space-y-1.5">
            <div className="text-[11px] text-zinc-500">시도한 로그인 계정</div>
            <div className="text-xs font-mono text-rose-400 font-bold truncate">
              {deniedEmail || '알 수 없는 계정'}
            </div>
            <div className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/80 flex items-center gap-1">
              <span>허가된 단독 계정:</span>
              <span className="font-mono text-emerald-400 font-bold">{OWNER_EMAIL}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white rounded-2xl text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-zinc-400" />
            <span>인가 계정({OWNER_EMAIL})으로 다시 로그인</span>
          </button>
        </div>
      </div>
    );
  }

  // 7. 로그인 전 게이트 화면 (Login Gate)
  if (authStatus === 'unauthenticated' || !currentUser) {
    return (
      <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 font-['Pretendard',sans-serif] relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-red-600/10 via-rose-500/5 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <header className="max-w-md mx-auto w-full pt-4 flex items-center justify-center gap-2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 backdrop-blur-md">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>소유자 단독 보안 잠금 모드</span>
          </div>
        </header>

        <main className="max-w-md mx-auto w-full my-auto py-8 z-10">
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-2xl text-center">
            
            {/* Top Logo Badge */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-xl shadow-red-600/30 ring-2 ring-white/20 mb-6">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
                <polygon points="10 8 15 10 10 12" fill="currentColor" stroke="none" />
              </svg>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950 shadow" />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              크리에이터 데일리 스튜디오
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed mb-7">
              10만 구독자 달성을 향한 매일의 성장 기록 및 수익 대시보드.<br />
              지정된 단독 계정 인증 후 스튜디오가 열립니다.
            </p>

            {/* Security Notice Card */}
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl mb-7 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>접근 허가된 소유자 계정</span>
              </div>
              <div className="px-3 py-2 bg-black/40 rounded-xl border border-zinc-800 font-mono text-xs font-bold text-white flex items-center justify-between">
                <span>{OWNER_EMAIL}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans">허가됨</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal">
                * 타 구글 계정으로 로그인 시 보안 정책에 따라 접속이 즉시 차단됩니다.
              </p>
            </div>

            {/* Google Sign-in Button Container */}
            <div className="flex flex-col items-center justify-center min-h-[50px] mb-3">
              <div ref={buttonRef} id="google-signin-btn" />
              {errorMessage && (
                <div className="text-xs text-rose-400 mt-3 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3 py-2">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 mt-4">
              <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Google OAuth 2.0 보안 암호화 세션 적용</span>
            </div>

          </div>
        </main>

        <footer className="max-w-md mx-auto w-full pb-4 text-center text-[11px] text-zinc-600 z-10">
          크리에이터 데일리 스튜디오 • 개인 전용 보안 인증
        </footer>
      </div>
    );
  }

  // 8. 인가 완료된 상태 -> 하위 스튜디오 렌더링
  return <>{children(currentUser, handleLogout)}</>;
};
