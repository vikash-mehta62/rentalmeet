'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import Link from 'next/link';
import ReelModal from '@/components/media/ReelModal';
import {
  Grid,
  Film,
  Camera,
  Image as ImageIcon,
  Bookmark,
  Share2,
  Edit3,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
  ShieldCheck,
  Crown,
  Sparkles,
  ExternalLink,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Copy,
  Check
} from 'lucide-react';

export default function OwnerMediaProfilePage() {
  const { token, user } = useAuthStore();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // posts | videos | photos | analytics
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Create Post Form States
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [modalError, setModalError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  const [postForm, setPostForm] = useState({
    mediaType: 'photo',
    mediaUrl: '',
    title: '',
    caption: '',
    hashtags: '',
    locationTag: '',
    bookingUrl: ''
  });

  const handleOpenCreateModal = () => {
    setModalError('');
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadSuccess(false);
    setUploadMode('file');
    setPostForm({
      mediaType: 'photo',
      mediaUrl: '',
      title: '',
      caption: '',
      hashtags: '',
      locationTag: '',
      bookingUrl: selectedVenue?.sku ? `/venues/${selectedVenue.sku}` : ''
    });
    setShowCreateModal(true);
  };

  const handleFileChange = async (file) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setModalError('File size exceeds 50MB limit.');
      return;
    }

    const isVideo = file.type.startsWith('video') || /\.(mp4|mov|webm)$/i.test(file.name);
    const detectedType = isVideo ? 'video' : 'photo';

    setSelectedFile(file);
    setModalError('');
    setUploadSuccess(false);

    // Create instant local preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setPostForm((prev) => ({
      ...prev,
      mediaType: detectedType,
      mediaUrl: ''
    }));

    // Upload to cloud storage
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'media-posts');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setPostForm((prev) => ({
          ...prev,
          mediaUrl: data.url,
          mediaType: detectedType
        }));
        setUploadSuccess(true);
      } else {
        setModalError(data.message || 'File upload failed. You can still retry when clicking Publish.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      setModalError('Failed to upload file to storage. Please check connection.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Bio Form
  const [bioText, setBioText] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // 1. Fetch Owner's venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.venues?.length > 0) {
          setVenues(data.venues);
          setSelectedVenue(data.venues[0]);
        }
      } catch (err) {
        console.error('Fetch venues error:', err);
      }
    };
    if (token) fetchVenues();
  }, [token]);

  // 2. Fetch Profile & Posts for selected venue
  const fetchProfileAndPosts = async () => {
    if (!selectedVenue) return;
    try {
      setLoading(true);
      const identifier = selectedVenue.sku || selectedVenue._id;
      const [resProfile, resPosts, resAnalytics] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${identifier}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/venue/${identifier}/posts?tab=${activeTab}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/owner/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const dataProfile = await resProfile.json();
      const dataPosts = await resPosts.json();
      const dataAnalytics = await resAnalytics.json();

      if (dataProfile.success) {
        setProfile(dataProfile.profile);
        setBioText(dataProfile.profile.bio || '');
      }
      if (dataPosts.success) {
        setPosts(dataPosts.posts);
      }
      if (dataAnalytics.success) {
        setAnalytics(dataAnalytics.analytics);
      }
    } catch (err) {
      console.error('Error fetching media profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVenue) fetchProfileAndPosts();
  }, [selectedVenue, activeTab]);

  // Handle Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!selectedVenue) {
      setModalError('Please select a venue before creating a post');
      return;
    }

    if (uploadingFile) {
      setModalError('Please wait, file is still uploading to cloud...');
      return;
    }

    let finalMediaUrl = postForm.mediaUrl;

    // If file mode and file chosen but mediaUrl empty (e.g. upload failed earlier), retry upload now
    if (uploadMode === 'file' && !finalMediaUrl) {
      if (!selectedFile) {
        setModalError('Please choose a photo or video file from your device');
        return;
      }

      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folder', 'media-posts');
        const upRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const upData = await upRes.json();
        if (upData.success && upData.url) {
          finalMediaUrl = upData.url;
          setPostForm((p) => ({ ...p, mediaUrl: upData.url }));
          setUploadSuccess(true);
        } else {
          setModalError(upData.message || 'File upload failed. Please try choosing the file again.');
          setUploadingFile(false);
          return;
        }
      } catch (upErr) {
        setModalError('Network error uploading file. Please check connection and try again.');
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    if (!finalMediaUrl) {
      setModalError(uploadMode === 'file' ? 'Please choose a photo or video file to publish' : 'Please enter a valid media URL');
      return;
    }

    setSubmittingPost(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-profile/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venueId: selectedVenue._id,
          ...postForm,
          mediaUrl: finalMediaUrl,
          bookingUrl: postForm.bookingUrl || `/venues/${selectedVenue.sku}`
        })
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ success: 'New post published successfully!', error: '' });
        setShowCreateModal(false);
        if (previewUrl && previewUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(previewUrl); } catch (e) {}
        }
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadSuccess(false);
        setModalError('');
        setPostForm({
          mediaType: 'photo',
          mediaUrl: '',
          title: '',
          caption: '',
          hashtags: '',
          locationTag: '',
          bookingUrl: ''
        });
        fetchProfileAndPosts();
      } else {
        setModalError(data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setModalError('Failed to create post. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Handle Save Bio
  const handleSaveBio = async (e) => {
    e.preventDefault();
    setSavingBio(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues/${selectedVenue._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ description: bioText })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditBioModal(false);
        fetchProfileAndPosts();
      }
    } catch (err) {
      console.error('Update bio error:', err);
    } finally {
      setSavingBio(false);
    }
  };

  const publicUrl = typeof window !== 'undefined' && selectedVenue
    ? `${window.location.origin}/venues/${selectedVenue.sku}/media`
    : '';

  const copyShareLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (selectedVenue && publicUrl) {
      const text = `Check out our media profile on RentalMeet! Photos, videos, and direct bookings for ${selectedVenue.businessName}: ${publicUrl}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <OwnerLayout title="Venue Media Profile" subtitle="Showcase your venue with photos, videos, and social engagement">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">

        {/* Venue Switcher if owner has multiple venues */}
        {venues.length > 1 && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Select Venue:</span>
            <div className="flex flex-wrap gap-2">
              {venues.map((v) => (
                <button
                  key={v._id}
                  onClick={() => setSelectedVenue(v)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedVenue?._id === v._id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {v.businessName}
                </button>
              ))}
            </div>
          </div>
        )}

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

        {/* 1. SOCIAL MEDIA STYLE PROFILE HEADER (IMAGE 1) */}
        <div className="bg-[#0f172a] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 relative overflow-hidden">
          {/* Top Bar with actions */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Venue Media Profile</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-500/20 text-primary-300 border border-primary-500/30">
                {profile?.subscriptionPlan || 'Starter'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Upload Media
              </button>

              <button
                onClick={shareWhatsApp}
                title="Share on WhatsApp"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs transition-all"
              >
                <Share2 className="w-4 h-4 text-green-400" />
              </button>
            </div>
          </div>

          {/* Profile Identity Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-md flex-shrink-0">
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {profile?.businessName || selectedVenue?.businessName}
                </h1>
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Venue Owner
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {profile?.location?.city || selectedVenue?.location?.city || 'Location'},{' '}
                  {profile?.location?.state || selectedVenue?.location?.state || 'India'}
                </span>
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl pt-1">
                {profile?.bio || 'Add a bio to attract customers and describe your venue!'}
              </p>
            </div>
          </div>

          {/* Primary Stats: Posts | Followers | Following */}
          <div className="grid grid-cols-3 gap-2 bg-slate-800/50 p-3 sm:p-4 rounded-2xl border border-slate-800 text-center">
            <div>
              <p className="text-lg sm:text-2xl font-black text-white">{profile?.stats?.posts || 0}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Posts</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white">{profile?.stats?.followers || 0}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Followers</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white">{profile?.stats?.following || 0}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Following</p>
            </div>
          </div>

          {/* Action Buttons: Edit Profile | Share Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowEditBioModal(true)}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Bio &amp; Profile
            </button>

            <button
              onClick={copyShareLink}
              className="py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Share Profile Link'}
            </button>
          </div>
        </div>

        {/* 2. ANALYTICS METRICS BAR (IMAGE 1 & 4) */}
        <div className="grid grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="space-y-1">
            <div className="inline-flex p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Eye className="w-4 h-4" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {(profile?.stats?.views || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">Total Views</p>
          </div>

          <div className="space-y-1">
            <div className="inline-flex p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <Heart className="w-4 h-4" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {(profile?.stats?.likes || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">Total Likes</p>
          </div>

          <div className="space-y-1">
            <div className="inline-flex p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {(profile?.stats?.enquiries || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">Enquiries Generated</p>
          </div>
        </div>

        {/* Section Header: My Media & Public Profile Pill (Exact Match to Image 1) */}
        <div className="flex items-center justify-between px-2 pt-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">My Media</h3>
          {selectedVenue?.sku && (
            <Link
              href={`/venues/${selectedVenue.sku}/media`}
              target="_blank"
              className="px-4 py-1.5 bg-[#00ba51] hover:bg-[#009e44] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>Public Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* 3. TABS: Posts | Videos | Photos | Analytics (IMAGE 2) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-around border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'posts'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Posts</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'videos'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Videos</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'photos'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photos</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'analytics'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="p-6">
            {/* ANALYTICS TAB (IMAGE 4) */}
            {activeTab === 'analytics' ? (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Profile Performance</h3>
                    <p className="text-xs text-slate-500">Monthly statistics &amp; viewer trend</p>
                  </div>
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full">
                    {analytics?.isAdvanced ? 'Advanced Analytics' : 'Basic Analytics'}
                  </span>
                </div>

                {/* 4 Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-2xl font-black text-emerald-600">
                      {(analytics?.totalViews || 45800).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Profile &amp; media views</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {(analytics?.newFollowers || 2450).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">New followers</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {(analytics?.totalLikes || 8200).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Likes received</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {(analytics?.bookingEnquiries || 126).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Booking enquiries</p>
                  </div>
                </div>

                {/* Line Trend Bar Chart matching Image 4 */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Monthly Profile Views</h4>
                    <span className="text-[11px] text-slate-400 font-medium">Day ranges (1–30)</span>
                  </div>

                  <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                    {(analytics?.monthlyViewsTrend || [
                      { range: '1–5', views: 4200 },
                      { range: '6–10', views: 5800 },
                      { range: '11–15', views: 7200 },
                      { range: '16–20', views: 6100 },
                      { range: '21–25', views: 9800 },
                      { range: '26–30', views: 12700 }
                    ]).map((item, idx) => {
                      const maxVal = 15000;
                      const pct = Math.min(100, Math.round((item.views / maxVal) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                          <span className="text-[10px] font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.views}
                          </span>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-xl h-36 flex items-end overflow-hidden">
                            <div
                              style={{ height: `${pct}%` }}
                              className="w-full bg-gradient-to-t from-primary-600 to-sky-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">{item.range}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* POSTS / VIDEOS / PHOTOS GRID */
              <div>
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No media posts yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Click "+ Upload Media" to showcase your venue's setups, halls, lighting, and events!
                    </p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-sm"
                    >
                      Upload First Post
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {posts.map((post) => (
                      <div
                        key={post._id}
                        onClick={() => setActivePost(post)}
                        className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5"
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
                              alt={post.title || 'Venue post'}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}

                        {/* Bottom Gradient with Title and Stats */}
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
                          <p className="text-xs font-bold line-clamp-1 drop-shadow">{post.title || 'Post'}</p>
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
                          <p className="text-[10px] text-emerald-400 font-bold mt-1 text-center">Click to View</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. CREATE NEW POST MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Create New Media Post</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Posting to: <strong className="text-primary-600">{selectedVenue?.businessName || 'Venue'}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* In-Modal Feedback / Error Alert */}
              {modalError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-4">
                {/* Source Selection Tabs */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Choose Media Source
                  </label>
                  <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        uploadMode === 'file'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      Upload from Device
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        uploadMode === 'url'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Direct Media URL
                    </button>
                  </div>
                </div>

                {/* 1. DEVICE FILE UPLOADER & PREVIEW */}
                {uploadMode === 'file' && (
                  <div>
                    {!previewUrl ? (
                      <div>
                        <div
                          onClick={() => document.getElementById('media-device-file-input')?.click()}
                          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50/60 dark:bg-slate-800/40 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Choose Photo or Video from your Device
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Supports JPG, PNG, WEBP, MP4, MOV (up to 50MB)
                            </p>
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-sm pointer-events-none"
                          >
                            Browse Files
                          </button>
                        </div>
                        <input
                          type="file"
                          id="media-device-file-input"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                          onChange={(e) => handleFileChange(e.target.files?.[0])}
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
                        {/* Live Preview Box */}
                        <div className="relative aspect-video flex items-center justify-center bg-black">
                          {postForm.mediaType === 'video' ? (
                            <video
                              src={previewUrl}
                              controls
                              playsInline
                              className="max-h-56 w-full object-contain"
                            />
                          ) : (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-h-56 w-full object-contain"
                            />
                          )}

                          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/75 text-white backdrop-blur-sm flex items-center gap-1 border border-white/10">
                            {postForm.mediaType === 'video' ? (
                              <Film className="w-3.5 h-3.5 text-purple-400" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            {postForm.mediaType}
                          </div>
                        </div>

                        {/* File Meta & Cloud Upload State */}
                        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                              {selectedFile?.name || 'Selected media'}
                            </p>
                            <div className="flex items-center gap-2.5 mt-0.5">
                              {selectedFile && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                              {uploadingFile && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  Uploading to cloud storage...
                                </span>
                              )}
                              {(uploadSuccess || postForm.mediaUrl) && !uploadingFile && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Uploaded & Ready
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="change-media-file-input"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                              onChange={(e) => handleFileChange(e.target.files?.[0])}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById('change-media-file-input')?.click()}
                              className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold transition-all"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (previewUrl?.startsWith('blob:')) {
                                  try { URL.revokeObjectURL(previewUrl); } catch (e) {}
                                }
                                setSelectedFile(null);
                                setPreviewUrl('');
                                setUploadSuccess(false);
                                setPostForm((p) => ({ ...p, mediaUrl: '' }));
                              }}
                              className="px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-bold flex items-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. DIRECT URL INPUT & PREVIEW */}
                {uploadMode === 'url' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPostForm((p) => ({ ...p, mediaType: 'photo' }))}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          postForm.mediaType === 'photo'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" /> Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostForm((p) => ({ ...p, mediaType: 'video' }))}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          postForm.mediaType === 'video'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Film className="w-4 h-4" /> Video
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Media URL (Direct HTTPS link) *
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={postForm.mediaUrl}
                        onChange={(e) => setPostForm((p) => ({ ...p, mediaUrl: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      />
                    </div>

                    {postForm.mediaUrl && (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-black aspect-video flex items-center justify-center">
                        {postForm.mediaType === 'video' ? (
                          <video
                            src={postForm.mediaUrl}
                            controls
                            className="max-h-48 w-full object-contain"
                          />
                        ) : (
                          <img
                            src={postForm.mediaUrl}
                            alt="URL Preview"
                            className="max-h-48 w-full object-contain"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Post Title / Heading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Wedding Grand Stage Setup"
                    value={postForm.title}
                    onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Caption / Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Caption / Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what makes this hall, decor, or event special..."
                    value={postForm.caption}
                    onChange={(e) => setPostForm((p) => ({ ...p, caption: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Hashtags & Location Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Hashtags
                    </label>
                    <input
                      type="text"
                      placeholder="#wedding #banquet #celebration"
                      value={postForm.hashtags}
                      onChange={(e) => setPostForm((p) => ({ ...p, hashtags: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Location Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bhopal, MP"
                      value={postForm.locationTag}
                      onChange={(e) => setPostForm((p) => ({ ...p, locationTag: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Direct Booking Link CTA */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Direct Booking Link / CTA
                  </label>
                  <input
                    type="text"
                    placeholder={`/venues/${selectedVenue?.sku || ''}`}
                    value={postForm.bookingUrl}
                    onChange={(e) => setPostForm((p) => ({ ...p, bookingUrl: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Customers clicking "Book This Venue" from this media will land directly on your venue booking page.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingPost || uploadingFile}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {submittingPost || uploadingFile ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {submittingPost
                      ? 'Publishing...'
                      : uploadingFile
                      ? 'Uploading File...'
                      : 'Publish Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. EDIT BIO MODAL */}
        {showEditBioModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Edit Venue Bio</h3>
                <button onClick={() => setShowEditBioModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBio} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Business Bio / Short Description
                  </label>
                  <textarea
                    rows={4}
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Short description of your venue..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditBioModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBio}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold"
                  >
                    {savingBio ? 'Saving...' : 'Save Bio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. REEL / POST VIEWER MODAL */}
        {activePost && (
          <ReelModal
            post={activePost}
            posts={posts}
            profile={{
              businessName: selectedVenue?.businessName || profile?.businessName,
              profilePhoto: selectedVenue?.images?.[0] || profile?.profilePhoto,
              location: selectedVenue?.location || profile?.location,
              sku: selectedVenue?.sku || profile?.sku
            }}
            token={token}
            onClose={() => setActivePost(null)}
            onSelectPost={(p) => setActivePost(p)}
            onToggleLike={() => {}}
            onToggleSave={() => {}}
            onAddComment={() => {}}
          />
        )}

      </div>
    </OwnerLayout>
  );
}
