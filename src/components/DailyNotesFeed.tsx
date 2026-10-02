import React, { useState } from 'react';
import { DailyRecord } from '../types';
import { 
  MessageSquareHeart, 
  Search, 
  Calendar, 
  TrendingUp, 
  Eye, 
  Percent, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Video, 
  Film, 
  Sparkles,
  PlusCircle
} from 'lucide-react';

interface DailyNotesFeedProps {
  records: DailyRecord[];
  onEditRecord: (record: DailyRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateNote?: (id: string, newNote: string) => void;
}

export const DailyNotesFeed: React.FC<DailyNotesFeedProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
  onUpdateNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inline editing state for a specific note
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>('');

  // Start inline editing
  const handleStartEdit = (record: DailyRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(record.id);
    setEditDraft(record.note || '');
  };

  // Cancel inline editing
  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditDraft('');
  };

  // Save inline editing
  const handleSaveEdit = (record: DailyRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onUpdateNote) {
      onUpdateNote(record.id, editDraft.trim());
    } else {
      onEditRecord({
        ...record,
        note: editDraft.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingId(null);
    setEditDraft('');
  };

  // Filter records that have notes or titles, sorted descending by date
  const filtered = records
    .slice()
    .reverse()
    .filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (r.note && r.note.toLowerCase().includes(q)) ||
        (r.uploadedVideoTitle && r.uploadedVideoTitle.toLowerCase().includes(q)) ||
        r.date.includes(q);
      return matchesSearch;
    });

  // Latest record for quick compose
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;
  const [quickNoteDraft, setQuickNoteDraft] = useState('');
  const [isQuickSaved, setIsQuickSaved] = useState(false);

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteDraft.trim() || !latestRecord) return;
    if (onUpdateNote) {
      onUpdateNote(latestRecord.id, quickNoteDraft.trim());
    } else {
      onEditRecord({
        ...latestRecord,
        note: quickNoteDraft.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    setQuickNoteDraft('');
    setIsQuickSaved(true);
    setTimeout(() => setIsQuickSaved(false), 2500);
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg">
      
      {/* Title & Stats & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-purple-400" />
              <span>크리에이터의 '그날의 한마디' 일지</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
              총 {records.filter(r => Boolean(r.note)).length}개의 기록
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            오늘의 한마디를 바로 남기거나, 과거 카드를 눌러 <strong>즉시 직접 수정</strong>할 수 있습니다.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="한마디 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Quick Journal Compose Card for Latest Day */}
      {latestRecord && (
        <form onSubmit={handleQuickNoteSubmit} className="mb-4 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{latestRecord.date} 크리에이터 일지 작성</span>
            </span>
            {latestRecord.note && (
              <span className="text-[11px] text-zinc-400 truncate max-w-[220px]" title={latestRecord.note}>
                현재: "{latestRecord.note}"
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={quickNoteDraft}
              onChange={(e) => setQuickNoteDraft(e.target.value)}
              placeholder={latestRecord.note ? `일지 수정하기: "${latestRecord.note}"` : "오늘 영상 성과, 소감, 내일 할 일을 적어보세요..."}
              className="flex-1 bg-zinc-950 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!quickNoteDraft.trim()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1"
            >
              {isQuickSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>저장 완료!</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>일지 저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs">
          검색 결과에 맞는 '그날의 한마디'가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map((record) => {
            const isEditing = editingId === record.id;
            const rev = record.confirmedRevenue !== undefined ? record.confirmedRevenue : record.estimatedRevenue;
            
            return (
              <div
                key={record.id}
                className={`group relative bg-zinc-950/70 border rounded-xl p-4 transition-all flex flex-col justify-between ${
                  isEditing 
                    ? 'border-purple-500 ring-1 ring-purple-500/50 shadow-md shadow-purple-500/10' 
                    : 'border-zinc-800/80 hover:border-purple-500/40'
                }`}
              >
                <div>
                  {/* Header: Date + Mini KPI badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{record.date}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-medium">
                        <TrendingUp className="w-2.5 h-2.5" />
                        +{record.subsGained.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono font-medium">
                        <Eye className="w-2.5 h-2.5" />
                        {record.views >= 1000 ? `${(record.views / 1000).toFixed(1)}k` : record.views}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono font-medium">
                        <Percent className="w-2.5 h-2.5" />
                        {record.conversionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Note Content (Inline Editing or Static View) */}
                  {isEditing ? (
                    <div className="mb-3 space-y-2 animate-in fade-in duration-150">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        placeholder="이 날짜의 한마디 메모를 작성해 보세요..."
                        className="w-full text-xs bg-zinc-900 border border-purple-500/50 rounded-xl p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none h-24"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSaveEdit(record);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Ctrl+Enter로 빠른 저장</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>취소</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveEdit(record, e)}
                            className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3 h-3" />
                            <span>저장</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEdit(record)}
                      className="cursor-pointer group/text rounded-lg p-1 -m-1 hover:bg-zinc-900/60 transition-colors mb-3"
                      title="클릭하여 즉시 수정"
                    >
                      <p className="text-xs text-zinc-200 leading-relaxed italic line-clamp-3">
                        "{record.note || '메모 내용 없음 (클릭하여 작성)'}"
                      </p>
                      <span className="text-[10px] text-zinc-500 group-hover/text:text-purple-400 flex items-center gap-1 mt-1 opacity-0 group-hover/text:opacity-100 transition-opacity">
                        <Edit3 className="w-2.5 h-2.5" /> 클릭하여 즉시 수정
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Upload info & Revenue & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-zinc-400 truncate max-w-[210px]">
                    {record.uploadedVideoType === 'shorts' ? (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold shrink-0">
                        <Film className="w-3 h-3" /> 쇼츠
                      </span>
                    ) : record.uploadedVideoType === 'long' ? (
                      <span className="flex items-center gap-1 text-blue-400 font-semibold shrink-0">
                        <Video className="w-3 h-3" /> 롱폼
                      </span>
                    ) : record.uploadedVideoType === 'both' ? (
                      <span className="flex items-center gap-1 text-purple-400 font-semibold shrink-0">
                        <Film className="w-3 h-3" /> 쇼츠+롱폼
                      </span>
                    ) : null}
                    {record.uploadedVideoTitle && (
                      <span className="text-zinc-300 truncate" title={record.uploadedVideoTitle}>
                        {record.uploadedVideoTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rev ? (
                      <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ₩{rev.toLocaleString()}원
                      </span>
                    ) : null}

                    <div className="flex items-center gap-1">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(record, e)}
                          className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors cursor-pointer"
                          title="한마디 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecord(record.id);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
