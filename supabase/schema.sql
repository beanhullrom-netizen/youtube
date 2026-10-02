-- ==============================================================================
-- 크리에이터 데일리 스튜디오 (Creator Daily Studio) - Supabase Schema & Initial Data
-- ==============================================================================

-- 1. 일일 기록 테이블 (Daily Records)
CREATE TABLE IF NOT EXISTS public.daily_records (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    today_subs BIGINT NOT NULL DEFAULT 0,
    yesterday_subs BIGINT NOT NULL DEFAULT 0,
    subs_gained INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    conversion_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    emotion TEXT DEFAULT '',
    uploaded_video_title TEXT DEFAULT '',
    uploaded_video_type TEXT DEFAULT 'none',
    uploaded_video_id TEXT DEFAULT '',
    uploaded_video_thumbnail TEXT DEFAULT '',
    top_videos JSONB DEFAULT '[]'::jsonb,
    days_diff INTEGER DEFAULT 1,
    avg_daily_gain NUMERIC(10, 2) DEFAULT 0,
    is_initial_baseline BOOLEAN DEFAULT false,
    estimated_revenue INTEGER DEFAULT 0,
    confirmed_revenue INTEGER,
    revenue_status TEXT DEFAULT 'pending',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 채널 프로필 테이블 (Channel Profile)
CREATE TABLE IF NOT EXISTS public.channel_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    channel_name TEXT NOT NULL DEFAULT '게임덩어리',
    creator_name TEXT NOT NULL DEFAULT '게임덩어리',
    category TEXT NOT NULL DEFAULT '테크 & 게임',
    target_subs INTEGER NOT NULL DEFAULT 100000,
    current_subs INTEGER NOT NULL DEFAULT 87300,
    target_date TEXT,
    average_rpm INTEGER NOT NULL DEFAULT 2600,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 10만 타임캡슐 테이블 (Time Capsule 100k)
CREATE TABLE IF NOT EXISTS public.time_capsule_100k (
    id TEXT PRIMARY KEY DEFAULT 'default',
    is_sealed BOOLEAN NOT NULL DEFAULT false,
    written_at TEXT,
    written_subs INTEGER,
    title TEXT,
    message TEXT,
    reward_promise TEXT,
    unsealed_at TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsule_100k ENABLE ROW LEVEL SECURITY;

-- 익명/인증 사용자 공용 CRUD 정책 (클라이언트 앱 직접 연동용)
DROP POLICY IF EXISTS "Allow anon all daily_records" ON public.daily_records;
CREATE POLICY "Allow anon all daily_records" ON public.daily_records FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all channel_profile" ON public.channel_profile;
CREATE POLICY "Allow anon all channel_profile" ON public.channel_profile FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all time_capsule_100k" ON public.time_capsule_100k;
CREATE POLICY "Allow anon all time_capsule_100k" ON public.time_capsule_100k FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 4. 초기 기본 프로필 데이터 삽입
INSERT INTO public.channel_profile (id, channel_name, creator_name, category, target_subs, current_subs, average_rpm)
VALUES ('default', '게임덩어리', '게임덩어리', '테크 & 게임', 100000, 87300, 2600)
ON CONFLICT (id) DO NOTHING;

-- 5. 기존 14일치 크리에이터 히스토리 데이터 마이그레이션 삽입
INSERT INTO public.daily_records (
  id, date, yesterday_subs, today_subs, subs_gained, views, conversion_rate, note,
  uploaded_video_title, uploaded_video_type, estimated_revenue, confirmed_revenue, revenue_status, updated_at
) VALUES
('rec-2026-09-13', '2026-09-13', 5820, 5865, 45, 4200, 1.07, '주말 롱폼 영상 업로드 후 반응이 조용히 올라오는 중. 인트로 편집에 신경 쓰길 잘했다.', '주말 책상 셋업 브이로그 & 생산성 팁', 'long', 10920, 11200, 'settled', '2026-09-13T22:30:00Z'),
('rec-2026-09-14', '2026-09-14', 5865, 5912, 47, 3950, 1.19, '월요일인데도 시청 지속시간이 52%로 선방함. 고정 댓글로 소통 활성화.', '월요병 극복하는 직장인 출근 루틴', 'shorts', 10270, 10500, 'settled', '2026-09-14T21:40:00Z'),
('rec-2026-09-15', '2026-09-15', 5912, 5948, 36, 3100, 1.16, '화요일 평일 비수기. 다음 쇼츠 아이디어 3개 콘티 작성 완료.', NULL, 'none', 8060, 8200, 'settled', '2026-09-15T23:15:00Z'),
('rec-2026-09-16', '2026-09-16', 5948, 6020, 72, 5400, 1.33, '드디어 6,000명 돌파! 쇼츠 하나가 피드에 걸려 조회수가 솟구침.', '단 3초 만에 정리 끝내는 아이패드 제스처 #Shorts', 'shorts', 14040, 14400, 'settled', '2026-09-16T22:00:00Z'),
('rec-2026-09-17', '2026-09-17', 6020, 6145, 125, 8900, 1.40, '쇼츠 유입 효과 지속! 댓글에 다음 편 요청이 많아 내일 퇴근 후 바로 촬영하기로.', NULL, 'none', 23140, 23800, 'settled', '2026-09-17T23:50:00Z'),
('rec-2026-09-18', '2026-09-18', 6145, 6240, 95, 7100, 1.34, '금요일 저녁이라 조회수 슬슬 반등. 커뮤니티 투표 올렸는데 참여율 1,200명 돌파!', '금요일 퇴근하고 혼자 힐링하는 1시간 룸투어', 'long', 18460, 18900, 'settled', '2026-09-18T22:10:00Z'),
('rec-2026-09-19', '2026-09-19', 6240, 6360, 120, 8400, 1.43, '새로 장만한 핀마이크 음질 칭찬 댓글이 많다. 오디오 장비 투자는 역시 아깝지 않음.', '마이크 하나 바꿨을 뿐인데 오디오 퀄리티가..', 'shorts', 21840, 22100, 'settled', '2026-09-19T21:30:00Z'),
('rec-2026-09-20', '2026-09-20', 6360, 6495, 135, 9200, 1.47, '일요일 황금 시간대(오후 7시) 업로드 성공. 첫 1시간 클릭률(CTR) 8.9% 달성!', '10분 만에 끝내는 크리에이터 영상 편집 실전 팁', 'long', 23920, 24500, 'settled', '2026-09-20T23:05:00Z'),
('rec-2026-09-21', '2026-09-21', 6495, 6580, 85, 6500, 1.31, '월요일 루틴 복귀. 구독 전환율 1.3%대로 안정적 유지 중.', NULL, 'none', 16900, 17100, 'settled', '2026-09-21T22:15:00Z'),
('rec-2026-09-22', '2026-09-22', 6580, 6668, 88, 6100, 1.44, '구독 전환율이 1.4% 넘음! 영상 후반부 자연스러운 구독 유도 멘트가 효과 만점이었다.', '아직도 이렇게 저장하시나요? 꿀팁 방출', 'shorts', 15860, 16200, 'settled', '2026-09-22T21:55:00Z'),
('rec-2026-09-23', '2026-09-23', 6668, 6780, 112, 7800, 1.44, '썸네일 A/B 테스트 후 B안으로 교체했더니 2차 유입 파도가 왔다.', NULL, 'none', 20280, 20800, 'settled', '2026-09-23T22:40:00Z'),
('rec-2026-09-24', '2026-09-24', 6780, 6920, 140, 9500, 1.47, '구독자 7천 명이 코앞이다! 시청자들과 약속했던 Q&A 영상 질문 취합 시작.', '크리에이터 장비 솔직 리뷰 (협찬 아님)', 'long', 24700, 25100, 'settled', '2026-09-24T23:20:00Z'),
('rec-2026-09-25', '2026-09-25', 6920, 7080, 160, 10400, 1.54, '드디어 7,000명 돌파 🎉 하루 조회수 1만 회 넘겼고 구독 전환율도 1.5% 돌파!', '구독자 7,000명 감사 Q&A 하이라이트 #Shorts', 'shorts', 27040, 27400, 'settled', '2026-09-25T23:59:00Z'),
('rec-2026-09-26', '2026-09-26', 7080, 7268, 188, 11850, 1.59, '오늘도 최고 기록 경신 중! 조회수 11,850회에 순증 +188명. 이번 주말 롱폼 편집 파이팅하자.', '주말 몰입 데스크 셋업 & 브이로그', 'long', 30810, NULL, 'pending', '2026-09-26T14:15:00Z')
ON CONFLICT (id) DO NOTHING;
