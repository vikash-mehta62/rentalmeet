'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import {
  Camera,
  Film,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Eye,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Building2,
  Search,
  Calendar,
  Play,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import ReelModal from '@/components/media/ReelModal';

export default function AdminMediaPostsPage() {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [venuesList, setVenuesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('all'); // 'all' | 'photo' | 'video'
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'views' | 'likes'
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Active Reel Modal for Fullscreen Preview
  const [activeReelPost, setActiveReelPost] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const getDateRange = useCallback((filter, customStart, customEnd) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (filter === 'today') return { start: todayStr, end: todayStr };
    if (filter === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return { start: yest.toISOString().split('T')[0], end: yest.toISOString().split('T')[0] };
    }
    if (filter === '7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      return { start: past7.toISOString().split('T')[0], end: todayStr };
    }
    if (filter === '30days') {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      return { start: past30.toISOString().split('T')[0], end: todayStr };
    }
    if (filter === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: firstDay.toISOString().split('T')[0], end: todayStr };
    }
    if (filter === 'custom') {
      return { start: customStart || '', end: customEnd || '' };
    }
    return { start: '', end: '' };
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
        sortBy
      });

      if (filterType !== 'all') params.set('mediaType', filterType);
      if (venueFilter !== 'all') params.set('venueId', venueFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const { start, end } = getDateRange(dateFilter, startDate, endDate);
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/media-posts?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
        setStats(data.stats);
        setTotalPages(data.pages || 1);
        setTotalCount(data.total || 0);
        if (data.venues && data.venues.length > 0) {
          setVenuesList(data.venues);
        }
      }
    } catch (err) {
      console.error('Fetch media posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token, filterType, venueFilter, sortBy, dateFilter, startDate, endDate, searchQuery, page]);

  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this media post? This will remove all associated comments and likes.')) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/media-posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ success: 'Post deleted successfully', error: '' });
        if (activeReelPost?._id === postId) setActiveReelPost(null);
        fetchPosts();
      } else {
        setFeedback({ error: data.message || 'Failed to delete post', success: '' });
      }
    } catch {
      setFeedback({ error: 'Error deleting post', success: '' });
    }
  };

  return (
    <AdminLayout title="Media Posts Moderation" subtitle="Moderate photos, vertical 9:16 reels, and inspect engagement">
      <div className="space-y-6 pb-12">

        {/* Feedback Alert */}
        {feedback.error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.error}</span>
          </div>
        )}
        {feedback.success && (
          <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.success}</span>
          </div>
        )}

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Media Posts</span>
              <Camera className="w-4 h-4 text-primary-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalPosts || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Likes Given</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600">
              {(stats?.totalLikes || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-blue-600">
              {(stats?.totalViews || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Comments</span>
              <MessageCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {(stats?.totalComments || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Enhanced Filter Toolbar (Per Client Request) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          {/* Top Row: Search & Refresh */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, caption, venue name, or owner..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary-500"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Media Type Pills */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'photo', label: 'Photos' },
                  { id: 'video', label: 'Reels/Videos' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFilterType(f.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterType === f.id
                        ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchPosts}
                className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Secondary Filters: Venue Dropdown, Date Range, Sort By */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Venue Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Filter by Venue
              </label>
              <select
                value={venueFilter}
                onChange={(e) => {
                  setVenueFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Venues</option>
                {venuesList.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.businessName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Sort By Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                <option value="newest">Newest First</option>
                <option value="views">Most Views</option>
                <option value="likes">Most Likes</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3 pt-2 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-300">Custom Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800"
              />
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Posts Count Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {posts.length} of {totalCount} total media posts</span>
          <span className="text-slate-400">Portrait 9:16 vertical cards • Click any card to preview reel</span>
        </div>

        {/* Posts Grid - 9:16 Aspect Ratio Reels & Photos */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="aspect-[9/16] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
              No media posts found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => setActiveReelPost(post)}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between select-none"
                >
                  {/* Media (Image or Video Thumbnail) */}
                  {post.mediaType === 'video' ? (
                    <video
                      src={post.mediaUrl}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                  {/* Top Bar: Media Type Badge & Moderation Delete */}
                  <div className="relative z-10 p-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {post.mediaType === 'video' ? (
                        <>
                          <Film className="w-3 h-3 text-amber-400" />
                          <span>Reel</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3 text-blue-400" />
                          <span>Photo</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={(e) => handleDeletePost(post._id, e)}
                      className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md opacity-80 group-hover:opacity-100 transition-all shadow"
                      title="Delete / Moderate Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Center Play Button for Video */}
                  {post.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Info: Venue, Title, Likes/Views */}
                  <div className="relative z-10 p-3 space-y-1.5 text-white">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 truncate">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{post.venue?.businessName || 'Venue'}</span>
                    </div>

                    <p className="text-xs font-semibold text-white line-clamp-1 leading-tight">
                      {post.title || post.caption || 'Venue Post'}
                    </p>

                    {/* Stats Pill */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/20 text-[10px] text-white/80 font-medium">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                        {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-blue-300" />
                        {post.viewsCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-emerald-300" />
                        {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-500 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Fullscreen Reel Modal */}
        {activeReelPost && (
          <ReelModal
            post={activeReelPost}
            posts={posts}
            onClose={() => setActiveReelPost(null)}
            onSelectPost={setActiveReelPost}
            token={token}
          />
        )}

      </div>
    </AdminLayout>
  );
}
