import React, { useState, useEffect } from 'react';
import { DailyRecord } from '../types';
import { 
  fetchDayTopVideos, 
  fetchMyLatestVideos, 
  getCurrentAccessToken, 
  ChannelVideoItem 
} from '../services/youtubeAnalytics';
import { 
  X, 
  ExternalLink, 
  Play, 
  Sparkles, 
  TrendingUp, 
  Flame, 
  Rocket, 
  Calendar, 
  Users, 
  Eye, 
  Loader2, 
  Edit3, 
  Check, 
  Film, 
  Video, 
  HelpCircle,
  BarChart2,
  TvMinimalPlay
} from 'lucide-react';

interface OutlierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DailyRecord | null;
  avgViews: number;
  onNavigateToDashboard?: (recordId: string) => void;
  onUpdateRecord?: (updatedRecord: DailyRecord) => void;
  onOpenEditModal?: (record: DailyRecord) => void;
}

interface TopVideoItem {
  videoId: string;
  title: string;
  views?: number;
  thumbnailUrl: string;
  isShorts?: boolean;
  publishedDate?: string;
}

export const OutlierDetailModal: React.FC<OutlierDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  avgViews,
  onNavigateToDashboard,
  onUpdateRecord,
  onOpenEditModal,
}) => {
  const [topVideos, setTopVideos] = useState<TopVideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [channelVideos, setChannelVideos] = useState<ChannelVideoItem[]>([]);
  const [isSelectingVideo, setIsSelectingVideo] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !record) return;

    setIsSelectingVideo(false);
    setSaveSuccessMsg(null);
    setManualTitle(record.uploadedVideoTitle || '');
    setManualUrl(record.uploadedVideoId ? `https://www.youtube.com/watch?v=${record.uploadedVideoId}` : '');

    // 1. 기존 레코드에 저장된 topVideos 가 있다면 우선 설정
    const initialList: TopVideoItem[] = [];
    if (record.topVideos && record.topVideos.length > 0) {
      record.topVideos.forEach(v => {
        initialList.push({
          videoId: v.videoId,
          title: v.title,
          views: v.views,
          thumbnailUrl: v.thumbnailUrl || (v.videoId ? `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg` : ''),
          isShorts: v.isShorts,
          publishedDate: v.publishedDate,
        });
      });
    } else if (record.uploadedVideoTitle) {
      initialList.push({
        videoId: record.uploadedVideoId || '',
        title: record.uploadedVideoTitle,
        thumbnailUrl: record.uploadedVideoThumbnail || (record.uploadedVideoId ? `https://i.ytimg.com/vi/${record.uploadedVideoId}/hqdefault.jpg` : ''),
        isShorts: record.uploadedVideoType === 'shorts',
      });
    }

    setTopVideos(initialList);

    // 2. 유튜브 토큰이 있을 경우, 이 날짜에 실제로 뷰를 가장 많이 견인한 TOP 영상 API 조회 시도
    const token = getCurrentAccessToken();
    if (token) {
      setIsLoadingVideos(true);
      Promise.all([
        fetchDayTopVideos(record.date, token),
        fetchMyLatestVideos(token, 30),
      ]).then(([apiTopVideos, latestUploads]) => {
        setChannelVideos(latestUploads);
        if (apiTopVideos && apiTopVideos.length > 0) {
          setTopVideos(apiTopVideos.map(v => ({
            videoId: v.videoId,
            title: v.title,
            views: v.views,
            thumbnailUrl: v.thumbnailUrl,
            isShorts: v.isShorts,
          })));

          // 첫 번째 영상으로 자동 보강 저장
          if (!record.uploadedVideoId && apiTopVideos[0]) {
            const first = apiTopVideos[0];
            const updated: DailyRecord = {
              ...record,
              uploadedVideoTitle: first.title,
              uploadedVideoId: first.videoId,
              uploadedVideoThumbnail: first.thumbnailUrl,
              uploadedVideoType: first.isShorts ? 'shorts' : 'long',
              topVideos: apiTopVideos,
            };
            onUpdateRecord?.(updated);
          }
        }
      }).catch(err => {
        console.warn('[OutlierDetailModal] 영상 조회 실패:', err);
      }).finally(() => {
        setIsLoadingVideos(false);
      });
    }
  }, [isOpen, record?.id]);

  if (!isOpen || !record) return null;

  const multiplier = avgViews > 0 ? Number((record.views / avgViews).toFixed(2)) : 1;
  const isSuper = multiplier >= 2.0;
  const isHigh = multiplier >= 1.4 && !isSuper;

  // 요일 계산
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayOfWeek = dayNames[new Date(record.date).getDay()];

  // 영상 연결/선택 핸들러
  const handleSelectChannelVideo = (vid: ChannelVideoItem) => {
    const updated: DailyRecord = {
      ...record,
      uploadedVideoTitle: vid.title,
      uploadedVideoId: vid.videoId,
      uploadedVideoThumbnail: vid.thumbnailUrl,
      uploadedVideoType: vid.isShorts ? 'shorts' : 'long',
      topVideos: [{
        videoId: vid.videoId,
        title: vid.title,
        thumbnailUrl: vid.thumbnailUrl,
        isShorts: vid.isShorts,
        publishedDate: vid.date,
      }],
      updatedAt: new Date().toISOString(),
    };
    onUpdateRecord?.(updated);
    setTopVideos([{
      videoId: vid.videoId,
      title: vid.title,
      thumbnailUrl: vid.thumbnailUrl,
      isShorts: vid.isShorts,
      publishedDate: vid.date,
    }]);
    setIsSelectingVideo(false);
    setSaveSuccessMsg(`'${vid.title}' 영상이 연결되었습니다!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // 수동 입력 저장 핸들러
  const handleSaveManualVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    let extractedId = '';
    if (manualUrl) {
      const match = manualUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
      if (match) {
        extractedId = match[1];
      }
    }

    const thumb = extractedId ? `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg` : '';
    const updated: DailyRecord = {
      ...record,
      uploadedVideoTitle: manualTitle.trim(),
      uploadedVideoId: extractedId || undefined,
      uploadedVideoThumbnail: thumb || undefined,
      topVideos: [{
        videoId: extractedId,
        title: manualTitle.trim(),
        thumbnailUrl: thumb,
        isShorts: manualTitle.toLowerCase().includes('#shorts'),
      }],
      updatedAt: new Date().toISOString(),
    };
    onUpdateRecord?.(updated);
    setTopVideos([{
      videoId: extractedId,
      title: manualTitle.trim(),
      thumbnailUrl: thumb,
      isShorts: manualTitle.toLowerCase().includes('#shorts'),
    }]);
    setIsSelectingVideo(false);
    setSaveSuccessMsg('영상 정보가 저장되었습니다!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const primaryVideo = topVideos[0] || (record.uploadedVideoTitle ? {
    videoId: record.uploadedVideoId || '',
    title: record.uploadedVideoTitle,
    thumbnailUrl: record.uploadedVideoThumbnail || (record.uploadedVideoId ? `https://i.ytimg.com/vi/${record.uploadedVideoId}/hqdefault.jpg` : ''),
    isShorts: record.uploadedVideoType === 'shorts',
  } : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800/80 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Flame className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-mono">
                  {record.date} ({dayOfWeek})
                </h2>
                {isSuper ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black shadow-sm shadow-red-600/30">
                    <Rocket className="w-3 h-3" />
                    <span>{multiplier}x 초대박</span>
                  </span>
                ) : isHigh ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{multiplier}x 급상승</span>
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                    {multiplier}x 평상
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                대박 성과 상세 분석 & 조회수 견인 영상 확인
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-6">

          {/* 1. 당일 주요 성과 지표 3단 그리드 */}
          <div className="grid grid-cols-3 gap-3">
            
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-medium text-zinc-400 flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                일일 조회수
              </span>
              <div className="text-lg sm:text-xl font-black text-white font-mono mt-1">
                {record.views.toLocaleString()}회
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                채널 평균 대비 +{Math.round((multiplier - 1) * 100)}%
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-medium text-zinc-400 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                늘어난 구독자
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1">
                +{record.subsGained.toLocaleString()}명
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                당일 순증 수치
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-medium text-zinc-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                구독 전환율
              </span>
              <div className="text-lg sm:text-xl font-black text-purple-300 font-mono mt-1">
                {record.conversionRate.toFixed(2)}%
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                1,000뷰당 {(record.conversionRate * 10).toFixed(1)}명
              </div>
            </div>

          </div>

          {/* 2. 핵심 섹션: 이 날 어떤 영상이 조회수를 견인했는가? */}
          <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
                  <Play className="w-4 h-4 fill-red-500 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">이 날 성과를 견인한 핵심 영상</h3>
                  <p className="text-[11px] text-zinc-400">
                    {primaryVideo ? '알고리즘 급상승 기여 영상 상세 정보' : '조회수 급등에 기여한 영상을 확인하거나 연결하세요'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLoadingVideos && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 bg-zinc-800 px-2.5 py-1 rounded-lg">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    <span>API 조회 중</span>
                  </span>
                )}
                <button
                  onClick={() => setIsSelectingVideo(!isSelectingVideo)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isSelectingVideo ? '닫기' : '영상 변경/연결'}</span>
                </button>
              </div>
            </div>

            {/* 영상 선택 / 직접 입력 폼 (토글) */}
            {isSelectingVideo && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 animate-in fade-in duration-200">
                
                {/* 1. 최근 업로드 영상 목록에서 1초 만에 선택 */}
                {channelVideos.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-2">
                      내 채널 최근 영상 목록에서 선택 (클릭하면 즉시 연결):
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {channelVideos.map((vid) => (
                        <div
                          key={vid.videoId}
                          onClick={() => handleSelectChannelVideo(vid)}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 hover:border-red-500/50 border border-zinc-800/80 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {vid.thumbnailUrl ? (
                              <img 
                                src={vid.thumbnailUrl} 
                                alt="" 
                                className="w-12 h-7 object-cover rounded-md shrink-0 bg-zinc-800" 
                              />
                            ) : (
                              <div className="w-12 h-7 bg-zinc-800 rounded-md shrink-0 flex items-center justify-center text-[10px]">
                                No img
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs text-zinc-200 font-medium truncate group-hover:text-red-400 transition-colors">
                                {vid.title}
                              </div>
                              <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                                <span>{vid.date} 업로드</span>
                                {vid.isShorts && <span className="text-rose-400">#Shorts</span>}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] text-zinc-400 group-hover:text-white px-2 py-0.5 rounded bg-zinc-800 shrink-0 ml-2">
                            선택
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. 또는 수동 입력 */}
                <form onSubmit={handleSaveManualVideo} className="pt-3 border-t border-zinc-800 space-y-2.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    또는 영상 제목 및 YouTube 링크 직접 입력:
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="영상 제목 (예: 발로란트 역대급 클러치 영상)"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="YouTube 영상 링크 (예: https://www.youtube.com/watch?v=...)"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            )}

            {/* 대표 기여 영상 카드 */}
            {primaryVideo ? (
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                
                {/* 썸네일 영역 */}
                <div className="relative group/thumb w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800 shadow-md">
                  {primaryVideo.thumbnailUrl ? (
                    <img 
                      src={primaryVideo.thumbnailUrl} 
                      alt={primaryVideo.title}
                      className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105 duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-xs">
                      <TvMinimalPlay className="w-6 h-6 mb-1 text-zinc-700" />
                      <span>썸네일 없음</span>
                    </div>
                  )}

                  {/* Play Overlay Button */}
                  {primaryVideo.videoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${primaryVideo.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 flex items-center justify-center transition-colors"
                      title="YouTube에서 바로 재생하기"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </a>
                  )}

                  {/* Shorts / Longform Badge */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-md ${
                    primaryVideo.isShorts 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    {primaryVideo.isShorts ? '쇼츠 (Shorts)' : '롱폼 (Long)'}
                  </span>
                </div>

                {/* 영상 정보 및 링크 */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      {record.uploadedVideoTitle ? '당일 업로드 영상' : '알고리즘 역주행 견인 영상'}
                    </span>
                    {primaryVideo.publishedDate && (
                      <span className="text-[11px] text-zinc-500">
                        {primaryVideo.publishedDate} 업로드
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
                    {primaryVideo.title}
                  </h4>

                  {primaryVideo.views && (
                    <div className="text-xs text-zinc-400">
                      당일 기여 조회수: <strong className="text-white font-mono font-bold">{primaryVideo.views.toLocaleString()}회</strong> 
                      <span className="text-zinc-500 ml-1">
                        (전체의 약 {Math.round((primaryVideo.views / record.views) * 100)}%)
                      </span>
                    </div>
                  )}

                  {primaryVideo.videoId ? (
                    <div className="pt-1">
                      <a
                        href={`https://www.youtube.com/watch?v=${primaryVideo.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-red-400" />
                        <span>YouTube에서 영상 시청하기</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-500">
                      * 영상 링크가 등록되어 있지 않습니다. 우측 '영상 변경/연결' 버튼으로 링크를 등록할 수 있습니다.
                    </div>
                  )}

                </div>

              </div>
            ) : (
              /* 아직 영상이 연결되지 않았을 때의 안내 카드 */
              <div className="p-6 rounded-2xl bg-zinc-950/60 border border-dashed border-zinc-800 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Film className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                    등록된 영상이 없습니다 (기존 영상 견인)
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                    이 날짜에 새로 업로드된 영상이 없더라도, 우측 <strong>'영상 변경/연결'</strong> 버튼을 눌러 이 날 알고리즘을 탔던 영상을 연결하실 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={() => setIsSelectingVideo(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>내 영상 연결하기</span>
                </button>
              </div>
            )}

            {/* 여러 개 영상이 함께 견인한 경우 (TOP 2, TOP 3 리스트) */}
            {topVideos.length > 1 && (
              <div className="pt-3 border-t border-zinc-800/60 space-y-2">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <span>함께 조회수를 견인한 추천 영상 목록 (TOP {topVideos.length})</span>
                </span>
                <div className="space-y-1.5">
                  {topVideos.slice(1).map((subVid, idx) => (
                    <div 
                      key={subVid.videoId || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {subVid.thumbnailUrl && (
                          <img 
                            src={subVid.thumbnailUrl} 
                            alt="" 
                            className="w-10 h-6 object-cover rounded shrink-0 bg-zinc-900" 
                          />
                        )}
                        <span className="text-zinc-300 font-medium truncate">
                          {subVid.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {subVid.views && (
                          <span className="font-mono text-zinc-400 text-[11px]">
                            {subVid.views.toLocaleString()}회
                          </span>
                        )}
                        {subVid.videoId && (
                          <a
                            href={`https://www.youtube.com/watch?v=${subVid.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="유튜브에서 시청"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* 3. 그날의 한마디 (일지) & 메모 */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400">그날의 한마디 기록</span>
            <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60">
              {record.note || '기록된 메모가 없습니다.'}
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {onOpenEditModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditModal(record);
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>이 날짜 수치 수정</span>
              </button>
            )}

            {onNavigateToDashboard && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDashboard(record.id);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>일일 대시보드로 이동</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
