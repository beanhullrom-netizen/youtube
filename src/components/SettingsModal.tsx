import React, { useState, useRef } from 'react';
import { ChannelProfile, DailyRecord } from '../types';
import { exportDataAsJSON, saveProfile } from '../utils/storage';
import { 
  X, 
  Settings, 
  Download, 
  Upload, 
  Save, 
  Check, 
  RotateCcw, 
  TvMinimalPlay, 
  Target,
  ShieldCheck,
  Coins
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ChannelProfile;
  records: DailyRecord[];
  onUpdateProfile: (profile: ChannelProfile) => void;
  onImportData: (records: DailyRecord[], profile: ChannelProfile) => void;
  onResetSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  records,
  onUpdateProfile,
  onImportData,
  onResetSampleData,
}) => {
  const [channelName, setChannelName] = useState(profile.channelName);
  const [creatorName, setCreatorName] = useState(profile.creatorName);
  const [category, setCategory] = useState(profile.category);
  const [averageRPM, setAverageRPM] = useState(profile.averageRPM || 2600);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ChannelProfile = {
      channelName: channelName.trim() || '내 스튜디오',
      creatorName: creatorName.trim() || '크리에이터',
      category: category.trim() || '유튜브 콘텐츠',
      targetSubs: 100000, // 10만 실버버튼 영구 고정
      currentSubs: profile.currentSubs || 89818,
      averageRPM: Number(averageRPM) || 2600,
    };
    onUpdateProfile(updated);
    setStatusMsg('스튜디오 설정이 성공적으로 저장되었습니다!');
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.records)) {
          onImportData(json.records, json.profile || profile);
          setStatusMsg('데이터를 성공적으로 복원했습니다!');
          setTimeout(() => {
            setStatusMsg(null);
            onClose();
          }, 1000);
        } else {
          alert('올바른 백업 JSON 파일 형식이 아닙니다.');
        }
      } catch (err) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[94dvh] sm:max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">스튜디오 설정 및 백업</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">채널 정보 변경, RPM 단가 및 데이터 백업</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          
          {/* Status Alert if any */}
          {statusMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Channel Info Section */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 sm:space-y-3">
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <TvMinimalPlay className="w-3.5 h-3.5 text-red-500" />
              <span>채널 기본 정보</span>
            </div>

            <div>
              <label className="text-[10px] sm:text-[11px] text-zinc-400 block mb-1">채널명</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="text-[10px] sm:text-[11px] text-zinc-400 block mb-1">크리에이터 이름 / 닉네임</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] text-zinc-400 block mb-1">채널 카테고리</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] sm:text-[11px] text-zinc-400 block mb-1">
                유튜브 공식 연동 채널 ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value="UCrWL7xo4p4U4ScWzZNrOMGA (게임덩어리)"
                  disabled
                  readOnly
                  className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono select-none"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                * 계정 내 여러 채널 중 '게임덩어리' 공식 채널이 최우선 연동 대상으로 지정되어 있습니다.
              </p>
            </div>
          </div>

          {/* Goal Milestone Section - 100k Fixed */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 sm:space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-zinc-300" />
                <span>목표 구독자 수 (마일스톤)</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                🔒 10만 실버버튼 고정
              </span>
            </div>

            <div>
              <input
                type="text"
                value="100,000명 (10만 실버버튼 마일스톤)"
                disabled
                readOnly
                className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-300 font-mono font-bold cursor-not-allowed select-none opacity-80"
              />
              <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                * 크리에이터 마일스톤 목표치는 100,000명(10만 실버버튼)으로 고정되어 있으며 변경할 수 없습니다.
              </p>
            </div>
          </div>

          {/* RPM Unit Price Setting */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 sm:space-y-3">
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>채널 평균 RPM 설정 (1,000회 조회당 예상 수익)</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="500"
                  step="100"
                  value={averageRPM}
                  onChange={(e) => setAverageRPM(Number(e.target.value))}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500 font-bold"
                />
                <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">원/1,000뷰</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                * 한국 유튜브 일반 영상 평균 2,000~3,500원 수준, 쇼츠 전용은 50~200원 수준입니다.
              </p>
            </div>
          </div>

          {/* Data Backup & Restore */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 sm:space-y-3">
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>데이터 안전 백업 및 복원</span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed">
              모든 기록은 Supabase 클라우드 데이터베이스에 실시간으로 안전하게 동기화됩니다. 별도 파일 보관이나 이전이 필요한 경우 JSON으로 백업할 수 있습니다.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => exportDataAsJSON(records, profile)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] sm:text-xs rounded-xl font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>JSON 백업 다운로드</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] sm:text-xs rounded-xl font-medium transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>백업 파일 복원</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  if (confirm('샘플 데이터(최근 14일)로 다시 초기화하시겠습니까?')) {
                    onResetSampleData();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-zinc-950 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-300 text-[11px] sm:text-xs rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>샘플 데이터 리셋</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            >
              닫기
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>설정 저장</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
