// Lista das faixas do site. Cada faixa é um bloco entre chaves, separado por vírgula.
//
// Campos
//   titulo     nome da faixa (obrigatório)
//   arquivo    caminho do áudio, por exemplo 'assets/audio/meu-jingle.mp3' (obrigatório)
//   categoria  'Jingle', 'Trilha', 'Ambiente' ou 'Sound design' (vira filtro quando há mais de um tipo)
//   descricao  para que a faixa foi feita, em uma ou duas frases
//   duracao    como '0:30'. Se faltar, o tempo aparece depois que a faixa for tocada
//   capa       imagem quadrada opcional, por exemplo 'assets/audio/meu-jingle.jpg'
//
// Exemplo (copie para dentro da lista abaixo)
//   {
//     titulo: 'Nome da faixa',
//     arquivo: 'assets/audio/nome-da-faixa.mp3',
//     categoria: 'Jingle',
//     descricao: 'Jingle de 30 segundos para ...',
//     duracao: '0:30'
//   },
//
// Só publique faixas que você tem autorização para divulgar.
// Enquanto a lista abaixo estiver vazia, o player mostra seis esboços de exemplo gerados no navegador,
// só para você ver como ele fica com faixas. Quando houver faixas reais, elas substituem os esboços.
// Para ver o player vazio, em espera, mude para false.
window.FAIXAS_EXEMPLOS = true;

window.FAIXAS = [
];
