const form = document.querySelector('.lab-options');
const preview = document.querySelector('[data-preview]');
const selection = document.querySelector('[data-selection]');
const copy = document.querySelector('[data-copy]');
const copyStatus = document.querySelector('[data-copy-status]');

function updatePreview() {
  const type = form.elements.typography;
  const button = form.elements.button;
  preview.dataset.type = type.value;
  preview.dataset.button = button.value;
  const names = [...form.querySelectorAll('input:checked')].map(input =>
    input.labels[0].querySelector('.option-name').textContent
  );
  selection.textContent = names.join(' · ');
  copy.textContent = 'Copiar escolha';
  copyStatus.textContent = '';
}

form.addEventListener('change', updatePreview);
updatePreview();

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(selection.textContent);
    copy.textContent = 'Escolha copiada';
    copyStatus.textContent = 'Escolha copiada para a área de transferência.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(selection);
    const selected = window.getSelection();
    selected.removeAllRanges();
    selected.addRange(range);
    copyStatus.textContent = 'O texto da escolha está selecionado para copiar.';
  }
});

const play = preview.querySelector('[data-preview-play]');
const playText = play.querySelector('[data-play-text]');
const audio = preview.querySelector('audio');
const audioError = preview.querySelector('[data-play-error]');

function syncPlayback() {
  const playing = !audio.paused && !audio.ended;
  play.toggleAttribute('data-playing', playing);
  playText.textContent = playing ? 'Pausar seleção' : 'Ouvir seleção';
}

play.addEventListener('click', async () => {
  if (!audio.paused) {
    audio.pause();
    return;
  }
  audioError.hidden = true;
  try { await audio.play(); } catch { audioError.hidden = false; }
});

for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, syncPlayback);
window.addEventListener('pagehide', () => audio.pause());
