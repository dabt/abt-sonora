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
  window.matchMedia('(min-width: 761px)').addEventListener('change', () => setOpen(false));
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
