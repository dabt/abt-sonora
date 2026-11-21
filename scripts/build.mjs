import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';

/*
 * Variáveis de ambiente do build
 *   SITE_URL  endereço final do site, sem barra no fim. Padrão: https://sonora.abt.dev.br.
 *             Se for definida como vazia, as tags canonical, Open Graph e os dados estruturados saem do HTML.
 *   INDEXAR   defina como 1 para liberar a indexação (meta robots, robots.txt e sitemap.xml).
 *             Sem ela, o site continua com noindex.
 */
const siteUrl = (process.env.SITE_URL ?? 'https://sonora.abt.dev.br').trim().replace(/\/+$/, '');
const indexar = process.env.INDEXAR === '1';
if (indexar && !siteUrl) throw new Error('INDEXAR=1 exige SITE_URL, por exemplo SITE_URL=https://sonora.exemplo.com.br');

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['index.html', '404.html', 'identidade.html', 'logos.html', 'styles.css', 'site.js', 'sound-design.js', 'assets']) {
  await cp(new URL(file, root), new URL(file, dist), { recursive: true });
}

let html = await readFile(new URL('index.html', root), 'utf8');
html = siteUrl
  ? html.replace(/<!--seo-->|<!--\/seo-->/g, '').replaceAll('{{SITE_URL}}', siteUrl)
  : html.replace(/[ \t]*<!--seo-->[\s\S]*?<!--\/seo-->\n?/g, '');
if (indexar) html = html.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow, max-image-preview:large">');
await writeFile(new URL('index.html', dist), html);

await writeFile(new URL('robots.txt', dist), indexar
  ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
if (indexar) {
  const hoje = new Date().toISOString().slice(0, 10);
  await writeFile(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc><lastmod>${hoje}</lastmod></url>\n</urlset>\n`);
}

console.log(`Abt Sonora: site estático gerado em dist/. Indexação ${indexar ? 'liberada para ' + siteUrl : 'bloqueada (noindex)'}.`);
