/**
 * 55map 交互式报告与演示 —— Node.js 服务（零依赖，仅使用内置模块）
 *
 * 路由：
 *   /                    交互式报告首页
 *   /app/*               前端静态资源（含裁切后的地图 app/map.png）
 *   /data/*.json         章节映射与目录数据
 *   /55map.png           原始整页图片
 *   /i55map0813.html     原文档（gb2312，锚点可跳转）
 *   /i55map0813.files/*  原文档图片资源（别名）
 *   /五行地图学i55map0813.files/*  原文档自带的相对资源路径
 *
 * 启动：node server.js  （默认 http://localhost:8787，与 wrangler dev 一致；
 *                         线上部署使用 Cloudflare Workers，见 worker.js / wrangler.toml）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8787;

const DOC_HTML = '五行地图学i55map0813.html';
const DOC_FILES = '五行地图学i55map0813.files';

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendFile(res, filePath, extraHeaders) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const headers = Object.assign(
      {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache'
      },
      extraHeaders || {}
    );
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

function safeJoin(base, relative) {
  const target = path.normalize(path.join(base, relative));
  return target.startsWith(path.normalize(base + path.sep)) ? target : null;
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch (e) {
    res.writeHead(400).end('400 Bad Request');
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    sendFile(res, path.join(ROOT, 'app', 'index.html'));
    return;
  }

  if (pathname === '/app/map.png' || pathname.startsWith('/app/') || pathname.startsWith('/data/')) {
    const target = safeJoin(ROOT, pathname.slice(1));
    if (!target) return res.writeHead(403).end('403 Forbidden');
    sendFile(res, target);
    return;
  }

  if (pathname === '/' + DOC_HTML || pathname === '/i55map0813.html') {
    // 文档为 gb2312，保留原始字节，由页面内 meta 声明编码
    sendFile(res, path.join(ROOT, DOC_HTML), { 'Content-Type': 'text/html' });
    return;
  }

  if (pathname === '/55map.png') {
    sendFile(res, path.join(ROOT, '55map.png'));
    return;
  }

  const filesPrefix = '/' + DOC_FILES + '/';
  const filesAlias = '/i55map0813.files/';
  if (pathname.startsWith(filesPrefix)) {
    const target = safeJoin(path.join(ROOT, DOC_FILES), pathname.slice(filesPrefix.length));
    if (!target) return res.writeHead(403).end('403 Forbidden');
    sendFile(res, target);
    return;
  }
  if (pathname.startsWith(filesAlias)) {
    const target = safeJoin(path.join(ROOT, DOC_FILES), pathname.slice(filesAlias.length));
    if (!target) return res.writeHead(403).end('403 Forbidden');
    sendFile(res, target);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log('55map 报告与演示已启动：http://localhost:' + PORT);
});
