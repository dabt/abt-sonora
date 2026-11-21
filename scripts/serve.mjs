import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = {
  '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.wav':'audio/wav', '.ogg':'audio/ogg', '.json':'application/json'
};
const port = Number(process.env.PORT || 4322);
createServer(async (req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Forbidden');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    const headers = {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes'};
    // Áudio precisa de requisições parciais para o navegador permitir avançar e voltar dentro da faixa.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      const start = range[1] === '' ? Math.max(0, body.length - Number(range[2])) : Number(range[1]);
      const end = range[1] === '' || range[2] === '' ? body.length - 1 : Math.min(Number(range[2]), body.length - 1);
      if (start > end || start >= body.length) { res.writeHead(416, {'Content-Range': `bytes */${body.length}`}); return res.end(); }
      res.writeHead(206, {...headers, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Content-Length': end - start + 1});
      return res.end(body.subarray(start, end + 1));
    }
    res.writeHead(200, {...headers, 'Content-Length': body.length});
    res.end(body);
  } catch { res.writeHead(404); res.end('Página não encontrada'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
