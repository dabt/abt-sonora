import { cp, mkdir, rm, readFile, writeFile, stat } from 'node:fs/promises';
import { loadCatalogue, published, renderCatalogue, renderProject, applySeo, escapeHtml } from './catalogue.mjs';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const siteUrl = (process.env.SITE_URL ?? 'https://sonora.abt.dev.br').trim().replace(/\/+$/, '');
const indexar = process.env.INDEXAR === '1';
if (indexar && !siteUrl) throw new Error('INDEXAR=1 exige SITE_URL.');
const projects = await loadCatalogue(root);
const works = published(projects);
// Fail before touching dist if configuration, metadata or media are invalid.
applySeo('', siteUrl);
for (const project of works) for (const field of ['capa', 'audio', 'video']) {
  if (project[field] && !(await stat(new URL(project[field].slice(1), root)).catch(() => null))?.isFile()) throw new Error(`${project.slug}: arquivo ${project[field]} não encontrado.`);
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['styles.css', 'site.js', 'estudos.js', 'assets']) await cp(new URL(file, root), new URL(file, dist), { recursive: true });
const pages = ['index.html', 'trabalhos/index.html', 'estudio/index.html', '404.html'];
async function writePage(path, html) {
  const target = new URL(path, dist);
  await mkdir(new URL('./', target), { recursive: true });
  await writeFile(target, applySeo(html, siteUrl, indexar && path !== '404.html'));
}
for (const path of pages) await writePage(path, renderCatalogue(await readFile(new URL(path, root), 'utf8'), projects));
const template = await readFile(new URL('scripts/project-template.html', root), 'utf8');
for (const project of works) await writePage(`projetos/${project.slug}/index.html`, renderProject(template, project));
// Drafts stay local, including their metadata. Old synthetic demos are not published.
await writeFile(new URL('assets/catalogo.json', dist), JSON.stringify(works, null, 2) + '\n');
await rm(new URL('assets/audio/faixas.js', dist), { force: true });
await rm(new URL('assets/audio/comparacao.js', dist), { force: true });
await writeFile(new URL('robots.txt', dist), indexar ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
if (indexar) {
  const paths = ['/', '/trabalhos/', '/estudio/', ...works.map(project => `/projetos/${project.slug}/`)];
  await writeFile(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${escapeHtml(siteUrl + path)}</loc></url>`).join('\n')}\n</urlset>\n`);
}
console.log(`abt sonora: ${pages.length + works.length} páginas em dist/. ${works.length} obras publicadas. Indexação ${indexar ? 'liberada' : 'bloqueada'}.`);
