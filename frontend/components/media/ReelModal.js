'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  MapPin,
  Calendar,
  Send,
  Flag,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function ReelModal({
  post,
  posts = [],
  onClose,
  onSelectPost,
  onToggleLike,
  onToggleSave,
  onAddComment,
  profile,
  token
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const videoRef = useRef(null);

  const currentIndex = posts.findIndex((p) => p._id === post?._id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < posts.length - 1;

  // Auto-play when post changes
  useEffect(() => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: mute and play
        setIsMuted(true);
        if (videoRef.current) videoRef.current.muted = true;
        videoRef.current?.play().catch(() => {});
      });
    }
  }, [post?._id]);

  // Keyboard navigation (Escape, Up, Down)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp' && hasPrev) onSelectPost(posts[currentIndex - 1]);
      if (e.key === 'ArrowDown' && hasNext) onSelectPost(posts[currentIndex + 1]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasPrev, hasNext, posts, onClose, onSelectPost]);

  if (!post) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    if (!post.isLiked && onToggleLike) {
      onToggleLike(post);
    }
  };

  const handleShareWhatsApp = (e) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out this reel from ${profile?.businessName || post.venue?.businessName || 'RentalMeet'}! ${post.title || ''} 👉 ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !onAddComment) return;
    onAddComment(commentInput.trim());
    setCommentInput('');
  };

  const venueName = profile?.businessName || post.venue?.businessName || 'Venue';
  const venueLocation = profile?.location?.city || post.venue?.location?.city || post.locationTag || '';
  const venueSku = profile?.sku || post.venue?.sku || '';
  const bookingLink = post.bookingUrl || (venueSku ? `/venues/${venueSku}` : '/venues');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Close button top-right on desktop */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/90 transition-all backdrop-blur-md"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Up / Down Navigation buttons (Desktop) */}
      <div className="hidden lg:flex flex-col gap-3 absolute right-8 top-1/2 -translate-y-1/2 z-40">
        <button
          disabled={!hasPrev}
          onClick={() => onSelectPost(posts[currentIndex - 1])}
          className={`p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md ${
            !hasPrev ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'
          }`}
          title="Previous Reel (Arrow Up)"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          disabled={!hasNext}
          onClick={() => onSelectPost(posts[currentIndex + 1])}
          className={`p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md ${
            !hasNext ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'
          }`}
          title="Next Reel (Arrow Down)"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Main 9:16 Vertical Reel Container */}
      <div
        className="relative w-full sm:w-[420px] sm:max-w-md h-full sm:h-[90vh] sm:max-h-[840px] aspect-[9/16] bg-black sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10"
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
      >
        {/* Media Render (Video or Photo in 9:16) */}
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {post.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={post.mediaUrl}
              loop
              playsInline
              autoPlay
              muted={isMuted}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.title || 'Venue Photo'}
              className="w-full h-full object-cover"
            />
          )}

          {/* Dark gradient at bottom and top for readable text */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Big Play/Pause Indicator on tap */}
          {!isPlaying && post.mediaType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="p-5 rounded-full bg-black/60 text-white backdrop-blur-md animate-scale-up">
                <Play className="w-12 h-12 fill-white" />
              </div>
            </div>
          )}

          {/* Animated Heart on double tap */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl animate-ping" />
            </div>
          )}
        </div>

        {/* Top Header Overlay */}
        <div className="relative z-20 flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 border border-white/40 p-0.5">
              <img
                src={profile?.profilePhoto || '/logo.png'}
                alt=""
                className="w-full h-full object-cover rounded-full"
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold drop-shadow">{venueName}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              </div>
              {venueLocation && (
                <p className="text-[11px] text-white/80 flex items-center gap-1 drop-shadow">
                  <MapPin className="w-3 h-3 text-emerald-400" /> {venueLocation}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.mediaType === 'video' && (
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-all"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            {/* Close button on mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="sm:hidden p-2 rounded-full bg-black/50 text-white backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right-Side Floating Action Column (Like, Comment, Share, Save) */}
        <div className="relative z-20 self-end pr-3.5 pb-20 flex flex-col items-center gap-5 text-white">
          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleLike) onToggleLike(post);
            }}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className={`p-3 rounded-full backdrop-blur-md transition-all ${
              post.isLiked ? 'bg-rose-500/20 text-rose-500' : 'bg-black/40 text-white hover:bg-black/60'
            }`}>
              <Heart className={`w-7 h-7 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </div>
            <span className="text-xs font-bold drop-shadow">{(post.likesCount || 0).toLocaleString()}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all">
              <MessageCircle className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold drop-shadow">{(post.commentsCount || 0).toLocaleString()}</span>
          </button>

          {/* Share via WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            title="Share on WhatsApp"
          >
            <div className="p-3 rounded-full bg-black/40 text-white hover:bg-emerald-600 backdrop-blur-md transition-all">
              <Share2 className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold drop-shadow">Share</span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSave) onToggleSave(post);
            }}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className={`p-3 rounded-full backdrop-blur-md transition-all ${
              post.isSaved ? 'bg-amber-500/20 text-amber-400' : 'bg-black/40 text-white hover:bg-black/60'
            }`}>
              <Bookmark className={`w-7 h-7 ${post.isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
            </div>
            <span className="text-xs font-bold drop-shadow">Save</span>
          </button>
        </div>

        {/* Bottom Caption & Book Venue CTA */}
        <div className="relative z-20 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1.5 max-w-[85%]">
            <h3 className="text-sm font-bold text-white drop-shadow line-clamp-1">{post.title}</h3>
            {post.caption && (
              <p className="text-xs text-white/90 drop-shadow line-clamp-2 leading-relaxed">
                {post.caption}
              </p>
            )}
            {post.hashtags && post.hashtags.length > 0 && (
              <p className="text-[11px] text-amber-300 font-semibold drop-shadow truncate">
                {post.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
              </p>
            )}
          </div>

          {/* Book This Venue CTA */}
          <div className="flex items-center gap-2 pt-1">
            <Link
              href={bookingLink}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Book This Venue</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Quick Next Mobile Button */}
            {hasNext && (
              <button
                onClick={() => onSelectPost(posts[currentIndex + 1])}
                className="lg:hidden p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
                title="Next"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Slide-Up Comments Panel */}
        {showComments && (
          <div
            className="absolute inset-x-0 bottom-0 h-[65%] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col z-40 animate-slide-up border-t border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Comments Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary-600" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Comments ({(post.commentsCount || post.comments?.length || 0)})
                </h4>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {(!post.comments || post.comments.length === 0) ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                post.comments.map((c, i) => (
                  <div key={i} className="flex gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      {(c.userName || c.user?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.userName || c.user?.name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        {c.comment || c.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleCommentSubmit} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-2">
              <input
                type="text"
                placeholder={token ? "Write a comment..." : "Login to write a comment..."}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
