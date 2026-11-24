import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalogue, renderCatalogue, renderProject, applySeo } from './catalogue.mjs';
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
  const local = applySeo(html, '');
  assert.doesNotMatch(local, /\{\{SITE_URL\}\}|rel="canonical"|application\/ld\+json/);
  const production = applySeo(html, 'https://sonora.example.com', true);
  assert.match(production, /content="index, follow, max-image-preview:large"/);
  assert.match(production, /href="https:\/\/sonora.example.com\/"/);
  assert.throws(() => applySeo(html, 'javascript:alert(1)'));
});
