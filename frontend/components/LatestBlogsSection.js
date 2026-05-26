'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

export default function LatestBlogsSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs?limit=3`)
      .then(r => r.json())
      .then(d => { if (d.success) setBlogs(d.blogs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && blogs.length === 0) return null;

  return (
    <section className="py-10 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-1">From Our Blog</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100" style={{ fontFamily: 'Georgia, serif' }}>
              Latest Articles
            </h2>
          </div>
          <Link href="/blog" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200 dark:bg-slate-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogs.map(blog => (
              <Link key={blog._id} href={`/blog/${blog.slug}`}
                className="group rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 bg-white dark:bg-slate-900">
                {blog.featuredImage ? (
                  <div className="h-44 overflow-hidden">
                    <img src={blog.featuredImage} alt={blog.featuredImageAlt || blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-primary-50 to-amber-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <span className="text-3xl">📝</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {blog.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                        {blog.category}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {blog.readTime} min
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-primary-500 transition-colors mb-1">
                    {blog.title}
                  </h3>
                  {blog.shortDescription && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{blog.shortDescription}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-6 sm:hidden">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-500 hover:text-primary-600">
            View All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
