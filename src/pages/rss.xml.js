import rss from '@astrojs/rss';
import { getPublishedPosts } from '../lib/blog';

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Blog de Accesa',
    description: 'Artículos sobre accesibilidad digital, WCAG 2.2 y normativa chilena.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>es-cl</language>',
  });
}
