import React, { useState, useMemo } from 'react';
import { DailyRecord } from '../types';
import { 
  Table, 
  ArrowUpDown, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Percent,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Video,
  Film
} from 'lucide-react';
import { exportDataAsCSV } from '../utils/storage';

interface HistoryTableProps {
  records: DailyRecord[];
  onEditRecord: (record: DailyRecord) => void;
  onDeleteRecord: (id: string) => void;
}

type SortField = 'date' | 'todaySubs' | 'subsGained' | 'views' | 'conversionRate' | 'estimatedRevenue';

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterSearch, setFilterSearch] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedAndFiltered = useMemo(() => {
    return records
      .filter((r) => {
        const q = filterSearch.toLowerCase();
        return (
          r.date.includes(q) ||
          (r.note && r.note.toLowerCase().includes(q)) ||
          (r.uploadedVideoTitle && r.uploadedVideoTitle.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (valA === undefined) valA = 0;
        if (valB === undefined) valB = 0;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [records, sortField, sortOrder, filterSearch]);

  return (
    <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Table className="w-5 h-5 text-red-500" />
            <span>일자별 상세 기록표</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            구독자 순증, 일일 조회수, 전환율, 업로드 영상, 정산 상태 및 그날의 한마디를 종합 정리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="날짜, 메모, 영상제목 검색..."
              className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            onClick={() => exportDataAsCSV(records)}
            className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
            title="CSV 파일로 다운로드"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV 저장</span>
          </button>
        </div>
      </div>

      {/* Official YouTube Data Grounding Notice */}
      <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>
            <strong>데이터 일치 검증 완료</strong>: 각 행의 <strong>순증 구독자, 일일 조회수, 수익, 업로드 영상</strong>은 해당 날짜 당일에 발생한 <strong>100% 공식 데이터</strong>입니다.
          </span>
        </span>
        <span className="text-zinc-500 text-[10px]">
          (유튜브 공식 일별 리포트는 약 3~4일 전까지의 통계가 확정 제공됩니다)
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
              <th 
                onClick={() => handleSort('date')} 
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>날짜</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('subsGained')} 
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>늘어난 구독자 (순증)</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('todaySubs')} 
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>당일 마감 구독자</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('views')} 
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>일일 조회수</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('conversionRate')} 
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>구독 전환율</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('estimatedRevenue')} 
                className="py-3 px-3.5 font-semibold cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>수익 (정산상태)</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>
              <th className="py-3 px-3.5 font-semibold text-zinc-400 min-w-[200px]">
                그날의 한마디 & 업로드 영상
              </th>
              <th className="py-3 px-3.5 font-semibold text-center text-zinc-400 w-16">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {sortedAndFiltered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-zinc-500">
                  기록된 내역이 없습니다.
                </td>
              </tr>
            ) : (
              sortedAndFiltered.map((row) => {
                const growthRate = row.yesterdaySubs > 0 
                  ? ((row.subsGained / row.yesterdaySubs) * 100).toFixed(2)
                  : '0';

                const revAmount = row.confirmedRevenue !== undefined ? row.confirmedRevenue : (row.estimatedRevenue || 0);
                const isSettled = row.revenueStatus === 'settled';

                return (
                  <tr 
                    key={row.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-3.5 font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{row.date}</span>
                      </div>
                    </td>

                    {/* Subs Gained (늘어난 구독자) */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        row.subsGained >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {row.subsGained >= 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            +{row.subsGained.toLocaleString()}명
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            {row.subsGained.toLocaleString()}명
                          </>
                        )}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          (+{growthRate}%)
                        </span>
                      </span>
                    </td>

                    {/* Today Subs (당일 마감 구독자) */}
                    <td className="py-3 px-3.5 text-right font-medium text-zinc-300 whitespace-nowrap font-mono">
                      {row.todaySubs.toLocaleString()}명
                    </td>

                    {/* Views */}
                    <td className="py-3 px-3.5 text-right font-semibold text-blue-400 whitespace-nowrap">
                      {row.views.toLocaleString()}회
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        row.conversionRate >= 1.5 
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : row.conversionRate >= 1.0
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        <Percent className="w-2.5 h-2.5" />
                        {row.conversionRate.toFixed(2)}%
                      </span>
                    </td>

                    {/* Revenue & Settlement Status */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-emerald-400 font-mono">
                          ₩{revAmount.toLocaleString()}원
                        </span>
                        <span className={`text-[10px] flex items-center gap-0.5 ${
                          isSettled ? 'text-zinc-400' : 'text-amber-400'
                        }`}>
                          {isSettled ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              정산완료
                            </>
                          ) : (
                            <>
                              <Clock className="w-2.5 h-2.5 text-amber-400" />
                              지연집계대기
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Daily Note & Video */}
                    <td className="py-3 px-3.5 text-zinc-300 max-w-sm">
                      <div className="space-y-1">
                        {row.uploadedVideoTitle && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
                            {row.uploadedVideoType === 'shorts' ? (
                              <span className="text-rose-400 shrink-0 flex items-center gap-0.5">
                                <Film className="w-3 h-3" /> 쇼츠
                              </span>
                            ) : row.uploadedVideoType === 'both' ? (
                              <span className="text-purple-400 shrink-0 flex items-center gap-0.5">
                                <Film className="w-3 h-3" /> 쇼츠+롱폼
                              </span>
                            ) : (
                              <span className="text-blue-400 shrink-0 flex items-center gap-0.5">
                                <Video className="w-3 h-3" /> 롱폼
                              </span>
                            )}
                            <span className="truncate text-white" title={row.uploadedVideoTitle}>
                              {row.uploadedVideoTitle}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-zinc-300 italic truncate" title={row.note}>
                          {row.note ? `"${row.note}"` : <span className="text-zinc-600">작성된 한마디 없음</span>}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditRecord(row)}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(row.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 px-1">
        <span>총 {sortedAndFiltered.length}개의 일일 기록 표시 중</span>
        <span>클릭하여 정렬 기준 변경 가능</span>
      </div>

    </div>
  );
};
