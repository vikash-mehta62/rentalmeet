'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Plus, Search, Eye, Pencil, Trash2, BookOpen, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  draft:     'bg-yellow-100 text-yellow-700',
  archived:  'bg-gray-100 text-gray-500',
};

export default function AdminBlogsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => { if (token) fetchBlogs(); }, [token, statusFilter]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { setBlogs(data.blogs); setTotal(data.total); }
    } catch { toast.error('Failed to load blogs'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Blog deleted');
      fetchBlogs();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = blogs.filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.category?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    draft: blogs.filter(b => b.status === 'draft').length,
    views: blogs.reduce((s, b) => s + (b.views || 0), 0),
  };

  return (
    <AdminLayout title="Blog Management" subtitle="Create and manage SEO-optimized blog posts">
      <PermissionGuard permission="settings">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Posts', value: stats.total, icon: BookOpen, color: 'blue' },
            { label: 'Published', value: stats.published, icon: TrendingUp, color: 'green' },
            { label: 'Drafts', value: stats.draft, icon: Clock, color: 'yellow' },
            { label: 'Total Views', value: stats.views.toLocaleString(), icon: Eye, color: 'purple' },
          ].map(s => (
            <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-4`}>
              <p className={`text-xs font-semibold uppercase text-${s.color}-600 mb-1`}>{s.label}</p>
              <p className={`text-2xl font-black text-${s.color}-700`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search blogs..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchBlogs()}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['all','published','draft','archived'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${statusFilter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => router.push('/admin/blogs/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors ml-auto">
            <Plus className="w-4 h-4" /> New Blog
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No blogs found</p>
              <button onClick={() => router.push('/admin/blogs/new')}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold">
                Create your first blog
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Read Time</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(blog => (
                  <tr key={blog._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800 line-clamp-1 max-w-[280px]">{blog.title}</div>
                      <div className="text-xs text-gray-400 font-mono">{blog.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{blog.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[blog.status] || STATUS_COLORS.draft}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{blog.readTime} min</td>
                    <td className="px-4 py-3 text-right text-gray-600">{(blog.views || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN') : new Date(blog.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {blog.status === 'published' && (
                          <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => router.push(`/admin/blogs/${blog._id}`)}
                          className="p-1.5 text-gray-400 hover:text-primary-500 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(blog._id, blog.title)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

      </PermissionGuard>
    </AdminLayout>
  );
}
