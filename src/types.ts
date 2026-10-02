export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  todaySubs: number;      // 오늘 총 구독자 수
  yesterdaySubs: number;  // 어제 구독자 수
  subsGained: number;     // 늘어난 구독자 수 (todaySubs - yesterdaySubs)
  views: number;          // 오늘 하루 전체 조회수
  conversionRate: number; // 구독 전환율 (구독 순증 / 조회수 * 100, %)
  note: string;           // 그날의 한마디 일지
  emotion?: string;       // 오늘 나의 감정 (예: '🔥 열정', '😊 뿌듯', '🤔 고민', '😰 슬럼프', '😴 지침', '🎉 대박')
  uploadedVideoTitle?: string; // 오늘 업로드한 영상 제목 (옵션)
  uploadedVideoType?: 'none' | 'shorts' | 'long' | 'both'; // 영상 형태
  uploadedVideoId?: string; // 유튜브 영상 고유 ID (예: 11자리 ID)
  uploadedVideoThumbnail?: string; // 영상 고화질 썸네일 URL
  topVideos?: {
    videoId: string;
    title: string;
    views?: number;
    thumbnailUrl?: string;
    isShorts?: boolean;
    publishedDate?: string;
  }[]; // 당일 성과 견인 TOP 영상 목록
  daysDiff?: number;          // 직전 기록과의 일수 차이 (1이면 연속, >1이면 공백)
  avgDailyGain?: number;      // 공백 기간 동안의 일평균 순증 (subsGained / daysDiff)
  isInitialBaseline?: boolean; // 최초 시작 기준점인지 여부 (이전 기록 없음)
  // 유튜브 수익 정산 지연(보통 1~2일 뒤 집계)을 반영한 수익 필드
  estimatedRevenue: number;   // 당일 예상 수익 (조회수/RPM 기준 추정치, 원화)
  confirmedRevenue?: number;  // 유튜브 스튜디오 정산 확정 수익 (보통 2일 후 집계, 원화)
  revenueStatus: 'settled' | 'pending'; // 수익 정산 확정 여부 (2일 지연 반영)
  updatedAt: string;      // 최종 수정 시각 (ISO string)
}

export interface ChannelProfile {
  channelName: string;
  creatorName: string;
  category: string;
  targetSubs: number;     // 목표 구독자 수 (10만 실버버튼 100,000 고정)
  currentSubs?: number;   // 현재 채널 실시간 총 구독자 수 (예: 87,300)
  targetDate?: string;    // 목표 달성 희망일
  averageRPM: number;     // 1,000회 조회당 예상 수익(RPM, 원화 기본 2,500원)
}

export interface TimeCapsule100k {
  isSealed: boolean;
  writtenAt: string;       // 작성 일자 (YYYY-MM-DD)
  writtenSubs: number;     // 작성 당시 구독자 수 (예: 87,300)
  title: string;           // 편지 제목 (기본: "10만의 나에게 보내는 편지")
  message: string;         // 편지 본문
  rewardPromise?: string;  // 10만 달성 시 나 자신에게 줄 보상/선물
  unsealedAt?: string;     // 개봉 일자
}
