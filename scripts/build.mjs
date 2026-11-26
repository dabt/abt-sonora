import { cp, mkdir, rm, readFile, writeFile, stat } from 'node:fs/promises';
import { loadCatalogue, published, renderCatalogue, renderProject, escapeHtml } from './catalogue.mjs';
import { applySeo, seoSettings } from './seo.mjs';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const seo = seoSettings(process.env);
const projects = await loadCatalogue(root);
const works = published(projects);
// Fail before touching dist if configuration, metadata or media are invalid.
for (const project of works) for (const field of ['capa', 'audio', 'video']) {
  if (project[field] && !(await stat(new URL(project[field].slice(1), root)).catch(() => null))?.isFile()) throw new Error(`${project.slug}: arquivo ${project[field]} não encontrado.`);
}

const home = { file: 'index.html', path: '/', name: 'Som, ambiente e narrativa.' };
const catalogue = { file: 'trabalhos/index.html', path: '/trabalhos/', name: 'Projetos e estudos', type: 'CollectionPage' };
const pages = [
  home,
  catalogue,
  { file: 'playlists/index.html', path: '/playlists/', name: 'Coleções sonoras', type: 'CollectionPage' },
  { file: 'estudio/index.html', path: '/estudio/', name: 'Estúdio e selo', type: 'AboutPage' },
  { file: '404.html' },
];
const output = new Map();
for (const page of pages) {
  const html = renderCatalogue(await readFile(new URL(page.file, root), 'utf8'), projects);
  output.set(page.file, applySeo(html, { ...seo, page: page.path ? page : undefined }));
}
const template = await readFile(new URL('scripts/project-template.html', root), 'utf8');
for (const project of works) {
  const path = `/projetos/${project.slug}/`;
  const page = {
    path,
    name: project.titulo,
    image: { path: project.capa, alt: project.capaAlt },
    breadcrumbs: [{ path: home.path, name: 'Início' }, catalogue, { path, name: project.titulo }],
  };
  pages.push(page);
  output.set(`${path.slice(1)}index.html`, applySeo(renderProject(template, project), { ...seo, page }));
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['sonora.css', 'player.css', 'site.js', 'logo.js', 'estudos.js', 'player.js', 'assets']) await cp(new URL(file, root), new URL(file, dist), { recursive: true });
for (const [path, html] of output) {
  const target = new URL(path, dist);
  await mkdir(new URL('./', target), { recursive: true });
  await writeFile(target, html);
}
// Drafts stay local, including their metadata. Old synthetic demos are not published.
await writeFile(new URL('assets/catalogo.json', dist), JSON.stringify(works, null, 2) + '\n');
await rm(new URL('assets/audio/faixas.js', dist), { force: true });
await rm(new URL('assets/audio/comparacao.js', dist), { force: true });
const robots = 'User-agent: *\nAllow: /\n' + (seo.index ? `\nSitemap: ${seo.origin}/sitemap.xml\n` : '');
await writeFile(new URL('robots.txt', dist), robots);
if (seo.index) {
  const urls = pages.filter(page => page.path).map(({ path }) => `  <url><loc>${escapeHtml(seo.origin + path)}</loc></url>`);
  await writeFile(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}
console.log(`Abt Sonora: ${output.size} páginas em dist/. ${works.length} obras publicadas. Indexação ${seo.index ? 'liberada' : 'bloqueada'}.`);
