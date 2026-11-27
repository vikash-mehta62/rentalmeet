'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  Film,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Calendar,
  Send,
  X,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import ReelModal from '@/components/media/ReelModal';

export default function VenueMediaSection({ venue, sku }) {
  const { token, user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // posts | videos | photos
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Active Post for Modal Viewer
  const [activePost, setActivePost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const venueIdentifier = sku || venue?.sku || venue?._id;

  // 1. Fetch Profile and Posts
  const fetchProfileAndPosts = async () => {
    if (!venueIdentifier) return;
    try {
      setLoading(true);
      const [resProfile, resPosts] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${venueIdentifier}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${venueIdentifier}/posts?tab=${activeTab}&limit=12`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      ]);

      const dataProfile = await resProfile.json();
      const dataPosts = await resPosts.json();

      if (dataProfile.success) {
        setProfile(dataProfile.profile);
        setIsFollowing(Boolean(dataProfile.profile.isFollowing));
        setFollowersCount(dataProfile.profile.stats?.followers || 0);
      }
      if (dataPosts.success) {
        setPosts(dataPosts.posts || []);
      }
    } catch (err) {
      console.error('Error fetching venue media section:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
  }, [venueIdentifier, activeTab, token]);

  // 2. Handle Follow
  const handleToggleFollow = async () => {
    if (!token) {
      toast.error('Please log in to follow this venue');
      return;
    }
    const targetId = venue?._id || profile?.venueId;
    if (!targetId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${targetId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
        toast.success(data.isFollowing ? 'You are now following this venue!' : 'Unfollowed venue');
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  // 3. Open Post Modal & Record View (Deduplicated)
  const handleOpenPost = (post) => {
    setActivePost(post);
    // Record authentic view
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${post._id}/view`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).catch(() => { });
  };

  // 4. Handle Like
  const handleToggleLike = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!token) {
      toast.error('Please log in to like this post');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount }
              : p
          )
        );
        if (activePost && activePost._id === postId) {
          setActivePost((p) => ({ ...p, isLiked: data.isLiked, likesCount: data.likesCount }));
        }
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // 5. Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please log in to leave a comment');
      return;
    }
    if (!commentText.trim() || !activePost) return;

    try {
      setSubmittingComment(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts/${activePost._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setActivePost((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
          commentsCount: (prev.commentsCount || 0) + 1
        }));
        setCommentText('');
        toast.success('Comment added!');
      }
    } catch (err) {
      console.error('Add comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const fullMediaPageUrl = `/venues/${venueIdentifier}/media`;

  return (
    <div id="media-profile" className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-6 scroll-mt-24 shadow-sm">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-primary-500/15 to-purple-500/15 text-primary-600 dark:text-primary-300 border border-primary-500/20">
              <Camera className="w-3.5 h-3.5" />
              Venue Social Media Feed
            </span>
            {profile?.subscriptionPlan && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/20">
                {profile.subscriptionPlan}
              </span>
            )}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-dark-800 dark:text-slate-100">
            Media Profile & Real Event Highlights
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Real photos, video reels, and setups posted directly by {venue?.businessName || 'the venue'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleToggleFollow}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ${isFollowing
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                : 'bg-primary-600 hover:bg-primary-500 text-white'
              }`}
          >
            {isFollowing ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Following ({followersCount})
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Follow Venue ({followersCount})
              </>
            )}
          </button>

          <Link
            href={fullMediaPageUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
          >
            <span>Full Profile</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>
      </div>

      {/* 2. Authentic Stats Bar */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{profile.stats?.posts || 0}</p>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Posts</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{followersCount}</p>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Followers</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{profile.stats?.likes || 0}</p>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Likes</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{profile.stats?.views || 0}</p>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Views</p>
          </div>
        </div>
      )}

      {/* 3. Tab Filter Buttons */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'posts'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <Camera className="w-3.5 h-3.5" />
          All Media
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'videos'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <Film className="w-3.5 h-3.5" />
          Videos / Reels
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'photos'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Photos
        </button>
      </div>

      {/* 4. Media Posts Grid */}
      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No media posts published yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The venue owner hasn't shared any {activeTab === 'videos' ? 'videos' : activeTab === 'photos' ? 'photos' : 'posts'} yet. Follow this venue to get notified when new setups are posted!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {posts.map((post) => (
            <div
              key={post._id}
              onClick={() => handleOpenPost(post)}
              className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              {post.mediaType === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 text-white backdrop-blur-sm">
                    <Film className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={post.mediaUrl}
                    alt={post.title || 'Venue Photo'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 text-white backdrop-blur-sm">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                  </div>
                </div>
              )}

              {/* Bottom Gradient with Likes & Comments */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
                <p className="text-xs font-bold line-clamp-1 drop-shadow mb-1">{post.title || 'Venue Reel'}</p>
                <div className="flex items-center justify-between text-[11px] text-white/90 font-semibold">
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

      {/* 5. INTERACTIVE 9:16 REEL / POST MODAL */}
      {activePost && (
        <ReelModal
          post={activePost}
          posts={posts}
          profile={{
            businessName: venue?.businessName,
            profilePhoto: venue?.images?.[0] || profile?.profilePhoto,
            location: venue?.location,
            sku: venueIdentifier
          }}
          token={token}
          onClose={() => setActivePost(null)}
          onSelectPost={(p) => handleOpenPost(p)}
          onToggleLike={(p) => handleToggleLike(p._id)}
          onToggleSave={() => { }}
          onAddComment={async (text) => {
            if (!token) {
              toast.error('Please log in to comment');
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
                const newComment = {
                  userName: user?.name || 'You',
                  text: text,
                  createdAt: new Date().toISOString()
                };
                setActivePost((prev) => ({
                  ...prev,
                  comments: [...(prev.comments || []), newComment],
                  commentsCount: (prev.commentsCount || 0) + 1
                }));
                toast.success('Comment posted!');
              }
            } catch (err) {
              console.error('Error posting comment:', err);
            }
          }}
        />
      )}
    </div>
  );
}
