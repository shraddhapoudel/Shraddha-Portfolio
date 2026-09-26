/* Shraddha Poudel, site JS: nav, lightbox, smooth scroll, reveals, cursor and transitions */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var mq = function (q) { return window.matchMedia ? window.matchMedia(q).matches : false; };
  var reduceMotion = mq("(prefers-reduced-motion: reduce)");
  var finePointer = mq("(hover: hover) and (pointer: fine)");
  var lenis = null;

  /* page transitions fallback: modern browsers get native View Transitions, the rest get a quick fade-out */
  if (!("startViewTransition" in document) && !reduceMotion) {
    var veil = document.createElement("div");
    veil.className = "page-veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.hasAttribute("download") || a.hasAttribute("target")) return;
      var href = a.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0 || href.indexOf("javascript:") === 0) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      e.preventDefault();
      veil.style.opacity = "1";
      setTimeout(function () { window.location.href = url.href; }, 250);
    });
  }

  /* smooth inertia scrolling with Lenis (vendored locally) */
  if (window.Lenis && !reduceMotion) {
    try {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, smoothTouch: false });
      document.documentElement.style.scrollBehavior = "auto";
      function rafScroll(time) { lenis.raf(time); requestAnimationFrame(rafScroll); }
      requestAnimationFrame(rafScroll);
    } catch (err) { lenis = null; }
  }

  /* in-page anchors scroll through Lenis with a header offset when it is active */
  if (lenis) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var h = a.getAttribute("href");
      if (h.length < 2) return;
      var t = document.querySelector(h);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -98 });
    });
  }

  /* mobile nav */
  var toggle = document.getElementById("menuToggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        toggle.classList.remove("open");
      }
    });
  }

  /* lightbox: full-screen viewer with zoom, pan, pinch and fullscreen */
  var items = [];
  document.querySelectorAll("img[data-lb]").forEach(function (img) {
    items.push({ src: img.currentSrc || img.src, title: img.dataset.title || "", caption: img.dataset.caption || "" });
  });

  var lb = document.getElementById("lightbox");
  if (lb && items.length) {
    var lbImg = document.getElementById("lbImage");
    var lbCap = document.getElementById("lbCaption");
    var lbCount = document.getElementById("lbCount");
    var lbStage = lb.querySelector(".lb-stage");
    var idx = 0;
    var scale = 1, tx = 0, ty = 0, natW = 0, natH = 0;
    var drag = null, pinch = null, pointers = {}, pointerCount = 0, hintTimer = null;

    function showHint() {
      lb.classList.add("hint-on");
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = setTimeout(function () { lb.classList.remove("hint-on"); }, 2400);
    }

    function setZoom(animated) {
      if (!animated) lbStage.classList.add("no-anim");
      lbImg.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
      void lbImg.offsetWidth;
      if (!animated) lbStage.classList.remove("no-anim");
    }

    function measure() {
      if (scale === 1) {
        var r = lbImg.getBoundingClientRect();
        if (r.width > 0) { natW = r.width; natH = r.height; }
      }
    }

    function clampPan() {
      if (!natW && lbImg.getBoundingClientRect().width > 0) measure();
      if (!natW) return;
      var s = lbStage.getBoundingClientRect();
      var left = (s.width - natW) / 2;
      var top = (s.height - natH) / 2;
      var w = natW * scale, h = natH * scale;
      tx = Math.max(60 - left - w, Math.min(tx, s.width - 60 - left));
      ty = Math.max(60 - top - h, Math.min(ty, s.height - 60 - top));
    }

    function zoomAt(cx, cy, factor) {
      var ns = Math.max(1, Math.min(12, scale * factor));
      var k = ns / scale;
      tx = cx - (cx - tx) * k;
      ty = cy - (cy - ty) * k;
      scale = ns;
      clampPan();
      setZoom(true);
      showHint();
    }

    function resetZoom() {
      scale = 1; tx = 0; ty = 0;
      lbImg.style.transform = "none";
    }

    function centerZoom(factor) {
      var r = lbStage.getBoundingClientRect();
      zoomAt(r.width / 2, r.height / 2, factor);
    }

    function open(i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      lbImg.src = it.src;
      lbImg.alt = it.title || "Image";
      lbCap.textContent = it.title;
      lbCount.textContent = (idx + 1) + " / " + items.length;
      scale = 1; tx = 0; ty = 0;
      lbImg.style.transform = "none";
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
      setTimeout(measure, 50);
      showHint();
    }

    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      scale = 1; tx = 0; ty = 0;
      lbImg.style.transform = "none";
    }

    document.addEventListener("click", function (e) {
      var t = e.target.closest("img[data-lb]");
      if (!t) return;
      var k = items.findIndex(function (it) { return it.src === (t.currentSrc || t.src); });
      open(k >= 0 ? k : 0);
    });

    document.getElementById("lbClose").addEventListener("click", close);
    document.getElementById("lbPrev").addEventListener("click", function () { open(idx - 1); });
    document.getElementById("lbNext").addEventListener("click", function () { open(idx + 1); });

    lbImg.addEventListener("load", measure);
    lbImg.setAttribute("draggable", "false");
    lbStage.addEventListener("dragstart", function (e) { e.preventDefault(); });

    var zin = document.getElementById("lbZoomIn");
    var zout = document.getElementById("lbZoomOut");
    var zres = document.getElementById("lbZoomReset");
    if (zin) zin.addEventListener("click", function () { centerZoom(1.7); });
    if (zout) zout.addEventListener("click", function () { centerZoom(1 / 1.7); });
    if (zres) zres.addEventListener("click", resetZoom);

    var lbFull = document.getElementById("lbFull");
    if (lbFull) lbFull.addEventListener("click", function () {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      if (lb.requestFullscreen) { lb.requestFullscreen(); }
    });

    lbStage.addEventListener("wheel", function (e) {
      e.preventDefault();
      var r = lbStage.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.pow(1.0016, -e.deltaY));
    }, { passive: false });

    lbStage.addEventListener("dblclick", function (e) {
      if (e.target.closest("button")) return;
      var r = lbStage.getBoundingClientRect();
      if (scale > 1.01) resetZoom();
      else zoomAt(e.clientX - r.left, e.clientY - r.top, 2.6);
    });

    lbStage.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      pointerCount++;
      try { lbStage.setPointerCapture(e.pointerId); } catch (err) {}
      if (pointerCount === 2) {
        drag = null;
        var ids = Object.keys(pointers);
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) || 1;
        pinch = { d: d, s: scale };
        return;
      }
      drag = { x: e.clientX, y: e.clientY, ox: tx, oy: ty };
      lbStage.classList.add("grabbing");
    });

    lbStage.addEventListener("pointermove", function (e) {
      if (!(e.pointerId in pointers)) return;
      var r = lbStage.getBoundingClientRect();
      if (pinch) {
        pointers[e.pointerId].x = e.clientX;
        pointers[e.pointerId].y = e.clientY;
        var ids = Object.keys(pointers);
        if (ids.length === 2) {
          var a = pointers[ids[0]], b = pointers[ids[1]];
          var d = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) || 1;
          var cx = (a.x + b.x) / 2 - r.left;
          var cy = (a.y + b.y) / 2 - r.top;
          var ns = Math.max(1, Math.min(12, pinch.s * (d / pinch.d)));
          var k = ns / scale;
          tx = cx - (cx - tx) * k;
          ty = cy - (cy - ty) * k;
          scale = ns;
          clampPan();
          setZoom(false);
        }
        return;
      }
      if (drag) {
        tx = drag.ox + (e.clientX - drag.x);
        ty = drag.oy + (e.clientY - drag.y);
        clampPan();
        setZoom(false);
      }
    });

    function endPointer(e) {
      if (!(e.pointerId in pointers)) return;
      delete pointers[e.pointerId];
      pointerCount = Math.max(0, pointerCount - 1);
      if (pointerCount < 2) pinch = null;
      drag = null;
      lbStage.classList.remove("grabbing");
      setZoom(true);
    }
    lbStage.addEventListener("pointerup", endPointer);
    lbStage.addEventListener("pointercancel", endPointer);

    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") {
        if (document.fullscreenElement) { document.exitFullscreen(); return; }
        close();
        return;
      }
      if (e.key === "ArrowLeft") open(idx - 1);
      else if (e.key === "ArrowRight") open(idx + 1);
      else if (e.key === "+" || e.key === "=") centerZoom(1.7);
      else if (e.key === "-" || e.key === "_") centerZoom(1 / 1.7);
      else if (e.key === "0") resetZoom();
    });
  }

  /* slide between the two faces of a drawing (plan and its CAD back) */
  document.querySelectorAll(".slide-pair").forEach(function (pair) {
    var n = pair.querySelector(".slide-btn.next");
    var p = pair.querySelector(".slide-btn.prev");
    if (n) n.addEventListener("click", function () { pair.classList.add("show-back"); });
    if (p) p.addEventListener("click", function () { pair.classList.remove("show-back"); });
  });

  /* hero portrait: gentle scroll-linked zoom as the hero leaves the viewport */
  var portrait = document.querySelector(".hero-home .portrait-zoom");
  var heroHome = document.querySelector(".hero-home");
  if (portrait && heroHome && !reduceMotion) {
    var pTicking = false;
    function pFrame() {
      var r = heroHome.getBoundingClientRect();
      var h = r.height || 1;
      var p = Math.min(1, Math.max(0, (-r.top) / h));
      portrait.style.transform = "translate3d(0," + (p * 22).toFixed(1) + "px,0) scale(" + (1.03 + p * 0.05).toFixed(3) + ")";
      pTicking = false;
    }
    window.addEventListener("scroll", function () {
      if (!pTicking) { pTicking = true; requestAnimationFrame(pFrame); }
    }, { passive: true });
    pFrame();
  }

  /* when arriving via a category tag link, smooth-scroll and briefly highlight the tile */
  if (location.hash) {
    var targetTile = document.querySelector(location.hash);
    if (targetTile) {
      if (lenis) lenis.scrollTo(targetTile, { offset: -98 });
      else targetTile.scrollIntoView({ behavior: "smooth", block: "start" });
      targetTile.classList.add("hash-highlight");
      setTimeout(function () { targetTile.classList.remove("hash-highlight"); }, 2200);
    }
  }

  /* word-by-word text reveal for headings and key paragraphs */
  function splitWords(el) {
    if (el.getAttribute("data-split-done") === "1") return;
    if (el.childElementCount !== 0) return;
    el.setAttribute("data-split-done", "1");
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    while (walker.nextNode()) {
      var node = walker.currentNode;
      if (node.nodeValue.trim()) textNodes.push(node);
    }
    var i = 0;
    textNodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      var parts = node.nodeValue.split(/(\s+)/);
      parts.forEach(function (part) {
        if (!part) return;
        if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement("span");
        w.className = "w";
        w.style.setProperty("--i", String(i));
        w.textContent = part;
        frag.appendChild(w);
        i++;
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  if (!reduceMotion) {
    document.querySelectorAll("main h2:not(.label)").forEach(function (h) {
      if (h.childElementCount === 0) h.setAttribute("data-split", "");
    });
    document.querySelectorAll("[data-split]").forEach(splitWords);
  }

  /* unified scroll reveals, each triggered once: fade-up blocks, clip-wipe covers, word lines */
  var revealEls = document.querySelectorAll(".reveal");
  var wipeEls = document.querySelectorAll("img[data-reveal]");
  var splitEls = document.querySelectorAll("[data-split]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add(el.classList.contains("reveal") ? "visible" : "is-in");
        /* clip-wipe images live inside reveal ancestors; their own clipped box reports zero
           intersection, so reveal them from the ancestor when it enters the viewport */
        var wipes = el.querySelectorAll("img[data-reveal]");
        for (var j = 0; j < wipes.length; j++) {
          wipes[j].classList.add("is-in");
          if (el.classList.contains("work-tile") && el.style.transitionDelay) {
            wipes[j].style.transitionDelay = el.style.transitionDelay;
          }
        }
        if (wipes.length > 0 && el.classList.contains("work-tile")) {
          setTimeout(function () {
            el.style.transitionDelay = "";
            for (var k = 0; k < wipes.length; k++) wipes[k].style.transitionDelay = "";
          }, 1700);
        }
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    var tileIdx = 0;
    revealEls.forEach(function (el) {
      if (el.classList.contains("work-tile")) {
        el.style.transitionDelay = (tileIdx * 90) + "ms";
        tileIdx++;
      }
      io.observe(el);
    });
    splitEls.forEach(function (el) { io.observe(el); });
    /* any wipe that has no reveal ancestor: watch its nearest figure instead */
    wipeEls.forEach(function (img) {
      if (img.closest(".reveal")) return;
      var host = img.closest("figure") || img.parentElement;
      if (host && !host.getAttribute("data-wipe-host")) {
        host.setAttribute("data-wipe-host", "1");
        io.observe(host);
      }
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
    wipeEls.forEach(function (el) { el.classList.add("is-in"); });
    splitEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* scroll progress bar, project pages only */
  if (document.querySelector(".project-hero")) {
    var prog = document.createElement("div");
    prog.className = "scroll-progress";
    prog.setAttribute("aria-hidden", "true");
    document.body.appendChild(prog);
    var progQueued = false;
    function updateProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      prog.style.transform = "scaleX(" + p.toFixed(4) + ")";
      progQueued = false;
    }
    window.addEventListener("scroll", function () {
      if (!progQueued) { progQueued = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();
  }

  /* cursor-following VIEW label over project covers, pointer devices only */
  if (finePointer && !reduceMotion) {
    var cursor = document.createElement("div");
    cursor.className = "card-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "VIEW";
    document.body.appendChild(cursor);
    var curX = -1000, curY = -1000, curOn = false;
    function paintCursor() {
      cursor.style.transform = "translate(" + curX + "px, " + curY + "px) translate(-50%, -50%) scale(" + (curOn ? 1 : 0.6) + ")";
    }
    document.querySelectorAll(".card-figure, .work-tile figure").forEach(function (zone) {
      zone.addEventListener("mouseenter", function () { curOn = true; cursor.classList.add("is-on"); paintCursor(); });
      zone.addEventListener("mouseleave", function () { curOn = false; cursor.classList.remove("is-on"); paintCursor(); });
      zone.addEventListener("mousemove", function (e) { curX = e.clientX; curY = e.clientY; paintCursor(); });
    });
  }

  /* magnetic pull on primary buttons and links, pointer devices only */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn, .arrow-link, .cta-btn").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.24;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.24;
        dx = Math.max(-14, Math.min(14, dx));
        dy = Math.max(-10, Math.min(10, dy));
        el.style.transform = "translate3d(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px, 0)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }
})();