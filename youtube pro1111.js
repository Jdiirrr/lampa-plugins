/*!
 * YouTube Pro for Lampa  v1.0.0
 * Перегляд YouTube прямо в Lampa: рекомендації, тренди, пошук, канали,
 * плейлисти, історія, збережене. Відтворення — через плеєр, обраний у
 * налаштуваннях Lampa (Lampa.Player.play).
 *
 * Бекенди: Piped та Invidious (публічні інстанси, автопошук + автоперемикання).
 * Код написаний на ES5 для сумісності зі старими Tizen / WebOS.
 */
(function () {
  'use strict';

  if (window.__lampa_yt_pro__) return;
  window.__lampa_yt_pro__ = true;

  // Діагностика: якщо в цьому файлі виникає помилка — показуємо її текст і рядок на екрані
  try {
    window.addEventListener('error', function (e) {
      var f = String((e && e.filename) || '');
      if (/youtube/i.test(f) || /youtube/i.test(String((e && e.message) || ''))) {
        try {
          Lampa.Noty.show('YouTube Pro: ' + (e.message || 'error') + ' (рядок ' + (e.lineno || '?') + ')');
        } catch (x) {}
      }
    });
    window.addEventListener('unhandledrejection', function (e) {
      try { Lampa.Noty.show('YouTube Pro: ' + String((e && e.reason && e.reason.message) || (e && e.reason) || 'promise error')); } catch (x) {}
    });
  } catch (e) {}

  var VERSION = '1.1.1';
  var COMP = 'yt_pro';
  var SET = 'yt_plugin';

  var ICON = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/></svg>';

  /* ======================================================================
   *  i18n
   * ==================================================================== */
  var DICT = {
    uk: {
      recommended: 'Для вас', trending: 'У тренді', music: 'Музика', gaming: 'Ігри',
      news: 'Новини', movies: 'Фільми', history: 'Історія', saved: 'Збережене',
      search: 'Пошук', settings: 'Налаштування',
      new_search: 'Новий пошук…', clear_queries: 'Очистити історію пошуку',
      f_video: 'Відео', f_all: 'Усе', f_channel: 'Канали', f_playlist: 'Плейлисти',
      play: 'Дивитися', open_channel: 'Відкрити канал', related: 'Схожі відео',
      save: 'Зберегти', unsave: 'Прибрати зі збереженого', remove_hist: 'Прибрати з історії',
      copy_link: 'Скопіювати посилання', copied: 'Посилання скопійовано',
      added: 'Збережено', removed: 'Прибрано',
      empty_hist: 'Історія порожня. Відео, які ви подивитесь, з’являться тут.',
      empty_saved: 'Тут поки порожньо. Утримуйте ОК на відео, щоб зберегти його.',
      empty_res: 'Нічого не знайдено',
      err_load: 'Не вдалося завантажити дані: жоден сервер не відповів. Спробуйте ще раз або вкажіть власний сервер у налаштуваннях.',
      err_play: 'Не вдалося отримати потік відео',
      retry: 'Повторити', embedded: 'Вбудований плеєр YouTube', cancel: 'Скасувати',
      views: 'перегл.', live: 'НАЖИВО', subs: 'підписників', videos_n: 'відео',
      ago: 'тому', u_s: 'с', u_m: 'хв', u_h: 'год', u_d: 'дн.', u_w: 'тиж.', u_mo: 'міс.', u_y: 'р.',
      related_to: 'Схожі на', loading: 'Завантаження…',
      s_playback: 'Відтворення', s_player_note: 'Плеєр обирається в Налаштування → Плеєр',
      s_quality: 'Якість відео', s_quality_d: 'Максимальна якість. «Авто» — найкраща стабільна',
      s_q_auto: 'Авто',
      s_dash: 'Адаптивні потоки (DASH/HLS)', s_dash_d: 'Експериментально: вища якість, але підтримує не кожен плеєр',
      s_subs: 'Субтитри', s_subs_d: 'Передавати доступні субтитри у плеєр',
      s_hist_on: 'Зберігати історію', s_hist_on_d: 'Запам’ятовувати переглянуті відео для рекомендацій',
      s_servers: 'Сервери', s_backend: 'Бекенд', s_backend_d: 'Piped та Invidious — публічні проксі YouTube',
      s_b_auto: 'Авто (з перемиканням)', s_custom_piped: 'Свій Piped API', s_custom_inv: 'Свій Invidious',
      s_custom_d: 'Адреса на кшталт https://example.com — перевіряється першою',
      s_refresh: 'Оновити список серверів', s_refresh_d: 'Завантажити актуальні публічні інстанси',
      s_refreshed: 'Список серверів оновлено', s_active: 'Активний сервер', s_none: 'ще не обрано',
      s_content: 'Контент', s_region: 'Регіон трендів', s_region_auto: 'Авто (за мовою)',
      s_clear_hist: 'Очистити історію переглядів', s_clear_saved: 'Очистити збережене', s_done: 'Готово'
    },
    en: {
      recommended: 'For you', trending: 'Trending', music: 'Music', gaming: 'Gaming',
      news: 'News', movies: 'Movies', history: 'History', saved: 'Saved',
      search: 'Search', settings: 'Settings',
      new_search: 'New search…', clear_queries: 'Clear search history',
      f_video: 'Videos', f_all: 'All', f_channel: 'Channels', f_playlist: 'Playlists',
      play: 'Watch', open_channel: 'Open channel', related: 'Related videos',
      save: 'Save', unsave: 'Remove from saved', remove_hist: 'Remove from history',
      copy_link: 'Copy link', copied: 'Link copied',
      added: 'Saved', removed: 'Removed',
      empty_hist: 'No history yet. Videos you watch will show up here.',
      empty_saved: 'Nothing saved yet. Hold OK on a video to save it.',
      empty_res: 'Nothing found',
      err_load: 'Could not load data: no server responded. Try again or set your own server in settings.',
      err_play: 'Could not get the video stream',
      retry: 'Retry', embedded: 'Embedded YouTube player', cancel: 'Cancel',
      views: 'views', live: 'LIVE', subs: 'subscribers', videos_n: 'videos',
      ago: 'ago', u_s: 's', u_m: 'min', u_h: 'h', u_d: 'd', u_w: 'w', u_mo: 'mo', u_y: 'y',
      related_to: 'Related to', loading: 'Loading…',
      s_playback: 'Playback', s_player_note: 'The player is chosen in Settings → Player',
      s_quality: 'Video quality', s_quality_d: 'Maximum quality. “Auto” picks the best stable stream',
      s_q_auto: 'Auto',
      s_dash: 'Adaptive streams (DASH/HLS)', s_dash_d: 'Experimental: higher quality, not every player supports it',
      s_subs: 'Subtitles', s_subs_d: 'Pass available subtitles to the player',
      s_hist_on: 'Save history', s_hist_on_d: 'Remember watched videos to power recommendations',
      s_servers: 'Servers', s_backend: 'Backend', s_backend_d: 'Piped and Invidious are public YouTube proxies',
      s_b_auto: 'Auto (with failover)', s_custom_piped: 'Custom Piped API', s_custom_inv: 'Custom Invidious',
      s_custom_d: 'An address like https://example.com — it is tried first',
      s_refresh: 'Refresh server list', s_refresh_d: 'Download current public instances',
      s_refreshed: 'Server list updated', s_active: 'Active server', s_none: 'not chosen yet',
      s_content: 'Content', s_region: 'Trending region', s_region_auto: 'Auto (by language)',
      s_clear_hist: 'Clear watch history', s_clear_saved: 'Clear saved videos', s_done: 'Done'
    }
  };

  function lang() {
    return String(Lampa.Storage.get('language', 'en') || 'en');
  }

  function L(key) {
    var d = DICT[lang()] || DICT.en;
    return d[key] || DICT.en[key] || key;
  }

  /* ======================================================================
   *  Helpers
   * ==================================================================== */
  function cfg(name, def) {
    var v = Lampa.Storage.get(name, def);
    return (v === undefined || v === null || v === '') ? def : v;
  }

  function flag(name, def) {
    var v = Lampa.Storage.get(name, def);
    return v === true || v === 'true';
  }

  function arr(name) {
    var v = Lampa.Storage.get(name, []);
    return Object.prototype.toString.call(v) === '[object Array]' ? v : [];
  }

  function enc(s) { return encodeURIComponent(s); }

  function noty(text) { try { Lampa.Noty.show(text); } catch (e) {} }

  function thumbUrl(id, q) { return 'https://i.ytimg.com/vi/' + id + '/' + (q || 'mqdefault') + '.jpg'; }

  function absUrl(u, base) {
    if (!u) return '';
    if (u.indexOf('//') === 0) return 'https:' + u;
    if (u.charAt(0) === '/') return (base || '') + u;
    return u;
  }

  function fmtNum(n) {
    n = Number(n);
    if (!(n >= 0)) return '';
    var uk = lang() === 'uk';
    var units = uk ? ['', 'тис.', 'млн', 'млрд'] : ['', 'K', 'M', 'B'];
    var i = 0;
    while (n >= 1000 && i < 3) { n /= 1000; i++; }
    var s = i ? (n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10)) : String(Math.round(n));
    if (uk) s = s.replace('.', ',');
    return s + (units[i] ? (uk ? ' ' : '') + units[i] : '');
  }

  function fmtDur(sec) {
    sec = Math.floor(Number(sec) || 0);
    if (sec <= 0) return '';
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    function p(x) { return x < 10 ? '0' + x : String(x); }
    return h ? h + ':' + p(m) + ':' + p(s) : m + ':' + p(s);
  }

  function ago(ts) {
    if (!ts || ts < 1e11) return '';
    var d = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    var n, u;
    if (d < 60) { n = d; u = 'u_s'; }
    else if (d < 3600) { n = Math.floor(d / 60); u = 'u_m'; }
    else if (d < 86400) { n = Math.floor(d / 3600); u = 'u_h'; }
    else if (d < 604800) { n = Math.floor(d / 86400); u = 'u_d'; }
    else if (d < 2592000) { n = Math.floor(d / 604800); u = 'u_w'; }
    else if (d < 31536000) { n = Math.floor(d / 2592000); u = 'u_mo'; }
    else { n = Math.floor(d / 31536000); u = 'u_y'; }
    return n + ' ' + L(u) + ' ' + L('ago');
  }

  function region() {
    var r = cfg('yt_region', 'auto');
    if (r && r !== 'auto') return r;
    return ({ uk: 'UA', pl: 'PL', de: 'DE', tr: 'TR' })[lang()] || 'US';
  }

  function chanId(u) {
    var m = String(u || '').match(/\/channel\/([\w-]+)/);
    return m ? m[1] : '';
  }

  /* ======================================================================
   *  Нормалізація відповідей Piped / Invidious
   * ==================================================================== */
  function fromPiped(it) {
    if (!it) return null;
    var url = it.url || '';
    var type = it.type || (url.indexOf('/channel/') === 0 ? 'channel' : (url.indexOf('/playlist') === 0 ? 'playlist' : 'stream'));

    if (type === 'stream') {
      var m = url.match(/[?&]v=([\w-]{6,})/);
      if (!m) return null;
      return {
        kind: 'video', id: m[1], title: it.title || '',
        channel: it.uploaderName || '', channelId: chanId(it.uploaderUrl), avatar: it.uploaderAvatar || '',
        duration: it.duration > 0 ? it.duration : 0,
        views: it.views >= 0 ? it.views : null,
        ts: it.uploaded > 0 ? it.uploaded : 0,
        live: it.duration === -1
      };
    }
    if (type === 'channel') {
      var cid = chanId(url);
      if (!cid) return null;
      return { kind: 'channel', id: cid, title: it.name || '', avatar: it.thumbnail || '', sub: it.subscribers };
    }
    if (type === 'playlist') {
      var pm = url.match(/list=([\w-]+)/);
      if (!pm) return null;
      return { kind: 'playlist', id: pm[1], title: it.name || '', thumb: it.thumbnail || '', count: it.videos, channel: it.uploaderName || '' };
    }
    return null;
  }

  function fromInv(it, base) {
    if (!it) return null;
    var type = it.type || 'video';
    if (type === 'video' || type === 'shortVideo') {
      if (!it.videoId) return null;
      return {
        kind: 'video', id: it.videoId, title: it.title || '',
        channel: it.author || '', channelId: it.authorId || '', avatar: '',
        duration: it.lengthSeconds || 0,
        views: typeof it.viewCount === 'number' ? it.viewCount : null,
        ts: it.published ? it.published * 1000 : 0,
        live: !!it.liveNow
      };
    }
    if (type === 'channel') {
      var th = (it.authorThumbnails || []);
      th = th.length ? th[th.length - 1] : null;
      return { kind: 'channel', id: it.authorId, title: it.author || '', avatar: th ? absUrl(th.url, base) : '', sub: it.subCount };
    }
    if (type === 'playlist') {
      var v0 = it.videos && it.videos[0] ? it.videos[0].videoId : '';
      return { kind: 'playlist', id: it.playlistId, title: it.title || '', thumb: v0 ? thumbUrl(v0) : '', count: it.videoCount, channel: it.author || '' };
    }
    return null;
  }

  function mapPiped(list) {
    var out = [];
    if (Object.prototype.toString.call(list) !== '[object Array]') return out;
    for (var i = 0; i < list.length; i++) { var x = fromPiped(list[i]); if (x) out.push(x); }
    return out;
  }

  function mapInv(list, base) {
    var out = [];
    if (Object.prototype.toString.call(list) !== '[object Array]') return out;
    for (var i = 0; i < list.length; i++) { var x = fromInv(list[i], base); if (x) out.push(x); }
    return out;
  }

  function nextTok(t) { return (t && t !== 'null') ? t : null; }

  /* ======================================================================
   *  HTTP
   * ==================================================================== */
  function http(url, ok, fail, timeout) {
    var net = new Lampa.Reguest();
    var done = false;
    net.silent(url, function (data) {
      if (done) return;
      done = true;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return fail('bad_json'); } }
      if (data === null || data === undefined) return fail('empty');
      ok(data);
    }, function (a, b) {
      if (done) return;
      done = true;
      fail(b || a || 'error');
    }, false, { timeout: timeout || 12000, dataType: 'json' });
    return net;
  }

  /* ======================================================================
   *  Сервери (Piped / Invidious) з автоперемиканням
   * ==================================================================== */
  var Inst = {
    seeds: {
      piped: ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de', 'https://api.piped.private.coffee'],
      invidious: ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.nerdvpn.de']
    },
    bad: {},

    pool: function (type) {
      var c = Lampa.Storage.get('yt_inst_cache', '');
      var found = (c && c[type]) ? c[type] : [];
      return found.concat(Inst.seeds[type]);
    },

    candidates: function (pin, retried) {
      if (pin) return [pin];
      var mode = cfg('yt_backend', 'auto');
      var out = [], seen = {};

      function add(type, base) {
        if (!base) return;
        base = String(base).replace(/\/+$/, '');
        if (!/^https?:\/\//.test(base)) return;
        var k = type + base;
        if (seen[k]) return;
        seen[k] = 1;
        if (Inst.bad[k] && Inst.bad[k] > Date.now()) return;
        out.push({ type: type, base: base });
      }

      if (mode !== 'invidious') add('piped', cfg('yt_custom_piped', ''));
      if (mode !== 'piped') add('invidious', cfg('yt_custom_inv', ''));

      var last = Lampa.Storage.get('yt_last_ok', '');
      if (last && last.base && (mode === 'auto' || mode === last.type)) add(last.type, last.base);

      var p = mode === 'invidious' ? [] : Inst.pool('piped');
      var v = mode === 'piped' ? [] : Inst.pool('invidious');
      var n = Math.max(p.length, v.length);
      for (var i = 0; i < n; i++) {
        if (p[i]) add('piped', p[i]);
        if (v[i]) add('invidious', v[i]);
      }

      if (!out.length && !retried) { Inst.bad = {}; return Inst.candidates(null, true); }
      return out;
    },

    mark: function (c, ok) {
      var k = c.type + c.base;
      if (ok) {
        Inst.bad[k] = 0;
        var last = Lampa.Storage.get('yt_last_ok', '');
        if (!last || last.base !== c.base) Lampa.Storage.set('yt_last_ok', { type: c.type, base: c.base });
      } else {
        Inst.bad[k] = Date.now() + 5 * 60 * 1000;
      }
    },

    refresh: function (force, cb) {
      var c = Lampa.Storage.get('yt_inst_cache', '') || {};
      if (!force && c.t && Date.now() - c.t < 12 * 3600 * 1000 && c.piped && c.piped.length) {
        if (cb) cb(c);
        return;
      }
      var res = { t: Date.now(), piped: [], invidious: [] };
      var left = 2;

      function fin() {
        left--;
        if (left) return;
        if (res.piped.length || res.invidious.length) Lampa.Storage.set('yt_inst_cache', res);
        if (cb) cb(res);
      }

      http('https://piped-instances.kavin.rocks/', function (d) {
        try {
          for (var i = 0; i < d.length && res.piped.length < 12; i++) {
            if (d[i] && d[i].api_url && d[i].up_to_date !== false) res.piped.push(d[i].api_url);
          }
        } catch (e) {}
        fin();
      }, fin, 8000);

      http('https://api.invidious.io/instances.json?sort_by=health', function (d) {
        try {
          for (var i = 0; i < d.length && res.invidious.length < 12; i++) {
            var o = d[i] && d[i][1];
            if (o && o.api === true && o.type === 'https' && o.uri) res.invidious.push(o.uri);
          }
        } catch (e) {}
        fin();
      }, fin, 8000);
    }
  };

  /* ======================================================================
   *  API
   * ==================================================================== */
  var CATS = {
    music: { inv: 'Music', q: 'music' },
    gaming: { inv: 'Gaming', q: 'gaming' },
    news: { inv: 'News', q: 'news' },
    movies: { inv: 'Movies', q: 'movie trailers' }
  };

  var Api = {
    infoCache: {},

    /** build = { piped: fn(base)->{path,parse}, invidious: fn(base)->{path,parse} } */
    run: function (build, cb, pin) {
      var cands = Inst.candidates(pin);
      var i = 0, lastErr = 'no_servers';

      (function next() {
        if (i >= cands.length || i >= 6) return cb(lastErr);
        var c = cands[i++];
        var mk = build[c.type];
        if (!mk) return next();
        var spec = mk(c.base);

        http(c.base + spec.path, function (data) {
          var res;
          try { res = spec.parse(data, c.base); } catch (e) { res = null; lastErr = 'parse'; }
          if (!res) { Inst.mark(c, false); return next(); }
          Inst.mark(c, true);
          res.src = c;
          cb(null, res);
        }, function (e) {
          lastErr = e;
          Inst.mark(c, false);
          next();
        }, 10000);
      })();
    },

    trending: function (reg, cb) {
      Api.run({
        piped: function () {
          return { path: '/trending?region=' + reg, parse: function (d) { return { items: mapPiped(d), next: null }; } };
        },
        invidious: function (base) {
          return {
            path: '/api/v1/trending?region=' + reg,
            parse: function (d) { var it = mapInv(d, base); return it.length ? { items: it, next: null } : null; }
          };
        }
      }, cb);
    },

    category: function (key, reg, cb) {
      var cat = CATS[key];
      if (!cat) return Api.trending(reg, cb);
      Api.run({
        piped: function () {
          return {
            path: '/search?q=' + enc(cat.q) + '&filter=videos',
            parse: function (d) { return { items: mapPiped(d.items), next: null }; }
          };
        },
        invidious: function (base) {
          return {
            path: '/api/v1/trending?type=' + cat.inv + '&region=' + reg,
            parse: function (d) { var it = mapInv(d, base); return it.length ? { items: it, next: null } : null; }
          };
        }
      }, cb);
    },

    search: function (q, f, token, pin, cb) {
      var pf = ({ all: 'all', video: 'videos', channel: 'channels', playlist: 'playlists' })[f] || 'videos';
      var page = token || 1;
      Api.run({
        piped: function () {
          return {
            path: token
              ? '/nextpage/search?nextpage=' + enc(token) + '&q=' + enc(q) + '&filter=' + pf
              : '/search?q=' + enc(q) + '&filter=' + pf,
            parse: function (d) { return { items: mapPiped(d.items), next: nextTok(d.nextpage) }; }
          };
        },
        invidious: function (base) {
          return {
            path: '/api/v1/search?q=' + enc(q) + '&page=' + page + '&type=' + (f || 'video'),
            parse: function (d) { var it = mapInv(d, base); return { items: it, next: it.length ? page + 1 : null }; }
          };
        }
      }, cb, token ? pin : null);
    },

    channel: function (id, token, pin, cb) {
      Api.run({
        piped: function () {
          return {
            path: token ? '/nextpage/channel/' + id + '?nextpage=' + enc(token) : '/channel/' + id,
            parse: function (d) {
              return {
                items: mapPiped(d.relatedStreams),
                next: nextTok(d.nextpage),
                meta: d.name ? { title: d.name, avatar: d.avatarUrl, sub: d.subscriberCount } : null
              };
            }
          };
        },
        invidious: function (base) {
          return {
            path: '/api/v1/channels/' + id + '/videos' + (token ? '?continuation=' + enc(token) : ''),
            parse: function (d) { return { items: mapInv(d.videos, base), next: d.continuation || null }; }
          };
        }
      }, cb, token ? pin : null);
    },

    playlist: function (id, token, pin, cb) {
      var page = token || 1;
      Api.run({
        piped: function () {
          return {
            path: token ? '/nextpage/playlists/' + id + '?nextpage=' + enc(token) : '/playlists/' + id,
            parse: function (d) {
              return {
                items: mapPiped(d.relatedStreams),
                next: nextTok(d.nextpage),
                meta: d.name ? { title: d.name, avatar: d.thumbnailUrl, count: d.videos } : null
              };
            }
          };
        },
        invidious: function (base) {
          return {
            path: '/api/v1/playlists/' + id + '?page=' + page,
            parse: function (d) {
              var it = mapInv(d.videos, base);
              return {
                items: it, next: it.length >= 100 ? page + 1 : null,
                meta: d.title ? { title: d.title, count: d.videoCount } : null
              };
            }
          };
        }
      }, cb, token ? pin : null);
    },

    /** Повна інформація про відео + потоки (кеш 5 хв) */
    info: function (id, cb) {
      var hit = Api.infoCache[id];
      if (hit && Date.now() - hit.t < 5 * 60 * 1000) return cb(null, hit.info);

      Api.run({
        piped: function (base) {
          return {
            path: '/streams/' + id,
            parse: function (d) {
              if (!d || d.error || !d.title) return null;
              var mux = [], i, s;
              var vs = d.videoStreams || [];
              for (i = 0; i < vs.length; i++) {
                s = vs[i];
                if (s.videoOnly || !s.url) continue;
                mux.push({ q: parseInt(s.quality, 10) || 0, label: s.quality || '', url: s.url, mime: s.mimeType || '' });
              }
              var mp4 = mux.filter(function (x) { return x.mime.indexOf('mp4') > -1; });
              if (mp4.length) mux = mp4;

              var subs = [], cs = d.subtitles || [];
              for (i = 0; i < cs.length && subs.length < 10; i++) {
                if (cs[i].url) subs.push({ label: cs[i].name || cs[i].code || 'Sub', url: cs[i].url });
              }
              return {
                id: id, title: d.title, channel: d.uploader, avatar: d.uploaderAvatar,
                live: !!d.livestream, hls: d.hls || '', dash: d.dash || '',
                streams: mux, subs: subs, related: mapPiped(d.relatedStreams)
              };
            }
          };
        },
        invidious: function (base) {
          return {
            path: '/api/v1/videos/' + id + '?local=true',
            parse: function (d) {
              if (!d || d.error || !d.title) return null;
              var mux = [], i, s;
              var fs = d.formatStreams || [];
              for (i = 0; i < fs.length; i++) {
                s = fs[i];
                if (!s.url) continue;
                mux.push({
                  q: parseInt(s.qualityLabel || s.quality, 10) || 0,
                  label: s.qualityLabel || s.quality || '',
                  url: absUrl(s.url, base), mime: s.type || ''
                });
              }
              var mp4 = mux.filter(function (x) { return x.mime.indexOf('mp4') > -1; });
              if (mp4.length) mux = mp4;

              var subs = [], cs = d.captions || [];
              for (i = 0; i < cs.length && subs.length < 10; i++) {
                if (cs[i].url) subs.push({ label: cs[i].label || cs[i].language_code || 'Sub', url: absUrl(cs[i].url, base) });
              }
              return {
                id: id, title: d.title, channel: d.author, avatar: '',
                live: !!d.liveNow, hls: absUrl(d.hlsUrl || '', base), dash: absUrl(d.dashUrl || '', base),
                streams: mux, subs: subs, related: mapInv(d.recommendedVideos, base)
              };
            }
          };
        }
      }, function (err, res) {
        if (err || !res) return cb(err || 'fail');
        Api.infoCache[id] = { t: Date.now(), info: res };
        cb(null, res);
      });
    }
  };

  /* ======================================================================
   *  Історія / збережене / пошукові запити
   * ==================================================================== */
  function slim(v) {
    return {
      kind: 'video', id: v.id, title: v.title, channel: v.channel, channelId: v.channelId,
      avatar: v.avatar || '', duration: v.duration || 0, views: v.views, ts: v.ts || 0, live: !!v.live
    };
  }

  function listAdd(name, v, max) {
    var list = arr(name).filter(function (x) { return x.id !== v.id; });
    list.unshift(slim(v));
    Lampa.Storage.set(name, list.slice(0, max));
  }

  function listRemove(name, id) {
    Lampa.Storage.set(name, arr(name).filter(function (x) { return x.id !== id; }));
  }

  function listHas(name, id) {
    var l = arr(name);
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return true;
    return false;
  }

  function rememberQuery(q) {
    var l = arr('yt_queries').filter(function (x) { return x !== q; });
    l.unshift(q);
    Lampa.Storage.set('yt_queries', l.slice(0, 15));
  }

  /* ======================================================================
   *  Рекомендації (на основі історії + тренди)
   * ==================================================================== */
  function buildRecommended(cb) {
    var hist = arr('yt_hist');
    if (!hist.length) return Api.trending(region(), cb);

    var seeds = hist.slice(0, 3);
    var watched = {};
    hist.forEach(function (h) { watched[h.id] = 1; });
    var lists = [], left = seeds.length;

    function finish() {
      var out = [], used = {}, i = 0, more = true;
      while (more) {
        more = false;
        for (var k = 0; k < lists.length; k++) {
          var it = lists[k][i];
          if (it) {
            more = true;
            if (it.kind === 'video' && !watched[it.id] && !used[it.id]) { used[it.id] = 1; out.push(it); }
          }
        }
        i++;
      }
      if (out.length >= 20) return cb(null, { items: out, next: null });

      Api.trending(region(), function (err, res) {
        if (res && res.items) {
          res.items.forEach(function (t) { if (!used[t.id] && !watched[t.id]) { used[t.id] = 1; out.push(t); } });
        }
        if (!out.length) return cb(err || 'empty');
        cb(null, { items: out, next: null, src: res && res.src });
      });
    }

    seeds.forEach(function (s, idx) {
      Api.info(s.id, function (err, info) {
        lists[idx] = (!err && info) ? info.related : [];
        left--;
        if (!left) finish();
      });
    });
  }

  /* ======================================================================
   *  Відтворення (через Lampa.Player → плеєр з налаштувань Lampa)
   * ==================================================================== */
  function loadingStart(onCancel) {
    try { if (Lampa.Loading && Lampa.Loading.start) return Lampa.Loading.start(onCancel); } catch (e) {}
    noty(L('loading'));
  }

  function loadingStop() {
    try { if (Lampa.Loading && Lampa.Loading.stop) Lampa.Loading.stop(); } catch (e) {}
  }

  function pickPlayData(v, info) {
    var wanted = parseInt(cfg('yt_quality', '0'), 10) || 0;
    var useAdaptive = flag('yt_dash', false);

    var list = info.streams.slice().sort(function (a, b) { return b.q - a.q; });
    var maxMux = list.length ? list[0].q : 0;
    var map = {};
    var i;

    if (info.live) {
      var liveUrl = info.hls || (list[0] && list[0].url) || '';
      if (!liveUrl) return null;
      map['LIVE'] = liveUrl;
      return { url: liveUrl, quality: map };
    }

    for (i = 0; i < list.length; i++) {
      var lab = list[i].label || (list[i].q + 'p');
      if (!map[lab]) map[lab] = list[i].url;
    }
    if (useAdaptive && info.hls) map['HLS'] = info.hls;
    if (useAdaptive && info.dash) map['DASH'] = info.dash;

    var url = '';
    if (wanted && useAdaptive && wanted > maxMux && (info.hls || info.dash)) {
      url = info.hls || info.dash;
    } else if (list.length) {
      var best = list[0];
      if (wanted) {
        for (i = 0; i < list.length; i++) { if (list[i].q <= wanted) { best = list[i]; break; } best = list[i]; }
      }
      url = best.url;
    } else if (info.hls) {
      url = info.hls;
      map['HLS'] = info.hls;
    } else if (useAdaptive && info.dash) {
      url = info.dash;
    }

    if (!url) return null;
    return { url: url, quality: map };
  }

  function playVideo(v) {
    var cancelled = false;
    loadingStart(function () { cancelled = true; });

    Api.info(v.id, function (err, info) {
      loadingStop();
      if (cancelled) return;
      if (err || !info) return playFailed(v);

      var pd = pickPlayData(v, info);
      if (!pd) return playFailed(v);

      var data = {
        url: pd.url,
        title: info.title || v.title,
        quality: pd.quality
      };

      if (flag('yt_subs', true) && info.subs && info.subs.length) data.subtitles = info.subs;

      if (!info.live) {
        try {
          var hash = Lampa.Utils.hash('yt:' + v.id);
          data.timeline = Lampa.Timeline.view(hash);
        } catch (e) {}
      }

      if (flag('yt_hist_on', true)) {
        listAdd('yt_hist', {
          id: v.id, title: info.title || v.title, channel: info.channel || v.channel,
          channelId: v.channelId, avatar: info.avatar || v.avatar, duration: v.duration,
          views: v.views, ts: v.ts, live: info.live
        }, 100);
      }

      Lampa.Player.play(data);
      try { Lampa.Player.playlist([data]); } catch (e) {}
    });
  }

  function playFailed(v) {
    var items = [{ title: L('retry'), value: 'retry' }];
    if (Lampa.YouTube && Lampa.YouTube.play) items.push({ title: L('embedded'), value: 'embed' });
    items.push({ title: L('cancel'), value: 'cancel' });

    Lampa.Select.show({
      title: L('err_play'),
      items: items,
      onBack: function () { Lampa.Controller.toggle('content'); },
      onSelect: function (a) {
        Lampa.Controller.toggle('content');
        if (a.value === 'retry') { delete Api.infoCache[v.id]; playVideo(v); }
        if (a.value === 'embed') { try { Lampa.YouTube.play(v.id); } catch (e) {} }
      }
    });
  }

  /* ======================================================================
   *  Навігація
   * ==================================================================== */
  function go(params, replace) {
    params = $.extend({ url: '', component: COMP, page: 1 }, params);
    if (replace && Lampa.Activity.replace) Lampa.Activity.replace(params);
    else Lampa.Activity.push(params);
  }

  function openItem(v) {
    if (v.kind === 'channel') return go({ title: v.title, mode: 'channel', id: v.id, avatar: v.avatar, name: v.title });
    if (v.kind === 'playlist') return go({ title: v.title, mode: 'playlist', id: v.id, name: v.title });
    playVideo(v);
  }

  function openSettings() {
    try {
      Lampa.Settings.create(SET, { onBack: function () { Lampa.Controller.toggle('content'); } });
    } catch (e) {
      noty('Lampa → ' + L('settings') + ' → YouTube');
    }
  }

  function openSearch() {
    var hist = arr('yt_queries');
    var items = [{ title: L('new_search'), value: '__new' }];
    hist.forEach(function (q) { items.push({ title: q, value: q }); });
    if (hist.length) items.push({ title: L('clear_queries'), value: '__clear' });

    Lampa.Select.show({
      title: L('search'),
      items: items,
      onBack: function () { Lampa.Controller.toggle('content'); },
      onSelect: function (a) {
        if (a.value === '__clear') {
          Lampa.Storage.set('yt_queries', []);
          Lampa.Controller.toggle('content');
        } else if (a.value === '__new') {
          Lampa.Input.edit({ free: true, title: L('search'), nosave: true, value: '' }, function (val) {
            Lampa.Controller.toggle('content');
            val = String(val || '').trim();
            if (val) startSearch(val);
          });
        } else {
          Lampa.Controller.toggle('content');
          startSearch(a.value);
        }
      }
    });
  }

  function startSearch(q) {
    rememberQuery(q);
    go({ title: q, mode: 'search', q: q, filter: 'video' });
  }

  /* ======================================================================
   *  Компонент стрічки
   * ==================================================================== */
  var NAV = ['search', 'recommended', 'trending', 'music', 'gaming', 'news', 'movies', 'history', 'saved', 'settings'];

  function Feed(object) {
    var self = this;
    var alive = true;
    var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
    var html = $('<div class="yt-root"></div>');
    var bar = $('<div class="yt-bar"></div>');
    var sub = $('<div class="yt-bar yt-bar--sub"></div>');
    var head = $('<div class="yt-head"></div>');
    var grid = $('<div class="yt-grid"></div>');
    var more = $('<div class="yt-more"></div>').text(L('loading'));
    var last = null;
    var firstCard = null;
    var state = { next: null, src: null, loading: false, ended: false, count: 0, seen: {}, meta: null };

    var mode = object.mode || 'recommended';

    function activeNav() {
      if (mode === 'category') return object.cat;
      return mode;
    }

    function chip(label, active, onEnter) {
      var el = $('<div class="yt-chip selector"></div>').text(label);
      if (active) el.addClass('yt-chip--active');
      el.on('hover:focus', function () { last = el[0]; scroll.update(el, true); });
      el.on('hover:enter', onEnter);
      return el;
    }

    function buildBar() {
      var act = activeNav();
      NAV.forEach(function (id) {
        bar.append(chip(L(id), id === act, function () { onNav(id); }));
      });
      if (mode === 'search') {
        [['video', 'f_video'], ['all', 'f_all'], ['channel', 'f_channel'], ['playlist', 'f_playlist']].forEach(function (f) {
          sub.append(chip(L(f[1]), (object.filter || 'video') === f[0], function () {
            if ((object.filter || 'video') === f[0]) return;
            go({ title: object.q, mode: 'search', q: object.q, filter: f[0] }, true);
          }));
        });
      }
    }

    function onNav(id) {
      if (id === 'search') return openSearch();
      if (id === 'settings') return openSettings();
      if (id === activeNav()) return;
      if (CATS[id]) return go({ title: L(id), mode: 'category', cat: id }, true);
      go({ title: L(id), mode: id }, true);
    }

    function buildHead() {
      head.empty();
      var title = '', subtitle = '', avatar = '';
      var m = state.meta || {};

      if (mode === 'channel') {
        title = m.title || object.name || object.title;
        avatar = m.avatar || object.avatar;
        if (m.sub >= 0 && m.sub !== undefined) subtitle = fmtNum(m.sub) + ' ' + L('subs');
      } else if (mode === 'playlist') {
        title = m.title || object.name || object.title;
        if (m.count >= 0 && m.count !== undefined) subtitle = m.count + ' ' + L('videos_n');
      } else if (mode === 'search') {
        title = '«' + object.q + '»';
      } else if (mode === 'related') {
        title = L('related_to') + ' ' + (object.name || '');
      } else {
        return;
      }

      if (mode === 'channel') {
        var av = $('<div class="yt-head__ava"></div>').text(String(title || '?').charAt(0).toUpperCase());
        if (avatar) {
          var im = new Image();
          im.onload = function () { av.empty().append(im); };
          im.src = avatar;
        }
        head.append(av);
      }
      var tx = $('<div class="yt-head__txt"></div>');
      tx.append($('<div class="yt-head__title"></div>').text(title));
      if (subtitle) tx.append($('<div class="yt-head__sub"></div>').text(subtitle));
      head.append(tx);
    }

    /* ---------- картки ---------- */
    function makeCard(v) {
      var el;

      if (v.kind === 'channel') {
        el = $('<div class="yt-card yt-card--channel selector"><div class="yt-chava"></div><div class="yt-chname"></div><div class="yt-sub"></div></div>');
        el.find('.yt-chname').text(v.title);
        if (v.sub >= 0 && v.sub !== undefined) el.find('.yt-sub').text(fmtNum(v.sub) + ' ' + L('subs'));
        var cav = el.find('.yt-chava').text(String(v.title || '?').charAt(0).toUpperCase());
        if (v.avatar) {
          var cim = new Image();
          cim.onload = function () { cav.empty().append(cim); };
          cim.src = v.avatar;
        }
        return el;
      }

      el = $('<div class="yt-card yt-card--video selector">' +
        '<div class="yt-thumb"><img class="yt-img" alt=""><div class="yt-badges"></div><div class="yt-prog"><i></i></div></div>' +
        '<div class="yt-meta"><div class="yt-ava"></div><div class="yt-info"><div class="yt-title"></div><div class="yt-sub yt-sub--ch"></div><div class="yt-sub yt-sub--st"></div></div></div>' +
        '</div>');

      var img = el.find('.yt-img')[0];
      var tries = 0;
      img.onerror = function () {
        tries++;
        if (v.kind === 'video' && tries === 1) this.src = thumbUrl(v.id, 'hqdefault');
        else $(this).hide();
      };
      img.src = v.kind === 'playlist' ? (v.thumb || '') : thumbUrl(v.id);

      var badges = el.find('.yt-badges');
      if (v.kind === 'playlist') {
        badges.append($('<span class="yt-badge"></span>').text((v.count >= 0 && v.count !== undefined ? v.count + ' ' : '') + L('videos_n')));
      } else if (v.live) {
        badges.append($('<span class="yt-badge yt-badge--live"></span>').text(L('live')));
      } else if (v.duration) {
        badges.append($('<span class="yt-badge"></span>').text(fmtDur(v.duration)));
      }

      if (v.kind === 'video' && !v.live) {
        try {
          var tl = Lampa.Timeline.view(Lampa.Utils.hash('yt:' + v.id));
          if (tl && tl.percent > 0) el.find('.yt-prog').show().find('i').css('width', Math.min(100, tl.percent) + '%');
        } catch (e) {}
      }

      el.find('.yt-title').text(v.title);
      el.find('.yt-sub--ch').text(v.channel || '');

      var stats = [];
      if (v.kind === 'video') {
        if (v.views !== null && v.views !== undefined) stats.push(fmtNum(v.views) + ' ' + L('views'));
        var a = ago(v.ts);
        if (a) stats.push(a);
      }
      el.find('.yt-sub--st').text(stats.join('  ·  '));

      var ava = el.find('.yt-ava').text(String(v.channel || '?').charAt(0).toUpperCase());
      if (v.avatar && v.kind === 'video') {
        var aim = new Image();
        aim.onload = function () { ava.empty().append(aim); };
        aim.src = v.avatar;
      }
      return el;
    }

    function addItems(items) {
      var added = [];
      items.forEach(function (v) {
        var idx = state.count++;
        var card = makeCard(v);

        card.on('hover:focus', function () {
          last = card[0];
          scroll.update(card, true);
          if (!state.ended && !state.loading && idx >= state.count - 6) loadMore();
        });
        card.on('hover:enter', function () { openItem(v); });
        card.on('hover:long', function () { itemMenu(v); });

        if (!firstCard) firstCard = card[0];
        grid.append(card);
        added.push(card);
      });

      try {
        if (Lampa.Activity.active().activity === self.activity && Lampa.Controller.enabled().name === 'content') {
          added.forEach(function (c) { Lampa.Controller.collectionAppend(c); });
        }
      } catch (e) {}
    }

    function itemMenu(v) {
      if (v.kind !== 'video') return openItem(v);

      var items = [{ title: L('play'), value: 'play' }];
      if (v.channelId) items.push({ title: L('open_channel'), value: 'channel' });
      items.push({ title: L('related'), value: 'related' });
      items.push(listHas('yt_saved', v.id) ? { title: L('unsave'), value: 'unsave' } : { title: L('save'), value: 'save' });
      if (mode === 'history') items.push({ title: L('remove_hist'), value: 'rm_hist' });
      items.push({ title: L('copy_link'), value: 'copy' });

      Lampa.Select.show({
        title: v.title,
        items: items,
        onBack: function () { Lampa.Controller.toggle('content'); },
        onSelect: function (a) {
          Lampa.Controller.toggle('content');
          switch (a.value) {
            case 'play': playVideo(v); break;
            case 'channel': go({ title: v.channel, mode: 'channel', id: v.channelId, avatar: v.avatar, name: v.channel }); break;
            case 'related': go({ title: v.title, mode: 'related', id: v.id, name: v.title }); break;
            case 'save': listAdd('yt_saved', v, 200); noty(L('added')); break;
            case 'unsave':
              listRemove('yt_saved', v.id);
              noty(L('removed'));
              if (mode === 'saved') go({ title: L('saved'), mode: 'saved' }, true);
              break;
            case 'rm_hist':
              listRemove('yt_hist', v.id);
              noty(L('removed'));
              go({ title: L('history'), mode: 'history' }, true);
              break;
            case 'copy':
              try {
                Lampa.Utils.copyTextToClipboard('https://www.youtube.com/watch?v=' + v.id, function () { noty(L('copied')); }, function () {});
              } catch (e) {}
              break;
          }
        }
      });
    }

    /* ---------- завантаження ---------- */
    function fetchPage(cb) {
      var pin = state.next ? state.src : null;
      var local;
      switch (mode) {
        case 'recommended': return buildRecommended(cb);
        case 'trending': return Api.trending(region(), cb);
        case 'category': return Api.category(object.cat, region(), cb);
        case 'search': return Api.search(object.q, object.filter || 'video', state.next, pin, cb);
        case 'channel': return Api.channel(object.id, state.next, pin, cb);
        case 'playlist': return Api.playlist(object.id, state.next, pin, cb);
        case 'related':
          return Api.info(object.id, function (e, i) { cb(e, i ? { items: i.related, next: null } : null); });
        case 'history':
        case 'saved':
          local = arr(mode === 'history' ? 'yt_hist' : 'yt_saved');
          return cb(null, { items: local, next: null });
      }
      cb('mode');
    }

    function showMessage(text, withRetry) {
      var box = $('<div class="yt-empty"></div>');
      box.append($('<div class="yt-empty__txt"></div>').text(text));
      if (withRetry) {
        var row = $('<div class="yt-empty__act"></div>');
        row.append(chip(L('retry'), false, function () { go($.extend({}, object, { page: 1 }), true); }));
        row.append(chip(L('settings'), false, openSettings));
        box.append(row);
      }
      grid.append(box);
    }

    function load(first) {
      if (state.loading || state.ended) return;
      state.loading = true;
      if (!first) grid.after(more.show());

      fetchPage(function (err, res) {
        if (!alive) return;
        state.loading = false;
        more.detach();

        if (err || !res) {
          if (first) {
            showMessage(L('err_load'), true);
            self.activity.loader(false);
            self.activity.toggle();
          } else {
            state.ended = true;
            noty(L('err_load'));
          }
          return;
        }

        state.src = res.src || state.src;
        state.next = res.next || null;
        if (!state.next) state.ended = true;

        if (res.meta) { state.meta = res.meta; buildHead(); }

        var fresh = [];
        (res.items || []).forEach(function (v) {
          var key = v.kind + ':' + v.id;
          if (!v.id || state.seen[key]) return;
          state.seen[key] = 1;
          if (mode === 'channel') {
            if (!v.channel) v.channel = (state.meta && state.meta.title) || object.name || '';
            if (!v.avatar) v.avatar = (state.meta && state.meta.avatar) || object.avatar || '';
          }
          fresh.push(v);
        });

        if (first && !fresh.length) {
          showMessage(mode === 'history' ? L('empty_hist') : (mode === 'saved' ? L('empty_saved') : L('empty_res')), false);
        } else {
          addItems(fresh);
        }

        if (first) {
          if (!last && firstCard) last = firstCard;
          self.activity.loader(false);
          self.activity.toggle();
        }

        if (!state.ended && state.count < 16) loadMore();
      });
    }

    function loadMore() { load(false); }

    /* ---------- життєвий цикл компонента ---------- */
    this.create = function () {
      if (scroll.minus) scroll.minus();
      scroll.append(bar);
      if (mode === 'search') scroll.append(sub);
      scroll.append(head);
      scroll.append(grid);
      html.append(scroll.render());

      buildBar();
      buildHead();

      this.activity.loader(true);
      load(true);
      return this.render();
    };

    this.render = function () { return html; };

    this.start = function () {
      if (Lampa.Activity.active().activity !== this.activity) return;

      Lampa.Controller.add('content', {
        toggle: function () {
          Lampa.Controller.collectionSet(scroll.render());
          Lampa.Controller.collectionFocus(last || false, scroll.render());
        },
        left: function () {
          if (Navigator.canmove('left')) Navigator.move('left');
          else Lampa.Controller.toggle('menu');
        },
        right: function () { Navigator.move('right'); },
        up: function () {
          if (Navigator.canmove('up')) Navigator.move('up');
          else Lampa.Controller.toggle('head');
        },
        down: function () { if (Navigator.canmove('down')) Navigator.move('down'); },
        back: function () { Lampa.Activity.backward(); }
      });

      Lampa.Controller.toggle('content');
    };

    this.pause = function () {};
    this.stop = function () {};

    this.destroy = function () {
      alive = false;
      try { scroll.destroy(); } catch (e) {}
      html.remove();
    };
  }

  /* ======================================================================
   *  Стилі
   * ==================================================================== */
  function addStyles() {
    if ($('#yt-pro-css').length) return;
    var css = '' +
      '.yt-root{padding:1em 0 4em;}' +
      '.yt-bar{display:flex;flex-wrap:wrap;padding:0 1.5em .4em;}' +
      '.yt-bar--sub{padding-top:.2em;}' +
      '.yt-chip{margin:0 .6em .6em 0;padding:.5em 1.1em;border-radius:2em;background:rgba(255,255,255,.08);font-size:1.15em;line-height:1.2;white-space:nowrap;transition:background .15s,color .15s;}' +
      '.yt-chip--active{background:rgba(255,255,255,.22);font-weight:600;}' +
      '.yt-chip.focus{background:#fff;color:#111;}' +
      '.yt-head{display:flex;align-items:center;padding:.4em 1.5em .6em;}' +
      '.yt-head:empty{display:none;}' +
      '.yt-head__ava{width:4.2em;height:4.2em;border-radius:50%;background:#3a3a3a;margin-right:1.1em;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.3em;font-weight:600;}' +
      '.yt-head__ava img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.yt-head__title{font-size:1.9em;font-weight:600;line-height:1.2;}' +
      '.yt-head__sub{opacity:.6;margin-top:.3em;font-size:1.1em;}' +
      '.yt-grid{display:flex;flex-wrap:wrap;padding:.2em 1em 0;}' +
      '.yt-card{width:25%;box-sizing:border-box;padding:.6em .6em 1.1em;}' +
      '.yt-thumb{position:relative;padding-top:56.25%;border-radius:.8em;overflow:hidden;background:#262626;transition:transform .15s,box-shadow .15s;}' +
      '.yt-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;}' +
      '.yt-card.focus .yt-thumb{transform:scale(1.04);box-shadow:0 0 0 .2em #fff,0 .6em 1.6em rgba(0,0,0,.5);}' +
      '.yt-badges{position:absolute;right:.45em;bottom:.45em;}' +
      '.yt-badge{display:inline-block;padding:.15em .5em;border-radius:.4em;background:rgba(0,0,0,.82);font-size:.9em;font-weight:600;}' +
      '.yt-badge--live{background:#e62117;}' +
      '.yt-prog{display:none;position:absolute;left:0;right:0;bottom:0;height:.3em;background:rgba(255,255,255,.3);}' +
      '.yt-prog i{display:block;height:100%;width:0;background:#f03;}' +
      '.yt-meta{display:flex;margin-top:.75em;}' +
      '.yt-ava{width:2.5em;height:2.5em;border-radius:50%;background:#3a3a3a;margin-right:.75em;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:600;}' +
      '.yt-ava img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.yt-info{min-width:0;flex:1;}' +
      '.yt-title{font-size:1.1em;line-height:1.3;max-height:2.6em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}' +
      '.yt-sub{opacity:.62;font-size:.95em;margin-top:.25em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.yt-card--channel{text-align:center;padding-top:1.2em;}' +
      '.yt-chava{width:7.5em;height:7.5em;border-radius:50%;background:#3a3a3a;margin:0 auto;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.6em;font-weight:600;transition:transform .15s,box-shadow .15s;}' +
      '.yt-chava img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.yt-card--channel.focus .yt-chava{transform:scale(1.06);box-shadow:0 0 0 .15em #fff;}' +
      '.yt-chname{font-size:1.15em;margin-top:.7em;}' +
      '.yt-empty{width:100%;padding:3em 1.5em;text-align:center;}' +
      '.yt-empty__txt{opacity:.75;font-size:1.25em;line-height:1.5;max-width:30em;margin:0 auto 1.2em;}' +
      '.yt-empty__act{display:flex;justify-content:center;flex-wrap:wrap;}' +
      '.yt-more{width:100%;text-align:center;padding:1em;opacity:.55;}' +
      '@media (max-width:1100px){.yt-card{width:33.333%;}}' +
      '@media (max-width:760px){.yt-card{width:50%;}.yt-head__title{font-size:1.5em;}}' +
      '@media (max-width:480px){.yt-card{width:100%;}.yt-bar,.yt-head{padding-left:1em;padding-right:1em;}}';
    $('head').append('<style id="yt-pro-css">' + css + '</style>');
  }

  /* ======================================================================
   *  Налаштування
   * ==================================================================== */
  function initSettings() {
    Lampa.SettingsApi.addComponent({ component: SET, name: 'YouTube', icon: ICON });

    function param(name, type, values, def, title, descr, onChange) {
      Lampa.SettingsApi.addParam({
        component: SET,
        param: { name: name, type: type, values: values, default: def },
        field: { name: title, description: descr },
        onChange: onChange
      });
    }

    function section(name, title, descr) {
      Lampa.SettingsApi.addParam({
        component: SET,
        param: { name: name, type: 'title', default: '' },
        field: { name: title, description: descr || '' }
      });
    }

    var qv = { '0': L('s_q_auto'), '1080': '1080p', '720': '720p', '480': '480p', '360': '360p' };
    var bv = { auto: L('s_b_auto'), piped: 'Piped', invidious: 'Invidious' };
    var rv = { auto: L('s_region_auto'), UA: 'UA', US: 'US', GB: 'GB', CA: 'CA', AU: 'AU', DE: 'DE', FR: 'FR', ES: 'ES', IT: 'IT', PL: 'PL', CZ: 'CZ', SK: 'SK', TR: 'TR', KZ: 'KZ', JP: 'JP' };

    section('yt_s1', L('s_playback'), L('s_player_note'));
    param('yt_quality', 'select', qv, '0', L('s_quality'), L('s_quality_d'));
    param('yt_dash', 'trigger', '', false, L('s_dash'), L('s_dash_d'));
    param('yt_subs', 'trigger', '', true, L('s_subs'), L('s_subs_d'));

    section('yt_s2', L('s_content'));
    param('yt_region', 'select', rv, 'auto', L('s_region'), '');
    param('yt_hist_on', 'trigger', '', true, L('s_hist_on'), L('s_hist_on_d'));
    param('yt_clear_hist', 'button', '', '', L('s_clear_hist'), '', function () {
      Lampa.Storage.set('yt_hist', []);
      noty(L('s_done'));
    });
    param('yt_clear_saved', 'button', '', '', L('s_clear_saved'), '', function () {
      Lampa.Storage.set('yt_saved', []);
      noty(L('s_done'));
    });

    section('yt_s3', L('s_servers'));
    param('yt_backend', 'select', bv, 'auto', L('s_backend'), L('s_backend_d'), function () { Inst.bad = {}; });
    param('yt_custom_piped', 'input', '', '', L('s_custom_piped'), L('s_custom_d'), function () { Inst.bad = {}; });
    param('yt_custom_inv', 'input', '', '', L('s_custom_inv'), L('s_custom_d'), function () { Inst.bad = {}; });
    param('yt_refresh', 'button', '', '', L('s_refresh'), L('s_refresh_d'), function () {
      Inst.refresh(true, function () { Inst.bad = {}; noty(L('s_refreshed')); });
    });
    param('yt_active', 'button', '', '', L('s_active'), '', function () {
      var l = Lampa.Storage.get('yt_last_ok', '');
      noty(L('s_active') + ': ' + (l && l.base ? l.type + ' · ' + l.base : L('s_none')));
    });
  }

  /* ======================================================================
   *  Пункт меню
   * ==================================================================== */
  function addMenu() {
    var ANCHORS = ['cartoons', 'multfilm', 'tv', 'movie', 'main'];
    var tries = 0;

    function findList() {
      var l = $('.menu .menu__list').eq(0);
      if (!l.length) l = $('.menu ul').eq(0);
      return l;
    }

    function insert() {
      var list = findList();
      if (!list.length) return false;
      if (list.find('.yt-menu-item').length) return true;

      var item = $('<li class="menu__item selector yt-menu-item" data-action="yt_pro">' +
        '<div class="menu__ico">' + ICON + '</div><div class="menu__text">YouTube</div></li>');
      item.on('hover:enter', function () { go({ title: 'YouTube', mode: 'recommended' }); });

      // ставимо одразу після «Мультфільми» / «Серіали» / «Фільми» (що є в меню)
      var placed = false;
      for (var i = 0; i < ANCHORS.length && !placed; i++) {
        var anchor = list.find('.menu__item[data-action="' + ANCHORS[i] + '"]').eq(0);
        if (anchor.length) { anchor.after(item); placed = true; }
      }
      if (!placed) list.append(item);

      try {
        if (Lampa.Controller.enabled().name === 'menu') Lampa.Controller.toggle('menu');
      } catch (e) {}
      return true;
    }

    // чекаємо, поки меню з’явиться в DOM
    (function attempt() {
      if (insert()) return watch();
      if (tries++ < 80) setTimeout(attempt, 250);
    })();

    // Lampa перебудовує меню (зміна налаштувань, мови) — повертаємо пункт на місце
    function watch() {
      var root = $('.menu')[0];
      if (!root || !window.MutationObserver) return;
      var busy = false;
      new MutationObserver(function () {
        if (busy) return;
        busy = true;
        setTimeout(function () {
          if (!$('.menu .yt-menu-item').length) insert();
          busy = false;
        }, 150);
      }).observe(root, { childList: true, subtree: true });
    }
  }

  /* ======================================================================
   *  Старт
   * ==================================================================== */
  var started = false;

  function safe(name, fn) {
    try { fn(); } catch (e) {
      try { console.log('[YouTube Pro] ' + name + ' failed:', e); } catch (x) {}
      noty('YouTube Pro: ' + name + ' — ' + (e && e.message ? e.message : e));
    }
  }

  function start() {
    if (started) return;
    started = true;
    safe('styles', addStyles);
    safe('component', function () { Lampa.Component.add(COMP, Feed); });
    safe('menu', addMenu);
    safe('settings', initSettings);
    safe('servers', function () { Inst.refresh(false); });
    noty('YouTube Pro ' + VERSION + ' loaded');
  }

  if (window.appready) start();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') start();
    });
    // страховка, якщо подію 'ready' пропущено
    setTimeout(function () { if (window.appready) start(); }, 3000);
  }
})();
