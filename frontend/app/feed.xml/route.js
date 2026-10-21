import { GET as getBlogFeed } from '../blog/feed.xml/route';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET(request) {
  return getBlogFeed(request);
}
