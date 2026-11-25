/**
 * 55map · Cloudflare Worker 入口（Module 语法）
 *
 * 站点文件全部由 Workers Static Assets 托管（配置见 wrangler.toml 的 [assets]）。
 * Worker 本身只保留两个兼容别名，把前端使用的英文路径映射回原文档的中文文件名：
 *
 *   /i55map0813.html         -> /五行地图学i55map0813
 *   /i55map0813.files/*      -> /五行地图学i55map0813.files/*
 *
 * 原文档是 gb2312 编码，而静态资源默认会给 text/html 追加 charset=utf-8，
 * 会压过页面内 meta 声明造成中文乱码；因此文档路由单独取出响应并把
 * Content-Type 改回不带 charset 的 text/html，交给浏览器按 meta 解码。
 * 同时直接请求无扩展名路径，规避 .html 的 307 跳转。
 *
 * 其余请求（/、/app/*、/data/*、/55map.png、原文档自带的中文资源路径等）
 * 都直接交给静态资源绑定 env.ASSETS 处理。
 */

const DOC_ASSET_PATH = '/五行地图学i55map0813'; // 无扩展名，ASSETS 直接 200
const DOC_FILES_PREFIX = '/五行地图学i55map0813.files/';
const ALIAS_FILES_PREFIX = '/i55map0813.files/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === '/i55map0813.html') {
      const docUrl = new URL(DOC_ASSET_PATH, url);
      const docResponse = await env.ASSETS.fetch(new Request(docUrl, request));
      const headers = new Headers(docResponse.headers);
      // 去掉静态资源自动追加的 charset=utf-8，让文档 meta 的 gb2312 生效
      headers.set('Content-Type', 'text/html');
      return new Response(docResponse.body, {
        status: docResponse.status,
        statusText: docResponse.statusText,
        headers
      });
    }

    if (pathname.startsWith(ALIAS_FILES_PREFIX)) {
      const targetPath = DOC_FILES_PREFIX + pathname.slice(ALIAS_FILES_PREFIX.length);
      return env.ASSETS.fetch(new Request(new URL(targetPath, url), request));
    }

    return env.ASSETS.fetch(request);
  }
};
