import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalogue, renderCatalogue, renderProject } from './catalogue.mjs';
import { applySeo, seoSettings } from './seo.mjs';
const root = new URL('../', import.meta.url);
const fixture = { slug: 'estudo-de-teste', titulo: 'Estudo <de teste>', descricao: 'Som & imagem', categoria: 'musica', estado: 'publicado', capa: '/assets/img/frequencia.webp', capaAlt: 'Formas de cobre', contexto: ['Um teste, sem publicação.'], creditos: [{ funcao: 'Direção', nome: 'Pessoa de teste' }], links: [{ titulo: 'Canal', url: 'https://example.com/' }] };

test('catálogo vazio mantém apresentação honesta e não cria filtros ou links de obras', async () => {
  const html = await readFile(new URL('trabalhos/index.html', root), 'utf8');
  const output = renderCatalogue(html, validateCatalogue([]));
  assert.match(output, /Ainda não há obras publicadas/);
  assert.match(output, /href="\/#laboratorio">Experimentar os arranjos/);
  assert.doesNotMatch(output, /data-filter=|href="\/projetos\//);
});

test('publica somente obras aprovadas, com filtros reais e página acessível sem JavaScript', async () => {
  const draft = { ...fixture, slug: 'rascunho-secreto', estado: 'rascunho', titulo: 'Título privado' };
  const other = { ...fixture, slug: 'outro-teste', categoria: 'audiovisual' };
  const projects = validateCatalogue([fixture, other, draft]);
  const html = await readFile(new URL('trabalhos/index.html', root), 'utf8');
  const output = renderCatalogue(html, projects);
  assert.match(output, /href="\/projetos\/estudo-de-teste\/"/);
  assert.match(output, /data-filter="musica"/);
  assert.match(output, /2 trabalhos publicados/);
  assert.doesNotMatch(output, /Experimentar os arranjos/);
  assert.doesNotMatch(output, /Título privado|rascunho-secreto/);
  assert.match(output, /Estudo &lt;de teste&gt;/);
});

test('dados inseguros ou inconsistentes impedem publicação', () => {
  for (const change of [ { slug: '../escape' }, { categoria: 'toString' }, { capa: 'https://example.com/remote.jpg' }, { audio: '/assets/audio/../arquivo.mp3' }, { links: [{ titulo: 'X', url: 'javascript:alert(1)' }] }, { estado: 'qualquer' }, { ano: '2026' } ]) {
    assert.throws(() => validateCatalogue([{ ...fixture, ...change }]));
  }
  assert.throws(() => validateCatalogue([fixture, fixture]));
});

test('modelo da obra escapa conteúdo e não cria mídias ou créditos vazios', async () => {
  const template = await readFile(new URL('scripts/project-template.html', root), 'utf8');
  const output = renderProject(template, fixture);
  assert.match(output, /<h1>Estudo &lt;de teste&gt;<\/h1>/);
  assert.match(output, /Direção/);
  assert.doesNotMatch(output, /<audio|<video|\{\{TITLE\}\}/);
  const withMedia = renderProject(template, { ...fixture, audio: '/assets/audio/teste.mp3', video: '/assets/video/teste.mp4' });
  assert.match(withMedia, /<audio controls preload="none"/);
  assert.match(withMedia, /<video controls playsinline preload="none"/);
  assert.doesNotMatch(withMedia, /autoplay/);
});

test('metadados funcionam com e sem domínio e preservam noindex até lançamento', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const page = { path: '/', name: 'Som, ambiente e narrativa' };
  const origin = 'https://sonora.example.com';
  const local = applySeo(html);
  assert.doesNotMatch(local, /<!--seo-->|rel="canonical"|application\/ld\+json/);
  assert.match(local, /content="noindex, nofollow"/);
  const production = applySeo(html, { origin, index: true, page });
  assert.match(production, /content="index, follow, max-image-preview:large"/);
  assert.match(production, /href="https:\/\/sonora.example.com\/"/);
  const schema = JSON.parse(production.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.ok(schema['@graph'].some(item => item['@type'] === 'WebSite' && item.name === 'ABT Sonora' && item.url === `${origin}/`));
  assert.ok(schema['@graph'].some(item => item['@type'] === 'Organization' && item.logo.height === 180));
  const errorPage = await readFile(new URL('404.html', root), 'utf8');
  assert.doesNotMatch(applySeo(errorPage, { origin, index: true }), /rel="canonical"|application\/ld\+json/);
  assert.match(applySeo(errorPage, { origin, index: true }), /content="noindex, nofollow"/);
});

test('configuração preserva prévias protegidas e usa a origem canônica de produção', () => {
  const host = 'sonora.example.com';
  assert.equal(seoSettings({}).index, false);
  assert.deepEqual(seoSettings({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: host }), { origin: `https://${host}`, index: true });
  assert.equal(seoSettings({ VERCEL_ENV: 'preview', INDEXAR: '1' }).index, false);
  assert.equal(seoSettings({ VERCEL_ENV: 'production', INDEXAR: '0' }).index, false);
  assert.deepEqual(seoSettings({ INDEXAR: '1', SITE_URL: `https://${host}/` }), { origin: `https://${host}`, index: true });
  for (const SITE_URL of ['javascript:alert(1)', `https://${host}/sobre/`, `https://${host}/?foo=1`, `https://user@${host}`]) {
    assert.throws(() => seoSettings({ SITE_URL }));
  }
  assert.throws(() => seoSettings({ INDEXAR: '1', SITE_URL: '' }));
});

test('ficha usa capa própria, trilha de navegação e escapa dados de compartilhamento', async () => {
  const template = await readFile(new URL('scripts/project-template.html', root), 'utf8');
  const project = { ...fixture, titulo: 'Som "cru" </script>', capaAlt: 'Cobre & sombra' };
  const path = `/projetos/${project.slug}/`;
  const origin = 'https://sonora.example.com';
  const breadcrumbs = [{ name: 'Início', path: '/' }, { name: 'Projetos', path: '/trabalhos/' }, { name: project.titulo, path }];
  const html = applySeo(renderProject(template, project), {
    origin, index: true, page: { path, name: project.titulo, image: { path: project.capa, alt: project.capaAlt }, breadcrumbs },
  });
  assert.match(html, /og:title" content="Som &quot;cru&quot; &lt;\/script&gt; \| ABT Sonora"/);
  assert.ok(html.includes(`<meta property="og:image" content="${origin}${project.capa}">`));
  assert.match(html, /og:image:alt" content="Cobre &amp; sombra"/);
  assert.doesNotMatch(html, /og:image:width|og:image:height/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  const trail = schema['@graph'].find(item => item['@type'] === 'BreadcrumbList');
  assert.deepEqual(trail.itemListElement.map(({ name, item }) => [name, item]), breadcrumbs.map(entry => [entry.name, origin + entry.path]));
});
