/* Speels gedrag: de onderste balk verdwijnt en komt terug met een veeg omhoog, en de mascotte
   reageert op het gesprek. Raakt de logica van de app niet aan. */
(function () {
  var nav = document.getElementById("nav");
  if (!nav) return;

  // ---------- Mascotte (uil) in de koptekst ----------
  var brand = document.querySelector("header.top .brand");
  var owl = document.createElement("div");
  owl.id = "owl";
  owl.setAttribute("aria-hidden", "true");
  owl.innerHTML =
    '<svg viewBox="0 0 64 64" width="52" height="52">' +
    '<path d="M13 26 Q10 8 24 12 Q29 14 30 24 Z M51 26 Q54 8 40 12 Q35 14 34 24 Z" fill="var(--p)" stroke="var(--ink-k)" stroke-width="3" stroke-linejoin="round"/>' +
    '<ellipse cx="32" cy="36" rx="22" ry="24" fill="var(--p)" stroke="var(--ink-k)" stroke-width="3"/>' +
    '<ellipse cx="32" cy="44" rx="13" ry="13" fill="var(--card)" stroke="var(--ink-k)" stroke-width="2.5"/>' +
    '<g class="eyes-open eye-blink">' +
      '<circle cx="23" cy="28" r="9" fill="#fff" stroke="var(--ink-k)" stroke-width="2.5"/>' +
      '<circle cx="41" cy="28" r="9" fill="#fff" stroke="var(--ink-k)" stroke-width="2.5"/>' +
      '<circle cx="24" cy="29" r="4" fill="var(--ink-k)"/><circle cx="42" cy="29" r="4" fill="var(--ink-k)"/>' +
    '</g>' +
    '<g class="eyes-happy">' +
      '<path d="M15 30 Q23 19 31 30" fill="none" stroke="var(--ink-k)" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M33 30 Q41 19 49 30" fill="none" stroke="var(--ink-k)" stroke-width="3.5" stroke-linecap="round"/>' +
    '</g>' +
    '<g class="eyes-oops">' +
      '<circle cx="23" cy="30" r="9" fill="#fff" stroke="var(--ink-k)" stroke-width="2.5"/>' +
      '<circle cx="41" cy="30" r="9" fill="#fff" stroke="var(--ink-k)" stroke-width="2.5"/>' +
      '<circle cx="23" cy="31" r="4" fill="var(--ink-k)"/><circle cx="41" cy="31" r="4" fill="var(--ink-k)"/>' +
      '<path d="M13 19 L27 23 M51 19 L37 23" stroke="var(--ink-k)" stroke-width="3" stroke-linecap="round"/>' +
    '</g>' +
    '<path d="M28 38 L36 38 L32 44 Z" fill="#ffb703" stroke="var(--ink-k)" stroke-width="2.5" stroke-linejoin="round"/>' +
    '</svg>';
  if (brand) brand.insertBefore(owl, brand.querySelector("h1"));

  // ---------- Installeren: alleen op de Info-pagina, en alleen met toestemming van de gebruiker ----------
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredPrompt = e; fillInstall(); });
  window.addEventListener("appinstalled", function () { deferredPrompt = null; fillInstall(); });
  var INSTALL_TXT = {
    nl: { title: "Zet de app op je telefoon", android: "Installeer de app, dan staat hij als eigen app op je beginscherm.", button: "Installeer de app",
          ios: ["Open deze pagina in Safari.", "Tik onderin op het deelicoon.", "Kies 'Zet op beginscherm'."] },
    en: { title: "Put the app on your phone", android: "Install the app so it sits on your home screen like its own app.", button: "Install the app",
          ios: ["Open this page in Safari.", "Tap the share icon at the bottom.", "Choose 'Add to Home Screen'."] },
    de: { title: "App auf dein Telefon legen", android: "Installiere die App, damit sie wie eine eigene App auf dem Startbildschirm liegt.", button: "App installieren",
          ios: ["Öffne diese Seite in Safari.", "Tippe unten auf das Teilen-Symbol.", "Wähle 'Zum Home-Bildschirm'."] },
    fr: { title: "Installer l'application sur ton téléphone", android: "Installe l'application pour qu'elle apparaisse sur ton écran d'accueil comme une vraie application.", button: "Installer l'application",
          ios: ["Ouvre cette page dans Safari.", "Touche l'icône de partage en bas.", "Choisis « Sur l'écran d'accueil »."] }
  };
  function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
  function isIOSDevice() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function fillInstall() {
    var slot = document.getElementById("installSlot");
    if (!slot || slot.childElementCount) return;
    if (isStandalone()) return;
    var t = INSTALL_TXT[document.body.getAttribute("data-lang") || "nl"] || INSTALL_TXT.nl;
    var card = document.createElement("div");
    card.className = "card install-card";
    var h = document.createElement("div"); h.className = "sec-title"; h.textContent = t.title; card.appendChild(h);
    if (deferredPrompt) {
      var p = document.createElement("div"); p.textContent = t.android; card.appendChild(p);
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn primary"; b.textContent = t.button;
      b.addEventListener("click", function () {
        var ev = deferredPrompt; deferredPrompt = null;
        ev.prompt();
        ev.userChoice.then(function () { slot.innerHTML = ""; fillInstall(); });
      });
      card.appendChild(b);
    } else if (isIOSDevice()) {
      var ol = document.createElement("ol"); ol.className = "guide-list";
      t.ios.forEach(function (s0) { var li = document.createElement("li"); li.textContent = s0; ol.appendChild(li); });
      card.appendChild(ol);
    } else {
      return; // computer zonder installatieaanbod: niets tonen
    }
    slot.appendChild(card);
  }

  var moodTimer = null;
  function setMood(m, ms) {
    owl.className = "mood-" + m;
    clearTimeout(moodTimer);
    if (ms) moodTimer = setTimeout(function () { owl.className = "mood-idle"; }, ms);
  }
  owl.className = "mood-idle";
  owl.addEventListener("click", function () { setMood("happy", 1400); });

  // Reageer op nieuwe beurten (blij), fouten (verward) en opnemen (oplettend)
  var lastTurns = document.querySelectorAll(".turn").length;
  var lastBad = "";
  var obs = new MutationObserver(function () {
    var turns = document.querySelectorAll(".turn").length;
    if (turns > lastTurns) setMood("happy", 1600);
    lastTurns = turns;
    var bad = document.querySelector(".bad");
    var badTxt = bad ? bad.textContent : "";
    if (badTxt && badTxt !== lastBad) setMood("oops", 2200);
    lastBad = badTxt;
    fillInstall();
    if (document.querySelector(".btn.mic.rec, .btn.rec")) { if (owl.className !== "mood-think") setMood("think"); }
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // ---------- Onderste balk: verdwijnt en komt terug met een veeg omhoog ----------
  var handle = document.createElement("button");
  handle.id = "navHandle";
  handle.type = "button";
  handle.setAttribute("aria-label", "Menu tonen");
  document.body.appendChild(handle);

  var timer = null, hidden = false, lastY = window.scrollY, quietUntil = 0;
  function hide() { if (hidden) return; hidden = true; document.body.classList.add("nav-away"); }
  function schedule() { clearTimeout(timer); timer = setTimeout(hide, 3500); }
  function show(fromGesture) {
    if (fromGesture) quietUntil = Date.now() + 700;
    hidden = false; document.body.classList.remove("nav-away"); schedule();
  }
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (Date.now() > quietUntil) {
      if (y > lastY + 8 && y > 80) hide();
      else if (y < lastY - 8) show(false);
    }
    lastY = y;
  }, { passive: true });
  var sy = null, sx = null;
  document.addEventListener("touchstart", function (e) { var t = e.touches[0]; sy = t.clientY; sx = t.clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (sy === null) return;
    var t = e.changedTouches[0];
    var dy = sy - t.clientY, dx = Math.abs(sx - t.clientX);
    if (dy > 60 && dx < dy && sy > window.innerHeight * 0.75) show(true);
    sy = null;
  }, { passive: true });
  document.addEventListener("pointerdown", function () { if (!hidden) schedule(); });
  handle.addEventListener("click", function () { show(true); });
  schedule();
})();
