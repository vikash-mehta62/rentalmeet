import { buildBlogRssXml } from '@/lib/rssFeed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    // fallback
  }

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
    return new Response('Error generating blog RSS feed', { status: 500 });
  }
}
