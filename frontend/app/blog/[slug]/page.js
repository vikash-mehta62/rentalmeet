'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Clock, User, Tag, ChevronRight, ArrowLeft, ChevronDown } from 'lucide-react';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (slug) fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${slug}`);
      const data = await res.json();
      if (data.success) {
        setBlog(data.blog);
        // Fetch related posts by same category
        const relRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs?category=${encodeURIComponent(data.blog.category)}&limit=3`);
        const relData = await relRes.json();
        if (relData.success) setRelated(relData.blogs.filter(b => b.slug !== slug).slice(0, 3));
      }
    } catch {} finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </main>
      <Footer />
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Blog not found</p>
          <Link href="/blog" className="text-amber-500 hover:underline text-sm">← Back to Blog</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  // Build JSON-LD schema
  const schemas = [];
  if (blog.schemaMarkup?.article) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.seo?.metaTitle || blog.title,
      description: blog.seo?.metaDescription || blog.shortDescription,
      image: blog.featuredImage,
      author: { '@type': 'Person', name: blog.author },
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt,
    });
  }
  if (blog.schemaMarkup?.faqPage && blog.faqs?.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: blog.faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer }
      }))
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950 flex flex-col">
      <Navbar />

      {/* JSON-LD */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-500">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog" className="hover:text-amber-500">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{blog.title}</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            {blog.category && (
              <span className="inline-block text-xs font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-4">
                {blog.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              {blog.title}
            </h1>
            {blog.shortDescription && (
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{blog.shortDescription}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 pb-5 border-b border-slate-200 dark:border-slate-700">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{blog.author}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{blog.readTime} min read</span>
              {blog.publishedAt && (
                <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              )}
              {blog.views > 0 && <span>{blog.views.toLocaleString()} views</span>}
            </div>
          </div>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
              <img src={blog.featuredImage} alt={blog.featuredImageAlt || blog.title}
                className="w-full h-64 md:h-96 object-cover" />
            </div>
          )}

          {/* Content */}
          <article
            className="prose prose-slate dark:prose-invert prose-headings:font-black prose-a:text-amber-600 prose-img:rounded-xl max-w-none mb-10"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags */}
          {blog.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
              {blog.tags.map(t => (
                <Link key={t} href={`/blog?tag=${t}`}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  {t}
                </Link>
              ))}
            </div>
          )}

          {/* FAQ Section */}
          {blog.faqs?.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-5" style={{ fontFamily: 'Georgia, serif' }}>
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {blog.faqs.map((faq, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm pr-4">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {related.length > 0 && (
            <div className="mb-10 pt-8 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-5" style={{ fontFamily: 'Georgia, serif' }}>
                Related Articles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map(r => (
                  <Link key={r._id} href={`/blog/${r.slug}`}
                    className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all">
                    {r.featuredImage ? (
                      <div className="h-32 overflow-hidden">
                        <img src={r.featuredImage} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <span className="text-2xl">📝</span>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-amber-600 transition-colors">{r.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{r.readTime} min read</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-amber-600 hover:underline font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>

        </div>
      </main>
      <Footer />
    </div>
  );
}
