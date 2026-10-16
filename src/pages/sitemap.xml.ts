import type { APIRoute } from 'astro';
import { getPublishedPosts, isoDate, tagSlug } from '../lib/blog';

/**
 * Sitemap en la misma dirección que ya está registrada en Google Search Console
 * (https://accesa.agency/sitemap.xml). Se regenera solo con cada publicación.
 */
const SITE = 'https://accesa.agency';

type Entry = { path: string; priority: string; lastmod?: string; alternates?: { es: string; en: string } };

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const home = { es: '/', en: '/en/' };
  const a11y = { es: '/accesibilidad/', en: '/en/accessibility/' };

  const entries: Entry[] = [
    { path: '/', priority: '1.0', alternates: home },
    { path: '/en/', priority: '0.9', alternates: home },
    { path: '/accesibilidad/', priority: '0.8', alternates: a11y },
    { path: '/en/accessibility/', priority: '0.7', alternates: a11y },
    { path: '/blog/', priority: '0.8', lastmod: posts[0] ? isoDate(posts[0].data.date) : undefined },
    ...posts.map((p) => ({
      path: `/blog/${p.id}/`,
      priority: '0.7',
      lastmod: isoDate(p.data.updated ?? p.data.date),
    })),
    ...[...new Set(posts.flatMap((p) => p.data.tags.map(tagSlug)))].map((t) => ({
      path: `/blog/etiqueta/${t}/`,
      priority: '0.4',
    })),
  ];

  const url = (e: Entry) => {
    const alt = e.alternates
      ? `\n    <xhtml:link rel="alternate" hreflang="es" href="${SITE}${e.alternates.es}"/>` +
        `\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${e.alternates.en}"/>`
      : '';
    const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : '';
    return `  <url>\n    <loc>${SITE}${e.path}</loc>${lastmod}\n    <priority>${e.priority}</priority>${alt}\n  </url>`;
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(url).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
