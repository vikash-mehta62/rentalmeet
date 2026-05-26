'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Search, Clock, Tag, ChevronRight } from 'lucide-react';

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [activeCategory, page]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch {}
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (search) params.set('search', search);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs?${params}`);
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs);
        setTotalPages(data.pages || 1);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="text-center mb-12">
            <span className="inline-block border border-slate-300 text-slate-500 text-xs px-4 py-1 rounded-full mb-4">Blog</span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Insights & Ideas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Tips, guides and stories about venues, events and everything in between.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search articles..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-2 focus:ring-amber-400 outline-none shadow-sm" />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold">Search</button>
            </div>
          </form>

          {/* Category tabs */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {['all', ...categories].map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                    activeCategory === cat
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}>
                  {cat === 'all' ? 'All Posts' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Blog grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-slate-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg font-semibold">No articles found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map(blog => (
                <Link key={blog._id} href={`/blog/${blog.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {blog.featuredImage ? (
                    <div className="h-48 overflow-hidden">
                      <img src={blog.featuredImage} alt={blog.featuredImageAlt || blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                      <span className="text-4xl">📝</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {blog.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {blog.category}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {blog.readTime} min read
                      </span>
                    </div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {blog.title}
                    </h2>
                    {blog.shortDescription && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{blog.shortDescription}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{blog.author}</span>
                      <span>{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === i + 1 ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:border-amber-400'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
