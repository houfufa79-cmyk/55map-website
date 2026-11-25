/**
 * 55map · Cloudflare Worker 入口（Module 语法）
 *
 * 站点文件全部由 Workers Static Assets 托管（配置见 wrangler.toml 的 [assets]）。
 * Worker 本身只保留两个兼容别名，把前端使用的英文路径映射回原文档的中文文件名：
 *
 *   /i55map0813.html         -> /五行地图学i55map0813.html
 *   /i55map0813.files/*      -> /五行地图学i55map0813.files/*
 *
 * 其余请求（/、/app/*、/data/*、/55map.png、原文档自带的中文资源路径等）
 * 都直接交给静态资源绑定 env.ASSETS 处理。
 */

const DOC_HTML = '/五行地图学i55map0813.html';
const DOC_FILES_PREFIX = '/五行地图学i55map0813.files/';
const ALIAS_FILES_PREFIX = '/i55map0813.files/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    let targetPath = pathname;

    if (pathname === '/i55map0813.html') {
      targetPath = DOC_HTML;
    } else if (pathname.startsWith(ALIAS_FILES_PREFIX)) {
      targetPath = DOC_FILES_PREFIX + pathname.slice(ALIAS_FILES_PREFIX.length);
    }

    if (targetPath !== pathname) {
      const targetUrl = new URL(targetPath, url);
      return env.ASSETS.fetch(new Request(targetUrl, request));
    }

    return env.ASSETS.fetch(request);
  }
};
