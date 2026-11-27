'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import ReelModal from '@/components/media/ReelModal';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  ShieldCheck,
  MapPin,
  Heart,
  MessageCircle,
  Eye,
  Bookmark,
  Calendar,
  Grid,
  Film,
  Image as ImageIcon,
  Check,
  Copy,
  Send,
  Sparkles,
  ExternalLink,
  Flag
} from 'lucide-react';

export default function PublicVenueMediaProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { sku } = params;
  const { token, user } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Selected post for modal/detailed view
  const [activePost, setActivePost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleReportPost = async (post) => {
    const reason = window.prompt('Please specify reason for reporting this post (e.g. Inappropriate content, copyright violation):');
    if (!reason) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${post._id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      alert(data.message || 'Report submitted.');
    } catch {
      alert('Error submitting report.');
    }
  };

  const sharePostWhatsApp = (post) => {
    const text = `Take a look at this venue setup on RentalMeet! ${post.title || ''} - ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const fetchProfileAndPosts = async () => {
    if (!sku) return;
    try {
      setLoading(true);
      const [resProfile, resPosts] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${sku}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${sku}/posts?tab=${activeTab}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      ]);

      const dataProfile = await resProfile.json();
      const dataPosts = await resPosts.json();

      if (dataProfile.success) {
        setProfile(dataProfile.profile);
        setIsFollowing(dataProfile.profile.isFollowing || false);
        setFollowersCount(dataProfile.profile.stats?.followers || 0);
      }
      if (dataPosts.success) {
        setPosts(dataPosts.posts);
      }
    } catch (err) {
      console.error('Fetch public media profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
  }, [sku, activeTab, token]);

  // Toggle Follow
  const handleToggleFollow = async () => {
    if (!token) {
      router.push(`/login?redirect=/venues/${sku}/media`);
      return;
    }
    if (!profile?.venueId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${profile.venueId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  // Toggle Like Post
  const handleToggleLike = async (post) => {
    if (!token) {
      router.push(`/login?redirect=/venues/${sku}/media`);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${post._id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id
              ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount }
              : p
          )
        );
        if (activePost?._id === post._id) {
          setActivePost((p) => ({ ...p, isLiked: data.isLiked, likesCount: data.likesCount }));
        }
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Toggle Save Post
  const handleToggleSave = async (post) => {
    if (!token) {
      router.push(`/login?redirect=/venues/${sku}/media`);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${post._id}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id
              ? { ...p, isSaved: data.isSaved, savesCount: data.savesCount }
              : p
          )
        );
        if (activePost?._id === post._id) {
          setActivePost((p) => ({ ...p, isSaved: data.isSaved, savesCount: data.savesCount }));
        }
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!token) {
      router.push(`/login?redirect=/venues/${sku}/media`);
      return;
    }
    if (!activePost || !commentText.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${activePost._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: commentText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        const updatedComments = [...(activePost.comments || []), data.comment];
        setActivePost((p) => ({ ...p, comments: updatedComments, commentsCount: data.commentsCount }));
        setPosts((prev) =>
          prev.map((p) =>
            p._id === activePost._id
              ? { ...p, comments: updatedComments, commentsCount: data.commentsCount }
              : p
          )
        );
        setCommentText('');
      }
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  // Record View
  const handleOpenPost = (post) => {
    setActivePost(post);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${post._id}/view`, {
      method: 'POST'
    }).catch(() => {});
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Take a look at ${profile?.businessName || 'this venue'} on RentalMeet! Explore photos, videos and book online: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={`/venues/${sku}`}
            className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Venue Details</span>
          </Link>

          <span className="text-sm font-bold truncate max-w-[180px]">
            {profile?.businessName}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={shareWhatsApp}
              title="Share on WhatsApp"
              className="p-1.5 hover:bg-slate-800 rounded-xl text-green-400"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto space-y-6 pt-4 px-4">

        {/* 1. SOCIAL PROFILE HEADER (IMAGE 1) */}
        <div className="bg-[#0f172a] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex-shrink-0 shadow-md">
              {profile?.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt={profile.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-black">{profile?.businessName}</h1>
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{profile?.location?.city}, {profile?.location?.state}</span>
              </div>

              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                {profile?.subscriptionPlan || 'Verified Venue'}
              </span>
            </div>
          </div>

          {/* Stats: Posts | Followers | Following */}
          <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-800 text-center">
            <div>
              <p className="text-lg font-black">{profile?.stats?.posts || 0}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Posts</p>
            </div>
            <div>
              <p className="text-lg font-black">{followersCount}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Followers</p>
            </div>
            <div>
              <p className="text-lg font-black">{profile?.stats?.following || 0}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Following</p>
            </div>
          </div>

          {/* Bio */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {profile?.bio}
          </p>

          {/* Action Row: Follow & Book Now */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleToggleFollow}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                isFollowing
                  ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                  : 'bg-primary-600 text-white hover:bg-primary-500'
              }`}
            >
              {isFollowing ? '✓ Following' : '+ Follow'}
            </button>

            <Link
              href={`/venues/${sku}`}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Book Venue
            </Link>
          </div>
        </div>

        {/* 2. VIEWS & LIKES STATS ROW */}
        <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div>
            <div className="inline-flex p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 mb-1">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {(profile?.stats?.views || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">Views</p>
          </div>

          <div>
            <div className="inline-flex p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 mb-1">
              <Heart className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {(profile?.stats?.likes || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">Likes</p>
          </div>

          <div>
            <div className="inline-flex p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mb-1">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-black text-slate-900 dark:text-white">
              {(profile?.stats?.enquiries || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">Enquiries</p>
          </div>
        </div>

        {/* 3. TABS: Posts | Videos | Photos | Saved (IMAGE 2) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-around border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'posts'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Posts</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'videos'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Videos</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'photos'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photos</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'saved'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved</span>
            </button>
          </div>

          {/* GRID */}
          <div className="p-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No content in this tab yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    onClick={() => handleOpenPost(post)}
                    className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 cursor-pointer shadow-md border border-slate-200 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {post.mediaType === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={post.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white">
                          <Film className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
                      <p className="text-xs font-bold line-clamp-1 drop-shadow">{post.title || 'Venue Reel'}</p>
                      <div className="flex items-center justify-between text-[11px] text-white/90 mt-1 font-semibold">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          {post.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.commentsCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.viewsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. INTERACTIVE 9:16 VERTICAL REEL / POST VIEWER */}
        {activePost && (
          <ReelModal
            post={activePost}
            posts={posts}
            profile={profile}
            token={token}
            onClose={() => setActivePost(null)}
            onSelectPost={(p) => handleOpenPost(p)}
            onToggleLike={(p) => handleToggleLike(p)}
            onToggleSave={(p) => handleToggleSave(p)}
            onAddComment={async (text) => {
              if (!token) {
                router.push(`/login?redirect=/venues/${sku}/media`);
                return;
              }
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${activePost._id}/comment`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ comment: text })
                });
                const data = await res.json();
                if (data.success) {
                  const updatedComments = [...(activePost.comments || []), data.comment];
                  setActivePost((p) => ({ ...p, comments: updatedComments, commentsCount: data.commentsCount }));
                  setPosts((prev) =>
                    prev.map((p) =>
                      p._id === activePost._id
                        ? { ...p, comments: updatedComments, commentsCount: data.commentsCount }
                        : p
                    )
                  );
                }
              } catch (err) {
                console.error('Comment error:', err);
              }
            }}
          />
        )}

      </main>
    </div>
  );
}
