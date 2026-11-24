/* abt sonora — navegação e catálogo. Sem áudio automático. */
document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

const header = document.querySelector('.header');
const toggle = header?.querySelector('.menu-toggle');
if (toggle) {
  toggle.hidden = false;
  header.classList.add('menu-ready');
  const setOpen = open => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '−' : '+';
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  header.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia('(max-width: 870px)').addEventListener('change', () => setOpen(false));
}

const studioIndex = document.querySelector('.studio-index');
if (studioIndex) {
  const syncLocation = () => studioIndex.querySelectorAll('a').forEach(link => {
    if (link.hash === location.hash) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  window.addEventListener('hashchange', syncLocation);
  syncLocation();
}

const shelf = document.querySelector('[data-collection]');
if (shelf) {
  const windowEl = shelf.querySelector('[data-collection-window]');
  const cards = [...shelf.querySelectorAll('.collection-card')];
  const previous = shelf.querySelector('[data-previous]');
  const next = shelf.querySelector('[data-next]');
  const status = shelf.querySelector('[data-collection-status]');
  const controls = shelf.querySelector('[data-collection-controls]');
  const tolerance = 2;
  const maxScroll = () => windowEl.scrollWidth - windowEl.clientWidth;

  function syncArrows() {
    const max = maxScroll();
    controls.hidden = max <= tolerance;
    previous.setAttribute('aria-disabled', String(windowEl.scrollLeft <= tolerance));
    next.setAttribute('aria-disabled', String(windowEl.scrollLeft >= max - tolerance));
  }

  function step(direction) {
    const position = windowEl.scrollLeft;
    const left = windowEl.getBoundingClientRect().left + parseFloat(getComputedStyle(windowEl).paddingLeft);
    const max = maxScroll();
    const offsets = cards.map(card => Math.max(0, Math.min(max, position + card.getBoundingClientRect().left - left)));
    const target = direction > 0
      ? offsets.findIndex(offset => offset > position + tolerance)
      : offsets.findLastIndex(offset => offset < position - tolerance);
    if (target < 0) return;
    windowEl.scrollTo({ left: offsets[target] });
    status.textContent = cards[target].querySelector('strong').textContent;
  }

  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  windowEl.addEventListener('scroll', syncArrows, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(syncArrows).observe(windowEl);
  else window.addEventListener('resize', syncArrows);
  syncArrows();
}

const filters = document.querySelector('[data-filters]');
if (filters) {
  filters.hidden = false;
  const cards = [...document.querySelectorAll('[data-category]')];
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const category = button.dataset.filter;
    filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    cards.forEach(card => {
      card.hidden = category !== 'todos' && card.dataset.category !== category;
      if (!card.hidden) visible++;
    });
    document.querySelector('[data-filter-status]').textContent = `${visible} ${visible === 1 ? 'trabalho' : 'trabalhos'}`;
  });
}

/* Uma mídia por vez; controles nativos oferecem teclado, volume e busca. */
document.querySelectorAll('audio, video').forEach(media => {
  media.addEventListener('play', () => {
    document.dispatchEvent(new CustomEvent('sonora-audio', { detail: 'media' }));
    document.querySelectorAll('audio, video').forEach(other => { if (other !== media) other.pause(); });
  });
  media.addEventListener('error', () => {
    const error = media.parentElement.querySelector('[data-media-error]');
    if (error) error.hidden = false;
  });
});
window.addEventListener('pagehide', () => document.querySelectorAll('audio, video').forEach(media => media.pause()));

document.addEventListener('sonora-audio', event => { if (event.detail !== 'media') document.querySelectorAll('audio, video').forEach(media => media.pause()); });

/* A leitura continua completa sem JS ou com movimento reduzido. */
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const units = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: .08 });
  units.forEach(unit => observer.observe(unit));
  document.documentElement.classList.add('reveal-ready');
}
