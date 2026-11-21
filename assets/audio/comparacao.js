// Publique duas versões autorizadas do MESMO trecho, com a mesma duração e alinhamento.
// Exemplo: antes: 'assets/audio/interface-antes.mp3', depois: 'assets/audio/interface-depois.mp3'.
// Ajuste o volume dos arquivos para que a comparação não dependa só de um som mais alto.
// Sem arquivos, a página usa uma demonstração sintetizada, identificada como exemplo.
// Para ocultar essa demonstração, defina demo como false.
window.COMPARACAO_SONORA = {
  titulo: 'Uma interface ganha movimento.',
  descricao: 'Três momentos: abertura, transição e confirmação. Antes, sinais simples; depois, movimentos, impactos e ressonâncias.',
  antes: '',
  depois: '',
  demo: true,
  // Para gravações reais, personalize os rótulos e os momentos da cena (segundos).
  rotuloAntes: 'Sinal simples',
  rotuloDepois: 'Camadas e textura',
  momentos: [
    { tempo: 0.65, nome: 'Abertura' },
    { tempo: 3.05, nome: 'Transição' },
    { tempo: 5.65, nome: 'Confirmação' },
  ],
};
