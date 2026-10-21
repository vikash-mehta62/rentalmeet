export function getMimeType(url = '') {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.webp')) return 'image/webp';
  if (cleanUrl.endsWith('.png')) return 'image/png';
  if (cleanUrl.endsWith('.gif')) return 'image/gif';
  if (cleanUrl.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

export function escapeCdata(str = '') {
  return String(str || '').replace(/]]>/g, ']]]]><![CDATA[>');
}

export function stripHtml(html = '') {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildBlogRssXml(blogs = [], siteUrl = 'https://www.rentalmeet.com') {
  const feedUrl = `${siteUrl}/blog/feed.xml`;
  const latestDate = blogs[0]?.publishedAt || blogs[0]?.createdAt || new Date();
  const buildDate = new Date(latestDate).toUTCString();

  let itemsXml = '';
  for (const b of blogs) {
    const postUrl = `${siteUrl}/blog/${b.slug}`;
    const pubDate = new Date(b.publishedAt || b.createdAt).toUTCString();
    const title = escapeCdata(b.title || '');
    const desc = escapeCdata(stripHtml(b.shortDescription || b.seo?.metaDescription || b.title || ''));
    const author = escapeCdata(b.author || 'RentalMeet');
    const category = escapeCdata(b.category || 'Venue Tips');
    const imageUrl = b.featuredImage || `${siteUrl}/logo.png`;
    const mimeType = getMimeType(imageUrl);

    itemsXml += `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      <category><![CDATA[${category}]]></category>
      <description><![CDATA[${desc}]]></description>
      <content:encoded><![CDATA[<p><img src="${imageUrl}" alt="${title}" /></p><p>${desc}</p>]]></content:encoded>
      <enclosure url="${imageUrl}" length="0" type="${mimeType}" />
      <media:content url="${imageUrl}" medium="image" type="${mimeType}">
        <media:title><![CDATA[${title}]]></media:title>
        <media:description><![CDATA[${desc}]]></media:description>
      </media:content>
      <media:thumbnail url="${imageUrl}" />
    </item>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>RentalMeet Blog - Venue &amp; Event Booking Insights</title>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <link>${siteUrl}/blog</link>
    <description>Guides, marketing strategies, compliance checklists, and booking best practices for banquet halls, event venues, and rental spaces across India.</description>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <language>en-IN</language>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>RentalMeet Blog</title>
      <link>${siteUrl}/blog</link>
      <width>144</width>
      <height>36</height>
    </image>${itemsXml}
  </channel>
</rss>`;
}
