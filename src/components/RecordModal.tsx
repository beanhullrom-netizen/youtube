import React, { useState, useEffect } from 'react';
import { DailyRecord } from '../types';
import { calculateRecordMetrics } from '../utils/storage';
import { 
  X, 
  Save, 
  Calendar, 
  Users, 
  Eye, 
  Percent, 
  MessageSquareHeart, 
  Coins, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Video,
  Film
} from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DailyRecord) => void;
  initialRecord?: DailyRecord | null;
  latestRecord?: DailyRecord | null;
  averageRPM?: number;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  latestRecord,
  averageRPM = 2600,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(todayStr);
  const [yesterdaySubs, setYesterdaySubs] = useState<number>(0);
  const [todaySubs, setTodaySubs] = useState<number>(0);
  const [views, setViews] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  
  // New features: Uploaded video info and delayed revenue
  const [uploadedVideoTitle, setUploadedVideoTitle] = useState<string>('');
  const [uploadedVideoType, setUploadedVideoType] = useState<'none' | 'shorts' | 'long' | 'both'>('none');
  const [confirmedRevenue, setConfirmedRevenue] = useState<string>('');
  const [revenueStatus, setRevenueStatus] = useState<'settled' | 'pending'>('pending');

  useEffect(() => {
    if (!isOpen) return;

    if (initialRecord) {
      // Editing existing record
      setDate(initialRecord.date);
      setYesterdaySubs(initialRecord.yesterdaySubs);
      setTodaySubs(initialRecord.todaySubs);
      setViews(initialRecord.views);
      setNote(initialRecord.note || '');
      setUploadedVideoTitle(initialRecord.uploadedVideoTitle || '');
      setUploadedVideoType(initialRecord.uploadedVideoType || 'none');
      setConfirmedRevenue(initialRecord.confirmedRevenue !== undefined ? String(initialRecord.confirmedRevenue) : '');
      setRevenueStatus(initialRecord.revenueStatus || 'settled');
    } else {
      // Adding new record:
      const defaultYesterday = latestRecord ? latestRecord.todaySubs : 5000;
      setDate(todayStr);
      setYesterdaySubs(defaultYesterday);
      setTodaySubs(defaultYesterday + 60);
      setViews(4000);
      setNote('');
      setUploadedVideoTitle('');
      setUploadedVideoType('shorts');
      setConfirmedRevenue('');
      setRevenueStatus('pending'); // Today's revenue defaults to pending (2-day delay)
    }
  }, [isOpen, initialRecord, latestRecord]);

  if (!isOpen) return null;

  // Real-time calculated metrics
  const { subsGained, conversionRate, estimatedRevenue } = calculateRecordMetrics(
    yesterdaySubs,
    todaySubs,
    views,
    averageRPM
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const confRev = confirmedRevenue !== '' ? Number(confirmedRevenue) : undefined;

    const newRecord: DailyRecord = {
      id: initialRecord?.id || `rec-${date}-${Date.now().toString(36)}`,
      date,
      yesterdaySubs: Number(yesterdaySubs) || 0,
      todaySubs: Number(todaySubs) || 0,
      subsGained,
      views: Number(views) || 0,
      conversionRate,
      note: note.trim(),
      uploadedVideoTitle: uploadedVideoTitle.trim() || undefined,
      uploadedVideoType,
      estimatedRevenue,
      confirmedRevenue: confRev,
      revenueStatus: confRev !== undefined ? 'settled' : revenueStatus,
      updatedAt: new Date().toISOString(),
    };
    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialRecord ? '그날의 일지 및 기록 관리' : '새 일지 기록 작성'}
              </h2>
              <p className="text-xs text-zinc-400">
                유튜브 공식 API 통계 기반 (그날의 회고 일지와 영상 메모를 기록하세요)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* 1. Date Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span>기록 날짜</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>

          {/* 2. Daily Note (그날의 한마디) - Primary Focus */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <MessageSquareHeart className="w-4 h-4 text-purple-400" />
              <span>그날의 한마디 (데일리 회고 & 크리에이터 일지)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="오늘 영상 성과나 시청자 피드백, 느낀 점, 내일 할 일을 자유롭게 적어보세요..."
              rows={3}
              className="w-full bg-zinc-950 border border-purple-500/40 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-zinc-400">
              * 작성된 일지는 메인 대시보드와 타임라인 피드에 바로 반영됩니다.
            </p>
          </div>

          {/* 3. Uploaded Video Information */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>업로드/견인 영상 정보 (옵션)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={uploadedVideoType}
                onChange={(e) => setUploadedVideoType(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="none">영상 업로드 없음</option>
                <option value="shorts">쇼츠 (#Shorts)</option>
                <option value="long">롱폼 일반영상</option>
                <option value="both">쇼츠 + 롱폼 둘 다</option>
              </select>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={uploadedVideoTitle}
                  onChange={(e) => setUploadedVideoTitle(e.target.value)}
                  placeholder="업로드한 영상 제목 (또는 견인 영상)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* 4. YouTube Official Statistics (Subscribers, Views, Conversion) */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>YouTube 공식 통계 수치</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                API 공식 자동 집계
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">전일 마감 구독자</label>
                <input
                  type="number"
                  min="0"
                  value={yesterdaySubs || ''}
                  onChange={(e) => setYesterdaySubs(Number(e.target.value))}
                  placeholder="예: 87000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">당일 마감 구독자</label>
                <input
                  type="number"
                  min="0"
                  value={todaySubs || ''}
                  onChange={(e) => setTodaySubs(Number(e.target.value))}
                  placeholder="예: 87300"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">일일 조회수</label>
                <input
                  type="number"
                  min="0"
                  value={views || ''}
                  onChange={(e) => setViews(Number(e.target.value))}
                  placeholder="예: 11850"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
              <span>구독자 순증: <strong className={subsGained >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{subsGained >= 0 ? `+${subsGained.toLocaleString()}` : subsGained.toLocaleString()}명</strong></span>
              <span>구독 전환율: <strong className="text-emerald-400">{conversionRate.toFixed(2)}%</strong></span>
            </div>
          </div>

          {/* 5. Revenue & YouTube Settlement Delay Settings */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                애드센스 수익 (정산 지연 반영)
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                예상치: ₩{estimatedRevenue.toLocaleString()}원
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  정산 상태
                </label>
                <select
                  value={revenueStatus}
                  onChange={(e) => setRevenueStatus(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="pending">⏳ 집계 대기 (1~2일 지연 정산 중)</option>
                  <option value="settled">✓ 스튜디오 확정 완료</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">
                  유튜브 스튜디오 확정 수익(원)
                </label>
                <input
                  type="number"
                  min="0"
                  value={confirmedRevenue}
                  onChange={(e) => setConfirmedRevenue(e.target.value)}
                  placeholder={revenueStatus === 'pending' ? '정산 후 입력 (비워두면 예상치 적용)' : '확정 금액'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">
              * 당일은 유튜브 집계 지연으로 예상 수익이 자동 적용되며, 1~2일 뒤 확정 정산액을 입력해둘 수 있습니다.
            </p>
          </div>

          {/* 6. Daily Note (그날의 한마디) */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <MessageSquareHeart className="w-3.5 h-3.5 text-purple-400" />
              <span>그날의 한마디 (데일리 회고 & 메모)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="오늘 영상 성과나 느낀 점, 내일 할 일을 적어보세요..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl shadow-lg shadow-red-600/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialRecord ? '수정 완료' : '스튜디오에 저장'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
