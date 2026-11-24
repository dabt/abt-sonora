import { readFile } from 'node:fs/promises';

export const categories = { musica: 'Música', audiovisual: 'Audiovisual', experimento: 'Experimentos' };
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const assetPattern = /^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:webp|png|jpe?g|avif|mp3|m4a|ogg|wav|mp4|webm)$/i;

export function validateCatalogue(data) {
  if (!Array.isArray(data)) throw new Error('O catálogo deve ser uma lista.');
  const slugs = new Set();
  for (const project of data) {
    if (!project || typeof project !== 'object') throw new Error('Projeto inválido.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug || '') || slugs.has(project.slug)) throw new Error('Slug inválido ou duplicado no catálogo.');
    slugs.add(project.slug);
    if (!['rascunho', 'publicado'].includes(project.estado)) throw new Error(`${project.slug}: estado deve ser rascunho ou publicado.`);
    for (const field of ['titulo', 'descricao']) if (typeof project[field] !== 'string' || !project[field].trim()) throw new Error(`${project.slug}: ${field} obrigatório.`);
    if (!Object.hasOwn(categories, project.categoria)) throw new Error(`${project.slug}: categoria inválida.`);
    if (project.ano !== undefined && (!Number.isInteger(project.ano) || project.ano < 1900 || project.ano > 9999)) throw new Error(`${project.slug}: ano inválido.`);
    if (typeof project.capa !== 'string' || !assetPattern.test(project.capa) || !/\.(webp|png|jpe?g|avif)$/i.test(project.capa)) throw new Error(`${project.slug}: capa deve ser uma imagem local em /assets/.`);
    if (typeof project.capaAlt !== 'string' || !project.capaAlt.trim()) throw new Error(`${project.slug}: descreva a capa em capaAlt.`);
    if (project.destaque !== undefined && typeof project.destaque !== 'boolean') throw new Error(`${project.slug}: destaque deve ser booleano.`);
    for (const [field, extension] of [['audio', /\.(mp3|m4a|ogg|wav)$/i], ['video', /\.(mp4|webm)$/i]]) {
      if (project[field] !== undefined && (typeof project[field] !== 'string' || !assetPattern.test(project[field]) || !extension.test(project[field]))) throw new Error(`${project.slug}: ${field} inválido.`);
    }
    if (project.contexto !== undefined && (!Array.isArray(project.contexto) || project.contexto.some(text => typeof text !== 'string' || !text.trim()))) throw new Error(`${project.slug}: contexto deve conter parágrafos.`);
    if (project.creditos !== undefined && (!Array.isArray(project.creditos) || project.creditos.some(credit => !credit || typeof credit.funcao !== 'string' || !credit.funcao.trim() || typeof credit.nome !== 'string' || !credit.nome.trim()))) throw new Error(`${project.slug}: créditos inválidos.`);
    if (project.links !== undefined && (!Array.isArray(project.links) || project.links.some(link => {
      if (!link || typeof link.titulo !== 'string' || !link.titulo.trim()) return true;
      try { const url = new URL(link.url); return url.protocol !== 'https:' || !!url.username || !!url.password; } catch { return true; }
    }))) throw new Error(`${project.slug}: links precisam de título e endereço HTTPS válido.`);
  }
  return data;
}

export async function loadCatalogue(root) {
  return validateCatalogue(JSON.parse(await readFile(new URL('assets/catalogo.json', root), 'utf8')));
}

export const published = projects => projects.filter(project => project.estado === 'publicado');

function card(project) {
  const p = Object.fromEntries(Object.entries(project).filter(([, value]) => ['string', 'number'].includes(typeof value)).map(([key, value]) => [key, escapeHtml(value)]));
  return `<article class="work-card" data-category="${p.categoria}"><a href="/projetos/${p.slug}/"><div class="work-cover"><img src="${p.capa}" alt="${p.capaAlt}" width="1200" height="900" loading="lazy" decoding="async"></div><div class="work-card-meta"><span>${categories[project.categoria]}</span>${project.ano ? `<span>${p.ano}</span>` : ''}</div><h3>${p.titulo}</h3><p>${p.descricao}</p></a></article>`;
}
const replaceBlock = (html, name, content) => html.replace(new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`), () => `<!--${name}:start-->${content}<!--${name}:end-->`);

export function renderCatalogue(html, projects) {
  const works = published(projects);
  if (!works.length) return html;
  const featured = works.filter(project => project.destaque);
  html = replaceBlock(html, 'featured', `<div class="work-grid">${(featured.length ? featured : works).slice(0, 2).map(card).join('')}</div>`);
  const usedCategories = Object.entries(categories).filter(([key]) => works.some(project => project.categoria === key));
  const filters = usedCategories.length > 1 ? `<div class="filters" data-filters role="group" aria-label="Filtrar trabalhos" hidden><button type="button" data-filter="todos" aria-pressed="true">Todos</button>${usedCategories.map(([key, label]) => `<button type="button" data-filter="${key}" aria-pressed="false">${label}</button>`).join('')}</div>` : '';
  html = replaceBlock(html, 'catalogue', `${filters}<p class="filter-status" data-filter-status role="status">${works.length} ${works.length === 1 ? 'trabalho' : 'trabalhos'}</p><div class="work-grid">${works.map(card).join('')}</div>`);
  return replaceBlock(html, 'count', `${works.length} ${works.length === 1 ? 'trabalho publicado' : 'trabalhos publicados'}`);
}

export function renderProject(template, project) {
  const e = escapeHtml;
  const mediaError = '<p data-media-error role="alert" hidden>Não foi possível carregar a mídia. Tente novamente mais tarde.</p>';
  const blocks = {
    TITLE: e(project.titulo), DESCRIPTION: e(project.descricao), SLUG: e(project.slug),
    CATEGORY_YEAR: `${categories[project.categoria]}${project.ano ? ` · ${project.ano}` : ''}`,
    MEDIA: `<img class="project-cover" src="${e(project.capa)}" alt="${e(project.capaAlt)}" width="1440" height="1080" fetchpriority="high">${project.video ? `<figure class="project-media"><video controls playsinline preload="none" poster="${e(project.capa)}" aria-label="${e(project.titulo)}" src="${e(project.video)}"></video>${mediaError}<figcaption>${e(project.titulo)}, vídeo</figcaption></figure>` : ''}${project.audio ? `<div class="project-media"><p class="eyebrow">Ouvir a obra</p><audio controls preload="none" aria-label="${e(project.titulo)}" src="${e(project.audio)}"></audio>${mediaError}</div>` : ''}`,
    CONTEXT: project.contexto?.length ? `<section class="project-text"><h2>Sobre o trabalho</h2>${project.contexto.map(paragraph => `<p>${e(paragraph)}</p>`).join('')}</section>` : '',
    CREDITS: project.creditos?.length ? `<section class="project-credits"><h2>Créditos</h2><dl>${project.creditos.map(credit => `<dt>${e(credit.funcao)}</dt><dd>${e(credit.nome)}</dd>`).join('')}</dl></section>` : '',
    LINKS: project.links?.length ? `<section class="project-links"><h2>Em outros lugares</h2><ul>${project.links.map(link => `<li><a class="text-link" href="${e(link.url)}" rel="noopener noreferrer">${e(link.titulo)}</a></li>`).join('')}</ul></section>` : '',
  };
  // One replacement pass prevents user content from being interpreted as template tokens.
  return template.replace(/\{\{(TITLE|DESCRIPTION|SLUG|CATEGORY_YEAR|MEDIA|CONTEXT|CREDITS|LINKS)\}\}/g, (_, key) => blocks[key]);
}
