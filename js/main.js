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

  /* lightbox */
  var items = [];
  document.querySelectorAll("img[data-lb]").forEach(function (img) {
    items.push({ src: img.currentSrc || img.src, title: img.dataset.title || "", caption: img.dataset.caption || "" });
  });

  var lb = document.getElementById("lightbox");
  if (lb && items.length) {
    var lbImg = document.getElementById("lbImage");
    var lbCap = document.getElementById("lbCaption");
    var lbCount = document.getElementById("lbCount");
    var idx = 0;

    function open(i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      lbImg.src = it.src;
      lbImg.alt = it.title || "Image";
      lbCap.textContent = it.title;
      lbCount.textContent = (idx + 1) + " / " + items.length;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("open");
      document.body.style.overflow = "";
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
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(idx - 1);
      if (e.key === "ArrowRight") open(idx + 1);
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