-- ==============================================================================
-- 1. Daily Records Table (일일 기록 테이블)
-- ==============================================================================
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

-- ==============================================================================
-- 2. Channel Profile Table (채널 프로필 테이블)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.channel_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    channel_name TEXT NOT NULL DEFAULT '',
    creator_name TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    target_subs INTEGER NOT NULL DEFAULT 100000,
    current_subs INTEGER NOT NULL DEFAULT 87300,
    target_date TEXT,
    average_rpm INTEGER NOT NULL DEFAULT 2600,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. Time Capsule Table (10만 타임캡슐 테이블)
-- ==============================================================================
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

-- ==============================================================================
-- 4. Row Level Security (RLS) 활성화 및 읽기/쓰기 권한 부여
-- ==============================================================================
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsule_100k ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all daily_records" ON public.daily_records;
CREATE POLICY "Allow anon all daily_records" ON public.daily_records FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all channel_profile" ON public.channel_profile;
CREATE POLICY "Allow anon all channel_profile" ON public.channel_profile FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all time_capsule_100k" ON public.time_capsule_100k;
CREATE POLICY "Allow anon all time_capsule_100k" ON public.time_capsule_100k FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
