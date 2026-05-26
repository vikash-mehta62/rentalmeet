'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Save, Eye, ArrowLeft, Plus, Trash2,
  AlertCircle, CheckCircle, RefreshCw, Globe, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('@/components/admin/TiptapEditor'), { ssr: false });

const CATEGORIES = [
  // Venue related
  'Venue Tips',
  'Venue Booking Guide',
  'Meeting Halls',
  'Banquet & Wedding Halls',
  'Conference Rooms',
  'Farmhouse & Resorts',
  'Auditoriums',
  'Co-Working Spaces',
  // Vendor & Services
  'Vendor Tips',
  'Catering & Food',
  'Photography & Video',
  'Decoration & Flowers',
  'Entertainment',
  'Event Management',
  // Event Planning
  'Event Planning',
  'Corporate Events',
  'Wedding Planning',
  'Birthday & Parties',
  'Social Gatherings',
  // Business & Platform
  'Business Tips',
  'For Venue Owners',
  'For Vendors',
  'Platform Updates',
  // General
  'Guides & How-To',
  'Success Stories',
  'Other',
];

const EMPTY = {
  title:'', slug:'', category:'Venue Tips', tags:[], shortDescription:'',
  content:'', author:'Admin', status:'draft',
  featuredImage:'', featuredImageAlt:'',
  seo:{ focusKeyword:'', metaTitle:'', metaDescription:'', canonicalUrl:'', ogTitle:'', ogDescription:'', ogImage:'', noIndex:false },
  schemaMarkup:{ article:true, faqPage:false, breadcrumb:true },
  faqs:[],
};

function slugify(t) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'');
}

function calcReadTime(html) {
  const words = html.replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function calcSeo(blog) {
  const kw = (blog.seo.focusKeyword||'').toLowerCase();
  if (!kw) return { score:0, checks:[{ label:'Set a focus keyword', pass:false }] };
  const title = (blog.title||'').toLowerCase();
  const desc  = (blog.seo.metaDescription||blog.shortDescription||'').toLowerCase();
  const text  = (blog.content||'').replace(/<[^>]+>/g,' ').toLowerCase();
  const h2s   = (blog.content||'').match(/<h2[^>]*>(.*?)<\/h2>/gi)||[];
  const checks = [
    { label:'Keyword in title',                  pass: title.includes(kw) },
    { label:'Keyword in meta description',        pass: desc.includes(kw) },
    { label:'Keyword in first 300 chars',         pass: text.substring(0,300).includes(kw) },
    { label:'Keyword in H2',                      pass: h2s.some(h=>h.toLowerCase().includes(kw)) },
    { label:'Meta description 120–160 chars',     pass: desc.length>=120 && desc.length<=160 },
    { label:'Title 50–60 chars',                  pass: title.length>=50 && title.length<=60 },
    { label:'Content >300 words',                 pass: text.trim().split(/\s+/).length>300 },
    { label:'Featured image set',                 pass: !!blog.featuredImage },
    { label:'Image alt text set',                 pass: !!blog.featuredImageAlt },
    { label:'Slug set',                           pass: !!blog.slug },
  ];
  const score = Math.round(checks.filter(c=>c.pass).length / checks.length * 100);
  return { score, checks };
}

export default function BlogEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const isNew = id === 'new';

  const [blog, setBlog]         = useState(EMPTY);
  const [loading, setLoading]   = useState(!isNew);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState('editor');
  const [tagInput, setTagInput] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [slugManual, setSlugManual] = useState(false);
  const autoRef = useRef(null);

  useEffect(() => { if (!isNew && token) fetchBlog(); }, [id, token]);

  // Auto-save every 30s for existing blogs
  useEffect(() => {
    autoRef.current = setInterval(() => {
      if (!isNew && blog.title) handleSave(true);
    }, 30000);
    return () => clearInterval(autoRef.current);
  }, [blog, isNew]);

  // Auto-slug
  useEffect(() => {
    if (!slugManual && blog.title) setBlog(p => ({ ...p, slug: slugify(p.title) }));
  }, [blog.title, slugManual]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blogs/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlog({
          ...EMPTY, ...data.blog,
          seo: { ...EMPTY.seo, ...data.blog.seo },
          schemaMarkup: { ...EMPTY.schemaMarkup, ...data.blog.schemaMarkup },
        });
        setSlugManual(true);
      } else toast.error(data.message);
    } catch { toast.error('Failed to load blog'); }
    finally { setLoading(false); }
  };

  const handleSave = async (isAuto = false) => {
    if (!blog.title.trim()) { if (!isAuto) toast.error('Title is required'); return; }
    if (!blog.slug.trim())  { if (!isAuto) toast.error('Slug is required'); return; }
    setSaving(true);
    try {
      const url    = isNew ? `${process.env.NEXT_PUBLIC_API_URL}/blogs` : `${process.env.NEXT_PUBLIC_API_URL}/blogs/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...blog, schemaMarkup: blog.schemaMarkup }),
      });
      const data = await res.json();
      if (data.success) {
        setLastSaved(new Date());
        if (!isAuto) toast.success(isNew ? 'Blog created!' : 'Saved!');
        if (isNew) router.replace(`/admin/blogs/${data.blog._id}`);
      } else toast.error(data.message);
    } catch { if (!isAuto) toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'blogs');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
      });
      const data = await res.json();
      if (data.success) { setBlog(p => ({ ...p, featuredImage: data.url })); toast.success('Image uploaded'); }
      else toast.error('Upload failed');
    } catch { toast.error('Upload failed'); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !blog.tags.includes(t)) setBlog(p => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };

  const seo = calcSeo(blog);
  const readTime = calcReadTime(blog.content);
  const descLen = (blog.seo.metaDescription || blog.shortDescription || '').length;

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  if (loading) return (
    <AdminLayout title="Blog Editor" subtitle="Loading...">
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={isNew ? 'New Blog Post' : 'Edit Blog Post'} subtitle={blog.title || 'Untitled'}>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <button onClick={() => router.push('/admin/blogs')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blogs
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          {lastSaved && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Saved {lastSaved.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          <select value={blog.status} onChange={e => setBlog(p => ({ ...p, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          {blog.status === 'published' && !isNew && (
            <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <Eye className="w-4 h-4" /> Preview
            </a>
          )}
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : isNew ? 'Create Blog' : 'Save'}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title + Slug */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <input type="text" placeholder="Blog Title..."
              value={blog.title} onChange={e => setBlog(p => ({ ...p, title: e.target.value }))}
              className="w-full text-2xl font-bold border-0 outline-none placeholder-gray-300 text-gray-900 mb-3" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 text-xs">Slug:</span>
              <input type="text" value={blog.slug}
                onChange={e => { setSlugManual(true); setBlog(p => ({ ...p, slug: slugify(e.target.value) })); }}
                className="flex-1 text-xs text-primary-600 font-mono border-0 outline-none bg-transparent"
                placeholder="auto-generated-slug" />
              <span className="text-xs text-gray-400 whitespace-nowrap">{readTime} min read</span>
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {['editor','html','preview'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${tab===t ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t}
                </button>
              ))}
            </div>

            {tab === 'editor' && (
              <div className="p-0">
                <TiptapEditor
                  value={blog.content}
                  onChange={val => setBlog(p => ({ ...p, content: val }))}
                  placeholder="Write your blog content here..."
                />
              </div>
            )}

            {tab === 'html' && (
              <div className="p-4">
                <textarea value={blog.content}
                  onChange={e => setBlog(p => ({ ...p, content: e.target.value }))}
                  rows={22}
                  className="w-full border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-gray-50" />
              </div>
            )}

            {tab === 'preview' && (
              <div className="p-6 prose prose-sm max-w-none min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: blog.content || '<p class="text-gray-400">Nothing to preview yet...</p>' }} />
            )}
          </div>

          {/* Short Description */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className={lbl}>Short Description <span className="text-gray-400 font-normal">(shown in blog cards)</span></label>
            <textarea value={blog.shortDescription} onChange={e => setBlog(p => ({ ...p, shortDescription: e.target.value }))}
              rows={3} placeholder="Brief summary..." className={inp} />
          </div>

          {/* FAQ Builder */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">FAQ Section</h3>
              <button onClick={() => setBlog(p => ({ ...p, faqs: [...p.faqs, { question:'', answer:'' }] }))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>
            {blog.faqs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No FAQs yet. Add some to improve SEO.</p>
            ) : (
              <div className="space-y-3">
                {blog.faqs.map((faq, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">FAQ {i+1}</span>
                      <button onClick={() => setBlog(p => ({ ...p, faqs: p.faqs.filter((_,idx)=>idx!==i) }))}
                        className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input type="text" placeholder="Question..." value={faq.question}
                      onChange={e => setBlog(p => { const f=[...p.faqs]; f[i]={...f[i],question:e.target.value}; return {...p,faqs:f}; })}
                      className={inp} />
                    <textarea placeholder="Answer..." value={faq.answer} rows={2}
                      onChange={e => setBlog(p => { const f=[...p.faqs]; f[i]={...f[i],answer:e.target.value}; return {...p,faqs:f}; })}
                      className={inp} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-5">

          {/* SEO Score */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 text-sm">SEO Score</h3>
              <span className={`text-xl font-black ${seo.score>=80?'text-green-600':seo.score>=50?'text-yellow-600':'text-red-500'}`}>
                {seo.score}/100
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div className={`h-2 rounded-full transition-all ${seo.score>=80?'bg-green-500':seo.score>=50?'bg-yellow-500':'bg-red-500'}`}
                style={{ width:`${seo.score}%` }} />
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {seo.checks.map((c,i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {c.pass
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  <span className={c.pass?'text-gray-600':'text-red-500'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Post Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Post Settings</h3>
            <div>
              <label className={lbl}>Category</label>
              <select value={blog.category} onChange={e => setBlog(p => ({ ...p, category: e.target.value }))} className={inp}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Author</label>
              <input type="text" value={blog.author} onChange={e => setBlog(p => ({ ...p, author: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {blog.tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                    {t}
                    <button onClick={() => setBlog(p => ({ ...p, tags: p.tags.filter(x=>x!==t) }))} className="text-primary-400 hover:text-primary-700 leading-none">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Add tag..." value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addTag())}
                  className={`flex-1 ${inp}`} />
                <button onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors">Add</button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">Featured Image</h3>
            {blog.featuredImage ? (
              <div className="relative">
                <img src={blog.featuredImage} alt={blog.featuredImageAlt} className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                <button onClick={() => setBlog(p => ({ ...p, featuredImage:'' }))}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600">×</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-xs text-gray-400">Click to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
            <div>
              <label className={lbl}>Alt Text</label>
              <input type="text" placeholder="Describe the image..." value={blog.featuredImageAlt}
                onChange={e => setBlog(p => ({ ...p, featuredImageAlt: e.target.value }))} className={inp} />
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary-500" /> SEO Settings
            </h3>
            <div>
              <label className={lbl}>Focus Keyword</label>
              <input type="text" placeholder="e.g. venue booking tips" value={blog.seo.focusKeyword}
                onChange={e => setBlog(p => ({ ...p, seo:{...p.seo, focusKeyword:e.target.value} }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>
                Meta Title <span className={`font-normal ${(blog.seo.metaTitle||blog.title).length>60?'text-red-500':'text-gray-400'}`}>
                  ({(blog.seo.metaTitle||blog.title).length}/60)
                </span>
              </label>
              <input type="text" placeholder={blog.title} value={blog.seo.metaTitle}
                onChange={e => setBlog(p => ({ ...p, seo:{...p.seo, metaTitle:e.target.value} }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>
                Meta Description <span className={`font-normal ${descLen>160?'text-red-500':descLen>=120?'text-green-500':'text-gray-400'}`}>
                  ({descLen}/160)
                </span>
              </label>
              <textarea rows={3} placeholder="Meta description..." value={blog.seo.metaDescription}
                onChange={e => setBlog(p => ({ ...p, seo:{...p.seo, metaDescription:e.target.value} }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Canonical URL</label>
              <input type="text" placeholder="https://..." value={blog.seo.canonicalUrl}
                onChange={e => setBlog(p => ({ ...p, seo:{...p.seo, canonicalUrl:e.target.value} }))} className={inp} />
            </div>

            {/* Google Preview */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Google Preview</p>
              <p className="text-blue-600 text-sm font-medium line-clamp-1">{blog.seo.metaTitle||blog.title||'Blog Title'}</p>
              <p className="text-green-700 text-xs">rentalmeet.com/blog/{blog.slug||'slug'}</p>
              <p className="text-gray-600 text-xs line-clamp-2 mt-0.5">{blog.seo.metaDescription||blog.shortDescription||'Meta description...'}</p>
            </div>

            <div>
              <label className={lbl}>OG Title</label>
              <input type="text" placeholder={blog.seo.metaTitle||blog.title} value={blog.seo.ogTitle}
                onChange={e => setBlog(p => ({ ...p, seo:{...p.seo, ogTitle:e.target.value} }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>OG Description</label>
              <textarea rows={2} value={blog.seo.ogDescription}
                onChange={e => setBlog(p => ({ ...p, seo:{...p.seo, ogDescription:e.target.value} }))} className={inp} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={blog.seo.noIndex}
                onChange={e => setBlog(p => ({ ...p, seo:{...p.seo, noIndex:e.target.checked} }))} />
              <span className="text-xs text-gray-600">No Index (hide from search engines)</span>
            </label>
          </div>

          {/* Schema Toggles */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">Schema Markup</h3>
            {[
              { key:'article',   label:'Article Schema' },
              { key:'faqPage',   label:'FAQ Page Schema' },
              { key:'breadcrumb',label:'Breadcrumb Schema' },
            ].map(s => (
              <label key={s.key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">{s.label}</span>
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${blog.schemaMarkup[s.key]?'bg-primary-500':'bg-gray-300'}`}
                  onClick={() => setBlog(p => ({ ...p, schemaMarkup:{...p.schemaMarkup,[s.key]:!p.schemaMarkup[s.key]} }))}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${blog.schemaMarkup[s.key]?'translate-x-5':'translate-x-0.5'}`} />
                </div>
              </label>
            ))}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
