/* ============================================================
   祝梦安 · 个人博客  |  site scripts
   no dependencies · works from file://
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var LS = {
    theme: "zm.theme",
    fs: "zm.fs",
    lh: "zm.lh"
  };

  function get(k, d) {
    try { return localStorage.getItem(k) || d; } catch (e) { return d; }
  }
  function set(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  /* ---------- theme ---------- */
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "light" ? "#f3eee6" : "#100e0c");
    var btn = document.getElementById("themeBtn");
    if (btn) {
      btn.setAttribute("aria-label", t === "light" ? "切换到深色模式" : "切换到浅色模式");
      btn.title = t === "light" ? "深色模式" : "浅色模式";
    }
  }
  applyTheme(get(LS.theme, "dark"));

  document.addEventListener("click", function (e) {
    var t = e.target.closest("#themeBtn");
    if (!t) return;
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    set(LS.theme, next);
  });

  /* ---------- header shadow ---------- */
  var head = document.querySelector(".site-head");
  function onScrollHead() {
    if (head) head.classList.toggle("is-stuck", window.scrollY > 6);
  }
  onScrollHead();
  window.addEventListener("scroll", onScrollHead, { passive: true });

  /* ---------- reveal on scroll ---------- */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en, i) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
          setTimeout(function () { el.classList.add("in"); }, delay);
          ro.unobserve(el);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { ro.observe(el); });
    }
  }

  /* ============================================================
     reader
     ============================================================ */
  var reader = document.getElementById("reader");
  if (reader) {
    /* --- typography controls --- */
    reader.setAttribute("data-fs", get(LS.fs, "m"));
    reader.setAttribute("data-lh", get(LS.lh, "normal"));

    function syncSeg(group, attr, val) {
      document.querySelectorAll('[data-group="' + group + '"] button').forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-val") === val));
      });
    }
    syncSeg("fs", "data-fs", reader.getAttribute("data-fs"));
    syncSeg("lh", "data-lh", reader.getAttribute("data-lh"));

    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-group] button");
      if (!b) return;
      var group = b.closest("[data-group]").getAttribute("data-group");
      var val = b.getAttribute("data-val");
      if (group === "fs") { reader.setAttribute("data-fs", val); set(LS.fs, val); }
      if (group === "lh") { reader.setAttribute("data-lh", val); set(LS.lh, val); }
      syncSeg(group, group === "fs" ? "data-fs" : "data-lh", val);
    });

    /* --- reading progress --- */
    var bar = document.getElementById("progress");
    var chapters = [].slice.call(document.querySelectorAll(".chapter"));
    function progress() {
      var rect = reader.getBoundingClientRect();
      var top = window.scrollY + rect.top;
      var total = reader.offsetHeight - window.innerHeight * 0.62;
      var p = total > 0 ? (window.scrollY - top + window.innerHeight * 0.35) / total : 0;
      p = Math.max(0, Math.min(1, p));
      if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
      reader.setAttribute("data-progress", Math.round(p * 100) + "%");
      return p;
    }

    /* --- chapter scrollspy --- */
    var links = [].slice.call(document.querySelectorAll(".chapter-nav a"));
    var linkFor = {};
    links.forEach(function (a) {
      var id = (a.getAttribute("href") || "").replace("#", "");
      if (id) linkFor[id] = a;
    });
    var activeId = null;
    function spy() {
      var y = window.scrollY + window.innerHeight * 0.3;
      var cur = chapters.length ? chapters[0].id : null;
      for (var i = 0; i < chapters.length; i++) {
        if (chapters[i].offsetTop <= y) cur = chapters[i].id;
      }
      if (cur === activeId) return;
      activeId = cur;
      links.forEach(function (a) { a.classList.remove("is-active"); });
      var a = linkFor[cur];
      if (a) {
        a.classList.add("is-active");
        var box = a.closest(".chapter-nav");
        if (box && window.innerWidth > 1000) {
          var at = a.offsetTop, ah = a.offsetHeight, st = box.scrollTop, bh = box.clientHeight;
          if (at < st || at + ah > st + bh) box.scrollTop = at - bh / 2 + ah / 2;
        }
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        progress();
        spy();
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    progress(); spy();

    /* --- keyboard: [ ] jump chapters, f toggle focus --- */
    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "[" || e.key === "]") {
        var ids = chapters.map(function (c) { return c.id; });
        var i = ids.indexOf(activeId);
        var n = e.key === "]" ? i + 1 : i - 1;
        if (n < 0) n = 0;
        if (n > ids.length - 1) n = ids.length - 1;
        var el = document.getElementById(ids[n]);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        e.preventDefault();
      }
    });
  }

  /* ---------- current year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
