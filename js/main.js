/* Shraddha Poudel, minimal site JS: mobile nav + image lightbox */
(function () {
  "use strict";

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
      setTimeout(measure, 50);
      showHint();
    }

    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
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

  /* subtle reveal-on-scroll */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
    });
  }, { threshold: 0.06 }) : null;
  document.querySelectorAll(".reveal").forEach(function (n) {
    if (io) io.observe(n); else n.classList.add("visible");
  });
})();