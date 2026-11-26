import { escapeHtml } from './catalogue.mjs';

const defaultOrigin = 'https://sonora.abt.dev.br';
const brand = 'Abt Sonora';
const locale = 'pt-BR';
const shareImage = {
  path: '/assets/identidade/og-abt-sonora.jpg',
  alt: 'Assinatura Abt Sonora sobre um estúdio de som ao pôr do sol',
  width: 1200,
  height: 630,
};
const seoBlock = /\n[ \t]*<!--seo-->[\s\S]*?<!--\/seo-->/;

export function seoSettings(env) {
  const fallbackOrigin = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : defaultOrigin;
  const siteUrl = (env.SITE_URL ?? fallbackOrigin).trim().replace(/\/+$/, '');
  const origin = parseOrigin(siteUrl);
  const preview = env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development';
  const index = !preview && (env.INDEXAR === '1' || (env.INDEXAR === undefined && env.VERCEL_ENV === 'production' && Boolean(origin)));
  if (index && !origin) throw new Error('INDEXAR=1 exige SITE_URL.');
  return { origin, index };
}

function parseOrigin(siteUrl) {
  if (!siteUrl) return '';
  const url = new URL(siteUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.href !== `${url.origin}/`) {
    throw new Error('SITE_URL deve ser uma origem HTTP(S), sem caminho, consulta ou credenciais.');
  }
  return url.origin;
}

function structuredData(origin, page, image) {
  const site = `${origin}/`;
  const websiteId = `${site}#site`;
  const publisherId = `${site}#estudio`;
  const canonical = origin + page.path;
  const webPage = {
    '@type': page.type ?? 'WebPage',
    '@id': `${canonical}#pagina`,
    url: canonical,
    name: page.name,
    inLanguage: locale,
    isPartOf: { '@id': websiteId },
  };
  const graph = [webPage];

  if (page.path === '/') {
    graph.unshift({
      '@type': 'Organization',
      '@id': publisherId,
      name: brand,
      url: site,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/assets/identidade/apple-touch-icon.png`,
        width: 180,
        height: 180,
      },
      description: 'Estúdio criativo e selo musical independente dedicado à composição, à produção audiovisual e à experimentação sonora.',
      parentOrganization: { '@type': 'Organization', name: 'ABT Tecnologia', url: 'https://abt.dev.br/' },
    }, {
      '@type': 'WebSite',
      '@id': websiteId,
      name: brand,
      url: site,
      inLanguage: locale,
      publisher: { '@id': publisherId },
    });
  }

  if (page.type === 'AboutPage') webPage.about = { '@id': publisherId };
  if (page.image) {
    webPage.primaryImageOfPage = { '@type': 'ImageObject', contentUrl: `${origin}${image.path}`, caption: image.alt };
  }
  if (page.breadcrumbs) {
    const id = `${canonical}#trilha`;
    webPage.breadcrumb = { '@id': id };
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': id,
      itemListElement: page.breadcrumbs.map(({ name, path }, index) => ({
        '@type': 'ListItem', position: index + 1, name, item: origin + path,
      })),
    });
  }

  // A title or caption from the catalogue must not be able to close the script element.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
}

export function applySeo(html, { origin = '', index = false, page } = {}) {
  if (!page || !origin) return html.replace(seoBlock, '');

  // These values already use HTML escaping in both static and generated page heads.
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"\s*\/?>/)?.[1];
  if (!title || !description || !seoBlock.test(html)) {
    throw new Error(`${page.path}: título, descrição e marcador SEO são obrigatórios.`);
  }
  const canonical = escapeHtml(origin + page.path);
  const image = page.image ?? shareImage;
  const imageUrl = escapeHtml(origin + image.path);
  const imageAlt = escapeHtml(image.alt);
  const dimensions = image.width && image.height ? [
    `<meta property="og:image:width" content="${image.width}">`,
    `<meta property="og:image:height" content="${image.height}">`,
  ] : [];
  const tags = [
    `<link rel="canonical" href="${canonical}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${brand}">`,
    '<meta property="og:locale" content="pt_BR">',
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    ...dimensions,
    `<meta property="og:image:alt" content="${imageAlt}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
    `<meta name="twitter:image:alt" content="${imageAlt}">`,
    `<script type="application/ld+json">${structuredData(origin, page, image)}</script>`,
  ];
  html = html.replace(seoBlock, () => `\n  ${tags.join('\n  ')}`);
  return index ? html.replace('content="noindex, nofollow"', 'content="index, follow, max-image-preview:large"') : html;
}
