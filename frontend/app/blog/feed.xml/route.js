import { buildBlogRssXml } from '@/lib/rssFeed';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // auto-refresh feed every 5 minutes

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // 1. Try fetching ready-made RSS feed from backend
  try {
    const res = await fetch(`${apiUrl}/blogs/feed.xml`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const xml = await res.text();
      return new Response(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
        },
      });
    }
  } catch (e) {
    console.warn('Backend /blogs/feed.xml fetch error, falling back to direct JSON fetch:', e.message);
  }

  // 2. Fallback: Fetch all published blogs via JSON endpoint and build XML
  try {
    const jsonRes = await fetch(`${apiUrl}/blogs?limit=500`, {
      cache: 'no-store',
    });
    const data = await jsonRes.json();
    const blogs = Array.isArray(data.blogs) ? data.blogs : [];
    const xml = buildBlogRssXml(blogs);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Failed to generate blog RSS feed:', err);
    return new Response('Error generating blog RSS feed', { status: 500 });
  }
}
