import React, { useState } from 'react';
import { YouTubeChannelInfo, searchChannelsByQuery } from '../services/youtubeAnalytics';
import { Search, Users, Check, X, Loader2 } from 'lucide-react';

interface ChannelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (channel: YouTubeChannelInfo) => void;
  detectedChannels: YouTubeChannelInfo[];
  token: string;
}

export const ChannelPickerModal: React.FC<ChannelPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  detectedChannels,
  token,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeChannelInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchChannelsByQuery(searchQuery, token);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('검색 결과가 없습니다. 채널명, @핸들, 또는 채널 ID로 다시 검색해보세요.');
      }
    } catch {
      setSearchError('검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (channel: YouTubeChannelInfo) => {
    onSelect(channel);
  };

  // Combine detected + search results, dedup by channelId
  const allChannels: YouTubeChannelInfo[] = [];
  const seenIds = new Set<string>();
  for (const ch of detectedChannels) {
    if (!seenIds.has(ch.channelId)) {
      seenIds.add(ch.channelId);
      allChannels.push(ch);
    }
  }
  for (const ch of searchResults) {
    if (!seenIds.has(ch.channelId)) {
      seenIds.add(ch.channelId);
      allChannels.push(ch);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white">🔗 연동할 유튜브 채널 선택</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          구글 계정에 여러 유튜브 채널이 연결되어 있습니다.<br />
          데이터를 연동할 채널을 선택하거나, 아래에서 <strong className="text-zinc-200">채널명 · @핸들 · 채널 ID</strong>로 검색하세요.
        </p>

        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="예: 게임덩어리, @gamedungeori, UCrWL7..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
          </button>
        </div>

        {searchError && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
            {searchError}
          </div>
        )}

        {/* Channel List */}
        <div className="space-y-2">
          {allChannels.length === 0 && !searchError && (
            <div className="text-center text-zinc-500 text-sm py-8">
              채널명이나 핸들(@)로 검색하여 연동할 채널을 찾아주세요.
            </div>
          )}
          {allChannels.map((channel) => {
            const isTarget = channel.channelId === 'UCrWL7xo4p4U4ScWzZNrOMGA' || channel.title.includes('게임덩어리');
            return (
              <button
                key={channel.channelId}
                type="button"
                onClick={() => handleSelect(channel)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left group ${
                  isTarget 
                    ? 'border-red-500/60 bg-red-950/20 hover:bg-red-950/40 shadow-lg shadow-red-500/10' 
                    : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                }`}
              >
                {channel.thumbnailUrl ? (
                  <img src={channel.thumbnailUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate group-hover:text-red-400 transition-colors">
                      {channel.title}
                    </span>
                    {isTarget && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold shrink-0">
                        🎯 연동 대상 채널
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span>구독자 {channel.subscriberCount.toLocaleString()}명</span>
                    {channel.customUrl && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">{channel.customUrl}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`p-2 rounded-xl transition-all shrink-0 ${
                  isTarget 
                    ? 'bg-red-600 text-white' 
                    : 'bg-zinc-800 group-hover:bg-red-600 text-zinc-400 group-hover:text-white'
                }`}>
                  <Check className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center">
          선택한 채널의 YouTube Analytics 공식 데이터를 연동합니다.
        </div>
      </div>
    </div>
  );
};
