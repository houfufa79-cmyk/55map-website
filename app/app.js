/* 55map · 五行地图学 —— 数字地图导航报告 */
(function () {
  'use strict';

  var DOC_URL = '/i55map0813.html';
  var state = { data: null, toc: [], chaptersById: {} };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function docLink(anchor) {
    return DOC_URL + '#' + anchor;
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(message) {
    var box = $('#toast');
    box.textContent = message;
    box.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('is-on'); }, 2400);
  }

  /* ---------- 热区 ---------- */
  function hotspotNode(spot) {
    var chapter = state.chaptersById[spot.chapter];
    var a = el('a', 'hotspot');
    a.href = docLink(chapter.anchor);
    a.target = '_blank';
    a.rel = 'noopener';
    a.dataset.digit = spot.digit;
    a.style.setProperty('--l', spot.left + '%');
    a.style.setProperty('--t', spot.top + '%');
    a.style.setProperty('--w', spot.width + '%');
    a.style.setProperty('--h', spot.height + '%');
    a.setAttribute('aria-label', '数字 ' + chapter.num + ' · ' + chapter.region + ' · ' + chapter.title + ' · 第 ' + chapter.page + ' 页');
    var tag = el('span', 'hotspot__tag',
      '<b>' + chapter.num + '</b> ' + chapter.region + '（' + chapter.element + '）<em>第 ' + chapter.page + ' 页</em>');
    a.appendChild(tag);
    a.addEventListener('click', function () {
      toast('正在打开「' + chapter.title + '」· 第 ' + chapter.page + ' 页');
    });
    return a;
  }

  function fillHotspots(container) {
    container.innerHTML = '';
    state.data.hotspots.forEach(function (spot) {
      container.appendChild(hotspotNode(spot));
    });
  }

  /* ---------- 概览数字 ---------- */
  function renderStats() {
    var d = state.data.doc;
    var stats = [
      ['7', '可点击数字'],
      [String(state.data.chapters.length), '洲际章节'],
      [String(d.tocNodes), '目录节点'],
      [String(d.pages), '文档页数']
    ];
    var box = $('#stats');
    stats.forEach(function (pair) {
      box.appendChild(el('span', 'stat', '<b>' + pair[0] + '</b>' + pair[1]));
    });
  }

  /* ---------- 图例 ---------- */
  function renderLegend() {
    var list = $('#legend');
    state.data.chapters.forEach(function (ch) {
      var li = el('li');
      var a = el('a');
      a.href = docLink(ch.anchor);
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML =
        '<span class="badge" style="background:' + (state.data.elements[ch.element] || '#17191c') + '">' + ch.num + '</span>' +
        '<span class="legend__text"><span>' + ch.region + '（' + ch.element + '）</span>' +
        '<small>' + ch.title + ' · 第 ' + ch.page + ' 页</small></span>';
      a.addEventListener('click', function () {
        toast('正在打开「' + ch.title + '」· 第 ' + ch.page + ' 页');
      });
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  /* ---------- 对照表 ---------- */
  function renderMatrix() {
    var body = $('#matrixBody');
    state.data.chapters.forEach(function (ch) {
      var tr = el('tr');
      var color = state.data.elements[ch.element] || '#17191c';
      tr.innerHTML =
        '<td><span class="badge" style="background:' + color + '">' + ch.num + '</span></td>' +
        '<td><span class="el-tag" style="color:' + color + '">' + ch.element + '</span></td>' +
        '<td><span class="cell-title">' + ch.region + '</span>' +
        '<span class="cell-note">' + ch.notes + '</span>' +
        '<span class="cell-note cell-star">' + ch.star + '</span></td>' +
        '<td><a href="' + docLink(ch.anchor) + '" target="_blank" rel="noopener">' + ch.title + '</a></td>' +
        '<td class="t-right mono">' + ch.page + '</td>' +
        '<td class="t-right"><a class="row-open" href="' + docLink(ch.anchor) + '" target="_blank" rel="noopener">阅读 ↗</a></td>';
      body.appendChild(tr);
    });

    var refs = $('#overviewRefs');
    state.data.overview.forEach(function (item, i) {
      var a = el('a', null, item.title + ' · 第 ' + item.page + ' 页');
      a.href = docLink(item.anchor);
      a.target = '_blank';
      a.rel = 'noopener';
      refs.appendChild(a);
      if (i < state.data.overview.length - 1) refs.appendChild(el('span', 'muted', '·'));
    });
  }

  /* ---------- 目录索引 ---------- */
  function renderToc() {
    var body = $('#tocBody');
    var input = $('#tocSearch');
    var deep = $('#tocDeep');
    var count = $('#tocCount');
    var empty = $('#tocEmpty');

    function draw() {
      var q = input.value.trim().toLowerCase();
      var maxLevel = deep.checked ? 3 : 1;
      var rows = state.toc.filter(function (item) {
        return item.level <= maxLevel && (!q || item.title.toLowerCase().indexOf(q) !== -1);
      });

      body.innerHTML = '';
      var frag = document.createDocumentFragment();
      rows.forEach(function (item) {
        var tr = el('tr');
        tr.innerHTML =
          '<td class="t-page mono">' + (item.page == null ? '–' : item.page) + '</td>' +
          '<td><a href="' + docLink(item.anchor) + '" target="_blank" rel="noopener">' + item.title + '</a></td>' +
          '<td class="t-right"><span class="lvl">H' + item.level + '</span></td>';
        frag.appendChild(tr);
      });
      body.appendChild(frag);

      count.textContent = '显示 ' + rows.length + ' / ' + state.toc.length + ' 条';
      empty.hidden = rows.length !== 0;
    }

    input.addEventListener('input', draw);
    deep.addEventListener('change', draw);
    draw();
  }

  /* ---------- 演示模式 ---------- */
  var deck = {
    index: 0,
    slides: []
  };

  function buildDeck() {
    var stage = $('#deckStage');
    stage.innerHTML = '';

    // 1 封面
    var s1 = el('section', 'slide is-active');
    s1.innerHTML =
      '<p class="slide__kicker">55map · 五行地图学</p>' +
      '<h2>一张地图，<br>六个可以点击的数字</h2>' +
      '<p>数字不是装饰，而是目录的入口：5 通向東部亞洲，7 通向北美，9 通向欧洲，10 通向非洲。' +
      '这份演示中的地图同样可点击。</p>' +
      '<div class="stats">' +
      '<span class="stat"><b>7</b>可点击数字</span>' +
      '<span class="stat"><b>6</b>洲际章节</span>' +
      '<span class="stat"><b>' + state.toc.length + '</b>目录节点</span>' +
      '<span class="stat"><b>140</b>文档页数</span>' +
      '</div>';
    stage.appendChild(s1);

    // 2 地图
    var s2 = el('section', 'slide');
    s2.innerHTML =
      '<p class="slide__kicker">数字地图</p>' +
      '<h2>点击数字，直达章节</h2>' +
      '<p class="map-hint">悬停查看章节，点击会在新标签页打开原文档的对应锚点。</p>' +
      '<div class="map-scroll"><figure class="map-frame">' +
      '<img src="/app/map.png" alt="世界地图与可点击数字" draggable="false"><div class="hotspots"></div>' +
      '</figure></div>';
    stage.appendChild(s2);
    fillHotspots($('.hotspots', s2));

    // 3 对照表
    var s3 = el('section', 'slide');
    var rows = state.data.chapters.map(function (ch) {
      return '<tr>' +
        '<td class="mono"><b style="color:#e2c17e">' + ch.num + '</b></td>' +
        '<td>' + ch.element + '</td>' +
        '<td>' + ch.region + '</td>' +
        '<td class="mono" style="opacity:.7">' + ch.star + '</td>' +
        '<td><a href="' + docLink(ch.anchor) + '" target="_blank" rel="noopener">' + ch.title + '</a></td>' +
        '<td class="mono" style="text-align:right">' + ch.page + '</td>' +
        '</tr>';
    }).join('');
    s3.innerHTML =
      '<p class="slide__kicker">对应关系</p>' +
      '<h2>六大洲 × 五行</h2>' +
      '<p>数字、五行、星神与章节页码一一对应，均可点击跳转。</p>' +
      '<table class="deck-table"><thead><tr><th>数字</th><th>五行</th><th>区域</th><th>星神</th><th>章节</th><th style="text-align:right">页码</th></tr></thead><tbody>' +
      rows + '</tbody></table>';
    stage.appendChild(s3);

    // 4 目录速览
    var level1 = state.toc.filter(function (i) { return i.level === 1; }).slice(0, 60);
    var s4 = el('section', 'slide');
    s4.innerHTML =
      '<p class="slide__kicker">目录索引</p>' +
      '<h2>一级目录速览</h2>' +
      '<p>共 ' + state.toc.filter(function (i) { return i.level === 1; }).length + ' 条一级标题，以下展示前 ' + level1.length + ' 条。</p>' +
      '<ul class="deck-list">' +
      level1.map(function (item) {
        return '<li><a href="' + docLink(item.anchor) + '" target="_blank" rel="noopener">' + item.title + '</a>' +
          '<span class="pg">' + (item.page == null ? '–' : item.page) + '</span></li>';
      }).join('') +
      '</ul>';
    stage.appendChild(s4);

    // 5 收尾
    var s5 = el('section', 'slide');
    s5.innerHTML =
      '<p class="slide__kicker">使用说明</p>' +
      '<h2>本地运行与自定义</h2>' +
      '<p>零依赖 Node.js 服务：<code>node server.js</code>，默认端口 5173。' +
      '数字与章节的映射、热区位置都写在 <code>data/chapters.json</code>，修改后刷新即可。</p>' +
      '<p>原文档保持 gb2312 编码原样输出，因此锚点与 123 MB 图片资源都能正常工作。</p>' +
      '<div class="stats"><span class="stat"><b>node</b>server.js</span><span class="stat"><b>P</b>演示快捷键</span></div>';
    stage.appendChild(s5);

    deck.slides = $$('.slide', stage);

    var dots = $('#deckDots');
    dots.innerHTML = '';
    deck.slides.forEach(function (_, i) {
      var b = el('button', 'deck__dot');
      b.type = 'button';
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 页');
      b.addEventListener('click', function () { showSlide(i); });
      dots.appendChild(b);
    });
    showSlide(0);
  }

  function showSlide(index) {
    if (!deck.slides.length) return;
    deck.index = Math.max(0, Math.min(deck.slides.length - 1, index));
    deck.slides.forEach(function (s, i) { s.classList.toggle('is-active', i === deck.index); });
    $$('#deckDots .deck__dot').forEach(function (d, i) { d.classList.toggle('is-on', i === deck.index); });
    $('#deckCounter').textContent = (deck.index + 1) + ' / ' + deck.slides.length;
    $('.deck__stage').scrollTop = 0;
  }

  function openDeck() {
    buildDeck();
    $('#deck').classList.add('is-open');
    $('#deck').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showSlide(0);
  }

  function closeDeck() {
    $('#deck').classList.remove('is-open');
    $('#deck').setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function bindDeck() {
    $('#presentBtn').addEventListener('click', openDeck);
    $('#deckClose').addEventListener('click', closeDeck);
    $('#deckPrev').addEventListener('click', function () { showSlide(deck.index - 1); });
    $('#deckNext').addEventListener('click', function () { showSlide(deck.index + 1); });

    document.addEventListener('keydown', function (e) {
      var isOpen = $('#deck').classList.contains('is-open');
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '').toUpperCase());

      if (!isOpen) {
        if (!typing && (e.key === 'p' || e.key === 'P')) {
          e.preventDefault();
          openDeck();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          closeDeck();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          showSlide(deck.index + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          showSlide(deck.index - 1);
          break;
        case 'Home':
          e.preventDefault();
          showSlide(0);
          break;
        case 'End':
          e.preventDefault();
          showSlide(deck.slides.length - 1);
          break;
        default:
          break;
      }
    });
  }

  /* ---------- 启动 ---------- */
  function boot(data, toc) {
    state.data = data;
    state.toc = toc;
    data.chapters.forEach(function (ch) { state.chaptersById[ch.id] = ch; });

    renderStats();
    fillHotspots($('#hotspots'));
    renderLegend();
    renderMatrix();
    renderToc();
    bindDeck();

    var toggle = $('#zoneToggle');
    toggle.addEventListener('change', function () {
      $('#mapFrame').classList.toggle('show-zones', toggle.checked);
    });
  }

  Promise.all([
    fetch('/data/chapters.json').then(function (r) { return r.json(); }),
    fetch('/data/toc.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    boot(res[0], res[1]);
  }).catch(function (err) {
    console.error(err);
    toast('数据加载失败，请确认通过 node server.js 访问');
  });
})();
