// Gespreksgids Spaans: logica en weergave.
(function () {
  "use strict";

  // Opzoektabellen zonder ingebouwde eigenschappen (zodat een woord als "constructor" niets oplevert)
  function nullProto(o) { Object.setPrototypeOf(o, null); return o; }
  [GLOSS, WHEN, BUILD_STEMS, DICTS.nl, DICTS.en, DICTS.de, DICTS.fr,
    REVS.nl, REVS.en, REVS.de, REVS.fr,
    PHRASES_BY_LANG.nl, PHRASES_BY_LANG.en, PHRASES_BY_LANG.de, PHRASES_BY_LANG.fr].forEach(nullProto);

  var LANGS = ["nl", "en", "de", "fr"];
  var TABS = [
    ["zinnen", "Zinnen"], ["onderwerpen", "Onderwerpen"], ["vastlopen", "Vastlopen"],
    ["bouwen", "Zin bouwen"], ["reageren", "Reageren"], ["leren", "Leren"],
    ["regels", "Regels"], ["gesprek", "Gesprek"], ["uitspraak", "Uitspraak"], ["info", "Info"]
  ];

  // ---------- Opslag op het toestel ----------
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem("gg_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem("gg_" + k, JSON.stringify(v)); } catch (e) {} }
  };

  var lang = store.get("lang", "nl");
  if (LANGS.indexOf(lang) < 0) lang = "nl";
  var theme = store.get("theme", "standaard");
  var rate = parseFloat(store.get("rate", 0.9)) || 0.9;

  // ---------- Toestand ----------
  // Eerste keer openen: start op Info (uitleg). Daarna altijd op de hoofdpagina (Zinnen).
  var firstVisit = !store.get("bezocht", false);
  store.set("bezocht", true);
  var S = {
    tab: firstVisit ? "info" : "zinnen", cat: "Gesprek openen", stuck: 0, build: null,
    rKind: "vraag", rOpen: null, rSub: null, rAns: {},
    lMode: "kaarten", lIdx: 0, lShow: false, quiz: null, score: [0, 0],
    convo: [], note: "", listening: false, rec: null
  };

  // ---------- Hulpfuncties ----------
  function T(k) { var u = UI[k]; return u ? (u[lang] || u.nl) : k; }
  function L(o) {
    if (o === undefined || o === null) return "";
    if (typeof o === "string") return o;
    return o[lang] || o.nl;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function btn(label, cls, fn) {
    var b = el("button", "btn" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.onclick = fn;
    return b;
  }
  function speakBtn(text) {
    var b = el("button", "speak", "🔊");
    b.type = "button";
    b.title = T("Luister");
    b.setAttribute("aria-label", T("Luister"));
    b.onclick = function () { speak(text); };
    return b;
  }
  function shuffle(a) {
    var c = a.slice();
    for (var i = c.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = c[i]; c[i] = c[j]; c[j] = t;
    }
    return c;
  }
  // Vergelijkbare schrijfwijze: kleine letters, zonder leestekens
  function clean(s) {
    return String(s).toLowerCase().replace(/[¿¡?!.,;:…"“”()]+/g, " ").replace(/\s+/g, " ").trim();
  }

  // ---------- Voorlezen (Spaans) ----------
  function pickVoice() {
    var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    for (var i = 0; i < vs.length; i++) if (/^es-ES/i.test(vs[i].lang)) return vs[i];
    for (var j = 0; j < vs.length; j++) if (/^es/i.test(vs[j].lang)) return vs[j];
    return null;
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES";
      u.rate = rate;
      var v = pickVoice();
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- Begrepen items en gekende kaarten ----------
  function isUnderstood(k) { return store.get("begrepen", []).indexOf(k) >= 0; }
  function markUnderstood(k) {
    var a = store.get("begrepen", []);
    if (a.indexOf(k) < 0) a.push(k);
    store.set("begrepen", a);
  }
  function understoodCheckbox(k) {
    var lab = el("label");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.onchange = function () { markUnderstood(k); render(); };
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(" " + T("Begrijp ik, niet meer tonen")));
    return lab;
  }

  // ---------- Alle zinnen als één lijst (voor Leren en vertalen) ----------
  var ITEMS = null;
  function allItems() {
    if (ITEMS) return ITEMS;
    var out = [], seen = {};
    function add(es, mm) { if (!es || seen[es]) return; seen[es] = true; out.push({ es: es, m: mm }); }
    Object.keys(PHRASES).forEach(function (k) { PHRASES[k].forEach(function (x) { add(x.es, x.m); }); });
    STUCK.forEach(function (x) { add(x.es, x.m); });
    TOPICS.forEach(function (x) { add(x.es, x.m); });
    PATTERNS.forEach(function (x) { add(x.ex.es, x.ex.m); });
    REACT.forEach(function (e) {
      add(e.es, e.m);
      e.styles.forEach(function (s) { add(s[1], s[2]); });
      e.vervolg.forEach(function (v) { add(v.es, v.m); v.styles.forEach(function (s) { add(s[1], s[2]); }); });
    });
    ITEMS = out;
    return out;
  }

  // ---------- Woord voor woord en uitleg ----------
  function explainBox(es, opts) {
    var box = el("div", "explain");
    var words = clean(es).split(" ").filter(Boolean);
    var parts = words.map(function (w) {
      var g = GLOSS[w];
      return w + " = " + (g ? L(g) : "?");
    });
    if (words.length) box.appendChild(el("div", "", T("Woord voor woord:") + " " + parts.join(" · ")));
    if (WHEN[es]) box.appendChild(el("div", "", T("Wanneer zeg je dit:") + " " + L(WHEN[es])));
    if (!(opts && opts.noUnderstood)) box.appendChild(understoodCheckbox(es));
    return box;
  }

  // Eén zin als kaart (Spaans, vertaling, luisteren, uitleg, optionele knop)
  function phraseCard(it, extra) {
    if (isUnderstood(it.es)) return null;
    var card = el("div", "card");
    var line = el("div", "line-row");
    var tx = el("div", "txt");
    tx.appendChild(el("div", "es", it.es));
    tx.appendChild(el("div", "nl", L(it.m)));
    line.appendChild(tx);
    line.appendChild(speakBtn(it.es));
    card.appendChild(line);
    card.appendChild(explainBox(it.es));
    if (extra) card.appendChild(extra);
    return card;
  }

  // ---------- Navigatie en weergave van de vaste onderbalk ----------
  function go(tab) {
    if (typeof prRelease === "function") prRelease();
    S.tab = tab; S.build = null;
    render();
    window.scrollTo(0, 0);
  }
  function renderNav() {
    var nav = document.getElementById("nav");
    nav.innerHTML = "";
    TABS.forEach(function (t) {
      nav.appendChild(btn(T(t[1]), S.tab === t[0] ? "active small" : "small", function () { go(t[0]); }));
    });
  }

  // ---------- Zinnen ----------
  function viewZinnen() {
    var w = el("div");
    var row = el("div", "chips");
    Object.keys(PHRASES).forEach(function (cat) {
      row.appendChild(btn(T(cat), S.cat === cat ? "primary small" : "small", function () { S.cat = cat; render(); }));
    });
    w.appendChild(row);
    var canBuild = BUILDABLE_CATS.indexOf(S.cat) >= 0;
    var shown = 0;
    PHRASES[S.cat].forEach(function (it) {
      var extra = null;
      if (canBuild && BUILD_STEMS[it.es]) {
        extra = el("div", "row");
        extra.appendChild(btn(T("Bouw verder →"), "primary small", function () {
          S.build = { start: it.es, startM: it.m, conn: null, subj: null, verb: null, neg: BUILD_STEMS[it.es].neg };
          render();
        }));
      }
      var c = phraseCard(it, extra);
      if (c) { w.appendChild(c); shown++; }
    });
    if (!shown) w.appendChild(el("div", "note", T("Alles in deze groep is begrepen. Zet de begrepen items terug in de instellingen.")));
    return w;
  }

  // ---------- Onderwerpen ----------
  function viewOnderwerpen() {
    var w = el("div");
    w.appendChild(el("div", "note", T("Stel zo'n vraag als het gesprek stilvalt. Lees hem hardop en luister na.")));
    TOPICS.forEach(function (it) { var c = phraseCard(it, null); if (c) w.appendChild(c); });
    return w;
  }

  // ---------- Vastlopen ----------
  function viewVastlopen() {
    var w = el("div");
    var idxs = STUCK.map(function (x, i) { return i; }).filter(function (i) { return !isUnderstood(STUCK[i].es); });
    if (!idxs.length) idxs = STUCK.map(function (x, i) { return i; });
    if (idxs.indexOf(S.stuck) < 0) S.stuck = idxs[0];
    var cur = STUCK[S.stuck];
    var big = el("div", "card big");
    big.appendChild(el("div", "big-es", cur.es));
    big.appendChild(el("div", "nl", L(cur.m)));
    w.appendChild(big);
    var row = el("div", "row");
    row.appendChild(btn("🔊 " + T("Luister"), "primary", function () { speak(cur.es); }));
    row.appendChild(btn(T("Andere zin"), "", function () {
      var cand = idxs.filter(function (i) { return i !== S.stuck; });
      if (cand.length) S.stuck = cand[Math.floor(Math.random() * cand.length)];
      render();
    }));
    w.appendChild(row);
    w.appendChild(el("h2", "", T("Zinnen")));
    STUCK.forEach(function (it) { var c = phraseCard(it, null); if (c) w.appendChild(c); });
    return w;
  }

  // ---------- Zin bouwen (vervolgmenu) ----------
  function viewBuilder() {
    var b = S.build;
    var st = BUILD_STEMS[b.start];
    var w = el("div");
    var head = el("div", "card big");
    head.appendChild(el("div", "big-es", st.stem + " …"));
    head.appendChild(el("div", "nl", L(st.stemM) + " …"));
    w.appendChild(head);

    var top = el("div", "chips");
    top.appendChild(btn(T("← Terug naar lijst"), "small", function () { S.build = null; render(); }));
    top.appendChild(btn(T("Ontkennend (no)"), b.neg ? "primary small" : "small", function () { b.neg = !b.neg; render(); }));
    w.appendChild(top);

    w.appendChild(el("h2", "", T("1. Verbindingswoord (optioneel)")));
    var cr = el("div", "chips");
    cr.appendChild(btn(T("geen"), b.conn === null ? "primary small" : "small", function () { b.conn = null; render(); }));
    CONN.forEach(function (c, ci) {
      cr.appendChild(btn(c.es + " (" + L(c.m) + ")", b.conn === ci ? "primary small" : "small", function () { b.conn = ci; render(); }));
    });
    w.appendChild(cr);

    w.appendChild(el("h2", "", T("2. Wie?")));
    var sr = el("div", "chips");
    SUBJ.forEach(function (s, si) {
      sr.appendChild(btn(s.es + " (" + L(s.m) + ")", b.subj === si ? "primary small" : "small", function () { b.subj = si; b.verb = null; render(); }));
    });
    w.appendChild(sr);
    if (b.subj === null) return w;

    w.appendChild(el("h2", "", T("3. Wat doet die persoon?")));
    var vr = el("div", "chips");
    VERBS.forEach(function (v) {
      if (isUnderstood("verb:" + v.id)) return;
      vr.appendChild(btn(L(v.m), b.verb === v.id ? "primary small" : "small", function () { b.verb = v.id; render(); }));
    });
    w.appendChild(vr);
    if (b.verb === null) return w;

    var subj = SUBJ[b.subj];
    var verb = null;
    VERBS.forEach(function (v) { if (v.id === b.verb) verb = v; });

    w.appendChild(el("h2", "", T("4. Kies het afmaakdeel")));
    var hint = el("div", "card");
    hint.appendChild(el("div", "nl", L(VERB_HINT[verb.id])));
    hint.appendChild(understoodCheckbox("verb:" + verb.id));
    w.appendChild(hint);

    verb.comps.forEach(function (comp) {
      // Zonder verbindingswoord: stam + zin (Creo que yo voy al cine).
      // Met verbindingswoord: de hele startzin + verbindingswoord + zin (Creo que sí, porque yo voy al cine).
      var clause = [subj.es];
      if (b.neg) clause.push("no");
      clause.push(verb.forms[subj.i]);
      clause.push(comp.es);
      var NEG_M = { nl: "niet", en: "not", de: "nicht", fr: "ne … pas" };
      var gloss = L(subj.m) + (b.neg ? " · " + L(NEG_M) : "") + " · " + L(verb.m) + " · " + L(comp.m);
      var es, nlParts;
      if (b.conn !== null) {
        var base = b.start.replace(/[.…\s]+$/, "");
        es = base + ", " + CONN[b.conn].es + " " + clause.join(" ") + ".";
        var baseM = b.startM ? String(L(b.startM)).replace(/[.…\s]+$/, "") : L(st.stemM);
        nlParts = baseM + ", " + L(CONN[b.conn].m) + " · " + gloss;
      } else {
        es = st.stem + " " + clause.join(" ") + ".";
        nlParts = L(st.stemM) + " · " + gloss;
      }
      var card = el("div", "card");
      var line = el("div", "line-row");
      var tx = el("div", "txt");
      tx.appendChild(el("div", "es", es));
      tx.appendChild(el("div", "nl", nlParts));
      line.appendChild(tx);
      line.appendChild(speakBtn(es));
      card.appendChild(line);
      w.appendChild(card);
    });
    return w;
  }

  // ---------- Zin bouwen: patronen en analyse ----------
  function viewBouwen() {
    var w = el("div");
    w.appendChild(el("h2", "", T("Patronen")));
    w.appendChild(el("div", "note", T("Vul het patroon in met woorden die je al kent, en lees je zin hardop voor.")));
    PATTERNS.forEach(function (pt) {
      var c = el("div", "card");
      c.appendChild(el("div", "sec-title", L(pt.label)));
      var line = el("div", "line-row");
      var tx = el("div", "txt");
      tx.appendChild(el("div", "es", pt.ex.es));
      tx.appendChild(el("div", "nl", L(pt.ex.m)));
      line.appendChild(tx);
      line.appendChild(speakBtn(pt.ex.es));
      c.appendChild(line);
      c.appendChild(explainBox(pt.ex.es, { noUnderstood: true }));
      w.appendChild(c);
    });

    w.appendChild(el("h2", "", T("Jouw zin")));
    var ta = document.createElement("textarea");
    ta.className = "big-input";
    ta.placeholder = T("Typ hier je zin in het Spaans…");
    w.appendChild(ta);
    var out = el("div");
    var row = el("div", "row");
    row.appendChild(btn("🔊 " + T("Luister"), "primary", function () { if (ta.value.trim()) speak(ta.value.trim()); }));
    row.appendChild(btn(T("Analyseer mijn zin"), "primary", function () {
      out.innerHTML = "";
      out.appendChild(analyse(ta.value));
    }));
    row.appendChild(btn(T("Wis"), "", function () { ta.value = ""; out.innerHTML = ""; }));
    w.appendChild(row);
    w.appendChild(out);
    return w;
  }

  // Werkwoordsvormen die de analyse herkent
  var FORM_MAP = nullProto({});
  function addForm(f, inf, person, forms) {
    if (!FORM_MAP[f]) FORM_MAP[f] = [];
    FORM_MAP[f].push({ inf: inf, person: person, forms: forms });
  }
  VERBS.forEach(function (v) { v.forms.forEach(function (f, i) { addForm(f, v.inf, i, v.forms); }); });
  ANA_EXTRA.forEach(function (v) { v.forms.forEach(function (f, i) { addForm(f, v.inf, i, v.forms); }); });

  var ANA_SUBJ = nullProto({ "yo": 0, "tú": 1, "él": 2, "ella": 2, "usted": 2, "nosotros": 3, "nosotras": 3, "ellos": 4, "ellas": 4, "ustedes": 4 });
  var OBJ_PRON = ["me", "te", "le", "nos", "les"];
  var QWORDS = nullProto({ "como": "cómo", "donde": "dónde", "cuando": "cuándo", "quien": "quién", "quienes": "quiénes", "cual": "cuál", "cuanto": "cuánto", "cuanta": "cuánta", "que": "qué" });
  var NOUN_G = nullProto({ "café": "m", "cine": "m", "parque": "m", "examen": "m", "tiempo": "m", "trabajo": "m", "amigo": "m", "médico": "m", "pan": "m", "libro": "m", "mercado": "m", "restaurante": "m", "fin": "m", "hermano": "m", "supermercado": "m", "colegio": "m", "película": "f", "casa": "f", "playa": "f", "ciudad": "f", "semana": "f", "fruta": "f", "vida": "f", "fiesta": "f", "comida": "f", "cena": "f", "escuela": "f", "universidad": "f", "familia": "f", "hermana": "f", "amiga": "f" });
  var ADJ_STEMS = ["cansad", "content", "preocupad", "nervios", "enferm", "trist", "emocionad"];
  var NAT = ["holandés", "holandesa", "español", "española", "francés", "francesa", "alemán", "alemana", "inglés", "inglesa", "italiano", "italiana"];
  var STATE = ["cansado", "cansada", "contento", "contenta", "preocupado", "preocupada", "nervioso", "nerviosa", "enfermo", "enferma", "triste", "emocionado", "emocionada"];
  var TIME = ["hoy", "ayer", "mañana", "siempre", "ahora", "después", "luego", "anoche", "semana", "fin"];

  function analyse(text) {
    var raw = (text || "").trim();
    var frag = el("div");
    if (!raw) {
      frag.appendChild(el("div", "card", T("Typ eerst een zin, dan analyseer ik hem.")));
      return frag;
    }
    var toks = raw.split(/\s+/).map(function (t) {
      var pre = (t.match(/^[¿¡]+/) || [""])[0];
      var suf = (t.match(/[?!.,;:]+$/) || [""])[0];
      var core = t.slice(pre.length, t.length - suf.length);
      return { pre: pre, core: core, suf: suf, low: core.toLowerCase(), fix: null };
    });
    var words = toks.map(function (t) { return t.low; });
    var good = [], bad = [], tips = [], grow = [];

    function seq(arr) {
      for (var i = 0; i <= words.length - arr.length; i++) {
        var ok = true;
        for (var k = 0; k < arr.length; k++) { if (words[i + k] !== arr[k]) { ok = false; break; } }
        if (ok) return i;
      }
      return -1;
    }
    function isInf(w) { return !!w && w.length > 3 && /(ar|er|ir)$/.test(w); }
    function has(list) { return words.some(function (w) { return list.indexOf(w) >= 0; }); }

    // Vraagtekens en vraagwoorden
    var hasQ = raw.indexOf("?") >= 0;
    var hasOpen = raw.indexOf("¿") >= 0;
    if (hasQ && !hasOpen) {
      bad.push({ nl: "Vragen beginnen in het Spaans met een omgekeerd vraagteken (¿).", en: "Questions in Spanish start with an upside-down question mark (¿).", de: "Fragen beginnen im Spanischen mit einem umgekehrten Fragezeichen (¿).", fr: "En espagnol, les questions commencent par un point d'interrogation renversé (¿)." });
      toks[0].pre = "¿" + toks[0].pre;
    }
    if (hasOpen && !hasQ) {
      bad.push({ nl: "Een vraag die met ¿ begint, eindigt met ?.", en: "A question that starts with ¿ ends with ?.", de: "Eine Frage, die mit ¿ beginnt, endet mit ?.", fr: "Une question qui commence par ¿ se termine par ?." });
      toks[toks.length - 1].suf += "?";
    }
    if ((hasQ || hasOpen) && QWORDS[toks[0].low] && !/[áéíóúñ]/i.test(toks[0].core)) {
      var rep = QWORDS[toks[0].low];
      if (/^[A-ZÁÉÍÓÚÑ]/.test(toks[0].core)) rep = rep.charAt(0).toUpperCase() + rep.slice(1);
      toks[0].fix = rep;
      bad.push({ nl: "Vraagwoorden krijgen een accent: " + rep + ".", en: "Question words take an accent: " + rep + ".", de: "Fragewörter bekommen einen Akzent: " + rep + ".", fr: "Les mots interrogatifs prennent un accent : " + rep + "." });
    }

    // Onderwerp en werkwoord
    var subjIdx = -1, subjP = null;
    toks.forEach(function (t, i) {
      if (subjIdx < 0 && ANA_SUBJ[t.low] !== undefined && OBJ_PRON.indexOf(words[i - 1]) < 0) {
        subjIdx = i; subjP = ANA_SUBJ[t.low];
      }
    });
    // Het werkwoord dat bij het onderwerp hoort, is het eerste werkwoord NA dat onderwerp
    // (in "Creo que él va" hoort él bij va, niet bij creo).
    var verbIdx = -1;
    toks.forEach(function (t, i) { if (verbIdx < 0 && FORM_MAP[t.low] && i > subjIdx) verbIdx = i; });
    var pairWithSubj = subjIdx >= 0 && verbIdx >= 0;
    if (verbIdx < 0) toks.forEach(function (t, i) { if (verbIdx < 0 && FORM_MAP[t.low]) verbIdx = i; });
    toks.forEach(function (t, i) {
      if (i !== verbIdx) return;
      var cands = FORM_MAP[t.low];
      var c0 = cands[0];
      if (!pairWithSubj) {
        // Staat er een zelfstandig naamwoord als onderwerp voor (La película es...), dan is er niets weggelaten.
        var nounSubj = toks.slice(0, i).some(function (x) { return ["el", "la", "los", "las", "un", "una", "mi", "tu", "su", "mis", "tus", "sus", "este", "esta"].indexOf(x.low) >= 0; });
        if (nounSubj) {
          good.push({ nl: t.core + " is een vorm van " + c0.inf + ".", en: t.core + " is a form of " + c0.inf + ".", de: t.core + " ist eine Form von " + c0.inf + ".", fr: t.core + " est une forme de " + c0.inf + "." });
          return;
        }
        good.push({ nl: t.core + " is een vorm van " + c0.inf + ". Het onderwerp is weggelaten, dat kan als de vorm duidelijk is.", en: t.core + " is a form of " + c0.inf + ". The subject is left out, which is fine when the form is clear.", de: t.core + " ist eine Form von " + c0.inf + ". Das Subjekt fehlt, das geht, wenn die Form klar ist.", fr: t.core + " est une forme de " + c0.inf + ". Le sujet est omis, ce qui va si la forme est claire." });
        return;
      }
      var matches = cands.some(function (c) { return c.person === subjP; });
      if (matches) {
        good.push({ nl: toks[subjIdx].core + " en " + t.core + " kloppen (" + c0.inf + ").", en: toks[subjIdx].core + " and " + t.core + " match (" + c0.inf + ").", de: toks[subjIdx].core + " und " + t.core + " passen zusammen (" + c0.inf + ").", fr: toks[subjIdx].core + " et " + t.core + " vont ensemble (" + c0.inf + ")." });
      } else {
        var corr = c0.forms[subjP];
        bad.push({ nl: "Bij " + toks[subjIdx].core + " hoort " + corr + " (van " + c0.inf + "), niet " + t.core + ".", en: "With " + toks[subjIdx].core + " you need " + corr + " (from " + c0.inf + "), not " + t.core + ".", de: "Zu " + toks[subjIdx].core + " gehört " + corr + " (von " + c0.inf + "), nicht " + t.core + ".", fr: "Avec " + toks[subjIdx].core + ", il faut " + corr + " (de " + c0.inf + "), pas " + t.core + "." });
        t.fix = corr;
      }
    });

    // Gustar
    var gi = -1;
    words.forEach(function (w, i) { if (gi < 0 && (w === "gusta" || w === "gustan")) gi = i; });
    if (gi >= 0) {
      var prev = words[gi - 1];
      if (prev !== undefined && ANA_SUBJ[prev] !== undefined && OBJ_PRON.indexOf(prev) < 0) {
        var a = toks[gi - 1].core, bb = toks[gi].core;
        bad.push({ nl: "Bij gustar is het onderwerp het ding dat je leuk vindt, niet jij. Zeg: me gusta... (niet " + a + " " + bb + ").", en: "With gustar, the subject is the thing you like, not you. Say: me gusta... (not " + a + " " + bb + ").", de: "Bei gustar ist das Subjekt die Sache, die dir gefällt, nicht du. Sag: me gusta... (nicht " + a + " " + bb + ").", fr: "Avec gustar, le sujet est la chose qui te plaît, pas toi. Dis : me gusta... (pas " + a + " " + bb + ")." });
        toks[gi - 1].fix = "me";
      } else if (prev === undefined || OBJ_PRON.indexOf(prev) < 0) {
        tips.push({ nl: "Bij gustar zet je een voornaamwoord ervoor: me (mij), te (jou), le (hem, haar, u), nos (ons) of les (hun).", en: "With gustar, put a pronoun in front: me (me), te (you), le (him, her, you formal), nos (us) or les (them).", de: "Bei gustar setzt du ein Pronomen davor: me (mir), te (dir), le (ihm, ihr, Ihnen), nos (uns) oder les (ihnen).", fr: "Avec gustar, mets un pronom devant : me (moi), te (toi), le (lui, elle, vous), nos (nous) ou les (eux, elles)." });
      } else {
        good.push({ nl: toks[gi - 1].core + " " + toks[gi].core + " is de juiste opbouw voor 'bevalt mij'.", en: toks[gi - 1].core + " " + toks[gi].core + " is the right structure for 'I like'.", de: toks[gi - 1].core + " " + toks[gi].core + " ist der richtige Aufbau für ‚gefällt mir‘.", fr: toks[gi - 1].core + " " + toks[gi].core + " est la bonne structure pour « ça me plaît »." });
      }
      var nextW = words[gi + 1];
      if (nextW && !isInf(nextW)) {
        var plural = (nextW === "las" || nextW === "los") ||
          (["el", "la", "un", "una"].indexOf(nextW) < 0 && nextW.charAt(nextW.length - 1) === "s" && nextW.length > 3);
        var shouldBe = plural ? "gustan" : "gusta";
        var pl = { nl: "meervoud", en: "plural", de: "Mehrzahl", fr: "pluriel" };
        var sg = { nl: "enkelvoud", en: "singular", de: "Einzahl", fr: "singulier" };
        var numM = plural ? pl : sg;
        if (words[gi] !== shouldBe) {
          var pair = plural ? "me gustan" : "me gusta";
          bad.push({ nl: "Bij " + numM.nl + " hoort " + shouldBe + " (" + pair + ").", en: "For " + numM.en + " use " + shouldBe + " (" + pair + ").", de: "Bei " + numM.de + " gehört " + shouldBe + " (" + pair + ").", fr: "Au " + numM.fr + ", on dit " + shouldBe + " (" + pair + ")." });
          toks[gi].fix = shouldBe;
        } else {
          good.push({ nl: shouldBe + " past bij het woord erna.", en: shouldBe + " fits the word after it.", de: shouldBe + " passt zum Wort danach.", fr: shouldBe + " va avec le mot qui suit." });
        }
      }
    }

    // Ser en estar
    var hasEstar = has(["estoy", "estás", "está", "estamos", "están"]);
    var hasSer = has(["soy", "eres", "es", "somos", "son"]);
    if (hasEstar && has(NAT)) bad.push({ nl: "Nationaliteit gebruik je met ser: soy holandés. Estar is voor een toestand of een plek.", en: "Nationality goes with ser: soy holandés. Estar is for a state or a place.", de: "Nationalität benutzt man mit ser: soy holandés. Estar ist für einen Zustand oder einen Ort.", fr: "La nationalité va avec ser : soy holandés. Estar sert pour un état ou un lieu." });
    if (hasSer && has(STATE.filter(function (x) { return x !== "triste"; }))) bad.push({ nl: "Een tijdelijke toestand gebruik je met estar: estoy cansado.", en: "A temporary state goes with estar: estoy cansado.", de: "Ein vorübergehender Zustand wird mit estar gesagt: estoy cansado.", fr: "Un état temporaire va avec estar : estoy cansado." });
    if (hasEstar && (has(STATE) || has(["aquí", "allí", "en"]))) good.push({ nl: "Estar past bij een toestand of plek.", en: "Estar fits a state or a place.", de: "Estar passt zu einem Zustand oder Ort.", fr: "Estar convient pour un état ou un lieu." });

    // Bijvoeglijk naamwoord
    if (subjP !== null && (hasEstar || hasSer)) {
      var sl = toks[subjIdx].low;
      var fem = (sl === "ella" || sl === "ellas" || sl === "nosotras");
      // Bij yo, tú, usted en ustedes hangt het geslacht van de spreker af: -o en -a zijn dan allebei goed.
      var genderKnown = ["él", "ella", "ellos", "ellas", "nosotros", "nosotras"].indexOf(sl) >= 0;
      var plur = (subjP === 3 || subjP === 4);
      toks.forEach(function (t) {
        var mm = t.low.match(/^(.*?)(os|as|o|a)$/);
        if (!mm || ADJ_STEMS.indexOf(mm[1]) < 0) return;
        var isF = /as?$/.test(mm[2]);
        var expected = mm[1] + ((genderKnown ? fem : isF) ? "a" : "o") + (plur ? "s" : "");
        if (t.low !== expected) {
          bad.push({ nl: "Het bijvoeglijk naamwoord past bij het onderwerp: " + expected + " (niet " + t.core + ").", en: "The adjective must match the subject: " + expected + " (not " + t.core + ").", de: "Das Adjektiv passt zum Subjekt: " + expected + " (nicht " + t.core + ").", fr: "L'adjectif doit correspondre au sujet : " + expected + " (pas " + t.core + ")." });
          t.fix = expected;
        } else {
          good.push({ nl: expected + " past qua vorm bij het onderwerp.", en: expected + " matches the subject in form.", de: expected + " passt in der Form zum Subjekt.", fr: expected + " correspond au sujet pour la forme." });
        }
      });
    }

    // Lidwoorden
    toks.forEach(function (t, i) {
      var n = toks[i + 1];
      if (!n) return;
      var g = NOUN_G[n.low];
      if (!g) return;
      if ((t.low === "el" || t.low === "un") && g === "f") {
        var f1 = t.low === "el" ? "la" : "una";
        bad.push({ nl: n.core + " is vrouwelijk: " + f1 + " " + n.core + ".", en: n.core + " is feminine: " + f1 + " " + n.core + ".", de: n.core + " ist weiblich: " + f1 + " " + n.core + ".", fr: n.core + " est féminin : " + f1 + " " + n.core + "." });
        t.fix = f1;
      }
      if ((t.low === "la" || t.low === "una") && g === "m") {
        var m1 = t.low === "la" ? "el" : "un";
        bad.push({ nl: n.core + " is mannelijk: " + m1 + " " + n.core + ".", en: n.core + " is masculine: " + m1 + " " + n.core + ".", de: n.core + " ist männlich: " + m1 + " " + n.core + ".", fr: n.core + " est masculin : " + m1 + " " + n.core + "." });
        t.fix = m1;
      }
    });

    // Bruikbare structuren
    var nci = seq(["no", "creo", "que"]);
    if (seq(["creo", "que"]) >= 0 && nci < 0) good.push({ nl: "Creo que + zin geeft je mening. Een sterke opbouw.", en: "Creo que + sentence gives your opinion. A strong structure.", de: "Creo que + Satz drückt deine Meinung aus. Ein starker Aufbau.", fr: "Creo que + phrase exprime ton avis. Une bonne structure." });
    var vi = seq(["voy", "a"]);
    if (vi >= 0 && isInf(words[vi + 2])) good.push({ nl: "Voy a + infinitief is de gewone manier om over de toekomst te praten.", en: "Voy a + infinitive is the usual way to talk about the future.", de: "Voy a + Infinitiv ist die übliche Art, über die Zukunft zu sprechen.", fr: "Voy a + infinitif est la façon habituelle de parler du futur." });
    var ti = seq(["tengo", "que"]);
    if (ti >= 0 && isInf(words[ti + 2])) good.push({ nl: "Tengo que + infinitief betekent: ik moet iets doen.", en: "Tengo que + infinitive means: I have to do something.", de: "Tengo que + Infinitiv heißt: ich muss etwas tun.", fr: "Tengo que + infinitif veut dire : je dois faire quelque chose." });
    var qi = seq(["quiero"]);
    if (qi >= 0 && isInf(words[qi + 1])) good.push({ nl: "Quiero + infinitief betekent: ik wil iets doen.", en: "Quiero + infinitive means: I want to do something.", de: "Quiero + Infinitiv heißt: ich möchte etwas tun.", fr: "Quiero + infinitif veut dire : je veux faire quelque chose." });
    ["porque", "pero", "cuando", "aunque"].forEach(function (w) {
      if (words.indexOf(w) >= 0) good.push({ nl: w + " verbindt twee gedachten. Goed om uit te breiden.", en: w + " links two ideas. Good for expanding.", de: w + " verbindet zwei Gedanken. Gut zum Erweitern.", fr: w + " relie deux idées. Bon pour enrichir la phrase." });
    });
    var ei = seq(["espero", "que"]);
    if (ei >= 0) {
      var nx = words[ei + 2] || "";
      if (["sea", "tenga", "vaya", "haga", "pueda", "venga", "esté", "sepa", "quiera"].indexOf(nx) >= 0) {
        good.push({ nl: "Espero que + subjunctief (" + nx + "): dat is een hoop uitdrukken.", en: "Espero que + subjunctive (" + nx + "): that expresses a hope.", de: "Espero que + Subjunktiv (" + nx + "): damit drückst du eine Hoffnung aus.", fr: "Espero que + subjonctif (" + nx + ") : cela exprime un espoir." });
      } else {
        tips.push({ nl: "Na espero que gebruik je de subjunctief: sea, tenga, vaya of pueda.", en: "After espero que you use the subjunctive: sea, tenga, vaya or pueda.", de: "Nach espero que benutzt du den Subjunktiv: sea, tenga, vaya oder pueda.", fr: "Après espero que, on utilise le subjonctif : sea, tenga, vaya ou pueda." });
      }
    }
    if (nci >= 0) tips.push({ nl: "Na no creo que gebruik je vaak de subjunctief: No creo que llueva.", en: "After no creo que you often use the subjunctive: No creo que llueva.", de: "Nach no creo que benutzt du oft den Subjunktiv: No creo que llueva.", fr: "Après no creo que, on utilise souvent le subjonctif : No creo que llueva." });

    // Uitbreiden
    if (!has(TIME)) grow.push({ nl: "Voeg een tijdsaanduiding toe: hoy (vandaag), ayer (gisteren), mañana (morgen) of siempre (altijd).", en: "Add a time word: hoy (today), ayer (yesterday), mañana (tomorrow) or siempre (always).", de: "Füg eine Zeitangabe hinzu: hoy (heute), ayer (gestern), mañana (morgen) oder siempre (immer).", fr: "Ajoute un repère de temps : hoy (aujourd'hui), ayer (hier), mañana (demain) ou siempre (toujours)." });
    if (words.length >= 3 && !has(["porque", "pero", "cuando", "aunque", "y"])) grow.push({ nl: "Voeg een reden toe met porque: ... porque ...", en: "Add a reason with porque: ... porque ...", de: "Füge einen Grund mit porque hinzu: ... porque ...", fr: "Ajoute une raison avec porque : ... porque ..." });
    if (seq(["creo"]) < 0 && seq(["me", "parece"]) < 0) grow.push({ nl: "Geef je mening met Creo que... of Me parece que...", en: "Give your opinion with Creo que... or Me parece que...", de: "Sag deine Meinung mit Creo que... oder Me parece que...", fr: "Exprime ton avis avec Creo que... ou Me parece que..." });
    if (!hasQ && !hasOpen) grow.push({ nl: "Maak er een vraag van om het gesprek gaande te houden: ¿...?", en: "Turn it into a question to keep the conversation going: ¿...?", de: "Mach eine Frage daraus, damit das Gespräch weitergeht: ¿...?", fr: "Fais-en une question pour faire vivre la conversation : ¿...?" });

    // Verbeterde versie
    var corrected = toks.map(function (t) { return t.pre + (t.fix !== null ? t.fix : t.core) + t.suf; }).join(" ");

    function section(titleKey, items, color) {
      if (!items.length) return null;
      var c = el("div", "card");
      var h = el("div", "sec-title", T(titleKey));
      h.style.color = color;
      c.appendChild(h);
      items.forEach(function (i) { c.appendChild(el("div", "line", "• " + L(i))); });
      return c;
    }
    if (!good.length && !bad.length && !tips.length) {
      frag.appendChild(el("div", "card", T("Ik herken nog geen bekende patronen. Probeer een zin met een werkwoord uit de tabel, zoals tengo, voy, quiero of me gusta.")));
    }
    [section("Dit gaat goed", good, "#15803d"),
     section("Dit moet anders", bad, "#b91c1c"),
     section("Tips", tips, "#92400e"),
     section("Zo breid je de zin uit", grow, "#1e40af")].forEach(function (s) { if (s) frag.appendChild(s); });
    if (corrected !== raw) {
      var cc = el("div", "card");
      cc.appendChild(el("div", "nl", T("Verbeterde versie")));
      var line = el("div", "line-row");
      var tx = el("div", "txt");
      tx.appendChild(el("div", "es", corrected));
      line.appendChild(tx);
      line.appendChild(speakBtn(corrected));
      cc.appendChild(line);
      frag.appendChild(cc);
    }
    return frag;
  }

  // ---------- Reageren ----------
  function styleList(list) {
    var f = el("div");
    list.forEach(function (s) {
      var c = el("div", "card");
      var line = el("div", "line-row");
      var tx = el("div", "txt");
      tx.appendChild(el("div", "nl", L(LBL[s[0]])));
      tx.appendChild(el("div", "es", s[1]));
      tx.appendChild(el("div", "nl", L(s[2])));
      line.appendChild(tx);
      line.appendChild(speakBtn(s[1]));
      c.appendChild(line);
      f.appendChild(c);
    });
    return f;
  }

  function viewReageren() {
    var w = el("div");
    var row = el("div", "chips");
    [["vraag", "Ik vraag"], ["vertelt", "Vriend vertelt"]].forEach(function (k) {
      row.appendChild(btn(T(k[1]), S.rKind === k[0] ? "primary small" : "small", function () {
        S.rKind = k[0]; S.rOpen = null; S.rSub = null; render();
      }));
    });
    w.appendChild(row);
    REACT.forEach(function (e, gi) {
      if (e.kind !== S.rKind || isUnderstood(e.es)) return;
      var card = el("div", "card");
      var head = el("div", "line-row");
      var tx = el("div", "txt");
      tx.appendChild(el("div", "es", e.es));
      tx.appendChild(el("div", "nl", L(e.m)));
      head.appendChild(tx);
      head.appendChild(speakBtn(e.es));
      head.appendChild(btn(S.rOpen === gi ? T("Sluit") : T("Reageer →"), "primary small", function () {
        S.rOpen = S.rOpen === gi ? null : gi; S.rSub = null; render();
      }));
      card.appendChild(head);
      card.appendChild(explainBox(e.es));
      if (S.rOpen === gi) {
        card.appendChild(el("h2", "", T("Jouw antwoord (stijl)")));
        card.appendChild(styleList(e.styles));
        if (e.vervolg && e.vervolg.length) {
          card.appendChild(el("h2", "", T("Vervolg: wat zegt de ander daarna?")));
          var vr = el("div", "chips");
          e.vervolg.forEach(function (v, vi) {
            vr.appendChild(btn(v.es, S.rSub === vi ? "primary small" : "small", function () {
              S.rSub = S.rSub === vi ? null : vi; render();
            }));
          });
          card.appendChild(vr);
          if (S.rSub !== null) {
            var v = e.vervolg[S.rSub];
            card.appendChild(el("div", "nl", L(v.m)));
            card.appendChild(styleList(v.styles));
          }
        }
      }
      w.appendChild(card);
    });
    return w;
  }

  // ---------- Leren ----------
  function viewKaarten() {
    var deck = allItems();
    var known = store.get("gekend", []);
    var todo = deck.filter(function (d) { return known.indexOf(d.es) < 0; });
    var w = el("div");
    w.appendChild(el("div", "stat", T("Gekend:") + " " + known.length + " / " + deck.length));
    if (!todo.length) {
      w.appendChild(el("div", "card", T("Alles gekend! Reset om opnieuw te beginnen.")));
      w.appendChild(btn(T("Reset voortgang"), "", function () { store.set("gekend", []); S.lIdx = 0; render(); }));
      return w;
    }
    var item = todo[S.lIdx % todo.length];
    var card = el("div", "card big");
    card.appendChild(el("div", "nl", T("Zeg het eerst hardop in het Spaans:")));
    card.appendChild(el("div", "", L(item.m)));
    if (S.lShow) card.appendChild(el("div", "big-es", item.es));
    w.appendChild(card);
    var r = el("div", "row");
    if (!S.lShow) {
      r.appendChild(btn(T("Toon Spaans"), "primary", function () { S.lShow = true; render(); }));
    } else {
      r.appendChild(speakBtn(item.es));
      r.appendChild(btn(T("Nog oefenen"), "", function () { S.lIdx++; S.lShow = false; render(); }));
      r.appendChild(btn(T("Gekend ✓"), "primary", function () {
        store.set("gekend", known.concat([item.es])); S.lShow = false; render();
      }));
    }
    w.appendChild(r);
    w.appendChild(btn(T("Reset voortgang"), "small", function () { store.set("gekend", []); S.lIdx = 0; render(); }));
    return w;
  }

  function viewQuiz() {
    var deck = allItems();
    var w = el("div");
    if (!S.quiz) {
      var it = deck[Math.floor(Math.random() * deck.length)];
      var others = shuffle(deck.filter(function (d) { return d.es !== it.es; })).slice(0, 2);
      S.quiz = { it: it, opts: shuffle([it].concat(others)), answered: null };
    }
    var q = S.quiz;
    w.appendChild(el("div", "stat", T("Score:") + " " + S.score[0] + " / " + S.score[1]));
    var big = el("div", "card big");
    big.appendChild(el("div", "nl", T("Wat betekent dit?")));
    big.appendChild(el("div", "big-es", q.it.es));
    w.appendChild(big);
    var r = el("div", "row");
    r.appendChild(speakBtn(q.it.es));
    w.appendChild(r);
    var opts = el("div", "row quiz-opts");
    q.opts.forEach(function (o) {
      var isRight = o.es === q.it.es;
      var b = btn(L(o.m), (q.answered && isRight) ? "primary" : "", function () {
        if (q.answered) return;
        q.answered = o.es;
        S.score[1]++;
        if (isRight) S.score[0]++;
        render();
      });
      b.disabled = !!q.answered;
      opts.appendChild(b);
    });
    w.appendChild(opts);
    if (q.answered) {
      var fb = el("div", "card");
      if (q.answered === q.it.es) fb.appendChild(el("div", "ok", T("Goed!")));
      else fb.appendChild(el("div", "bad", T("Niet helemaal. Het juiste antwoord is:") + " " + L(q.it.m)));
      fb.appendChild(el("div", "nl", T("Onthoud:") + " " + q.it.es + " = " + L(q.it.m)));
      w.appendChild(fb);
      w.appendChild(btn(T("Volgende vraag →"), "primary", function () { S.quiz = null; render(); }));
    }
    return w;
  }

  function viewGrammatica() {
    var w = el("div");
    GRAMMAR.forEach(function (g) {
      var c = el("div", "card");
      c.appendChild(el("div", "sec-title", typeof g.titel === "string" ? g.titel : L(g.titel)));
      c.appendChild(el("div", "", L(g.regel)));
      var line = el("div", "line-row");
      var tx = el("div", "txt");
      tx.appendChild(el("div", "es", g.voorbeeld));
      line.appendChild(tx);
      line.appendChild(speakBtn(g.voorbeeld));
      c.appendChild(line);
      c.appendChild(el("div", "nl", T("Waarom:") + " " + L(g.waarom)));
      w.appendChild(c);
    });
    return w;
  }

  function viewLeren() {
    var w = el("div");
    var row = el("div", "chips");
    [["kaarten", "Kaarten"], ["quiz", "Quiz"], ["grammatica", "Grammatica"]].forEach(function (k) {
      row.appendChild(btn(T(k[1]), S.lMode === k[0] ? "primary small" : "small", function () {
        S.lMode = k[0]; S.lShow = false; render();
      }));
    });
    w.appendChild(row);
    if (S.lMode === "kaarten") w.appendChild(viewKaarten());
    else if (S.lMode === "quiz") w.appendChild(viewQuiz());
    else w.appendChild(viewGrammatica());
    return w;
  }

  // ---------- Regels ----------
  function viewRegels() {
    var w = el("div");
    w.appendChild(el("div", "note", T("Lees een regel, bekijk de voorbeelden en doe de korte test. Tik op het luidsprekertje om een voorbeeld te horen.")));
    RULES.forEach(function (r, i) {
      var c = el("div", "card");
      c.appendChild(el("div", "sec-title", L(r.titel)));
      c.appendChild(el("div", "", L(r.uitleg)));
      r.voorbeelden.forEach(function (v) {
        var line = el("div", "line-row");
        var tx = el("div", "txt");
        tx.appendChild(el("div", "es", v[0]));
        tx.appendChild(el("div", "nl", L(v[1])));
        line.appendChild(tx);
        line.appendChild(speakBtn(v[0]));
        c.appendChild(line);
      });
      c.appendChild(el("div", "nl", T("Test:") + " " + L(r.test.vraag)));
      var row = el("div", "chips");
      r.test.opties.forEach(function (o, oi) {
        var answered = S.rAns[i] !== undefined;
        var b = btn(L(o), answered && oi === r.test.juist ? "primary small" : "small", function () {
          if (S.rAns[i] !== undefined) return;
          S.rAns[i] = oi;
          render();
        });
        b.disabled = answered;
        row.appendChild(b);
      });
      c.appendChild(row);
      if (S.rAns[i] !== undefined) {
        if (S.rAns[i] === r.test.juist) c.appendChild(el("div", "ok", T("Goed!")));
        else c.appendChild(el("div", "bad", T("Niet helemaal. Het juiste antwoord is:") + " " + L(r.test.opties[r.test.juist])));
      }
      w.appendChild(c);
    });
    w.appendChild(btn(T("Opnieuw beginnen"), "", function () { S.rAns = {}; render(); }));
    return w;
  }

  // ---------- Vertaalvak (bovenaan, op elke pagina) ----------
  function translateText(text) {
    var t = clean(text);
    if (!t) return null;
    var hit = null;
    allItems().forEach(function (it) { if (!hit && clean(L(it.m)) === t) hit = it; });
    if (hit) return { text: hit.es, whole: true };
    var ph = PHRASES_BY_LANG[lang];
    if (ph[t] !== undefined) return { text: ph[t], whole: true };
    var d = DICTS[lang];
    var words = t.split(" ");
    var out = [], parts = [], missing = [];
    var i = 0;
    while (i < words.length) {
      var matched = false;
      for (var n = 3; n >= 2 && !matched; n--) {
        if (i + n <= words.length) {
          var phrase = words.slice(i, i + n).join(" ");
          if (ph[phrase] !== undefined) {
            out.push(ph[phrase]); parts.push(phrase + " = " + ph[phrase]);
            i += n; matched = true;
          }
        }
      }
      if (matched) continue;
      var w = words[i];
      if (d[w] !== undefined) { out.push(d[w]); parts.push(w + " = " + d[w]); }
      else { out.push("?"); parts.push(w + " = ?"); missing.push(w); }
      i++;
    }
    return { text: out.join(" "), parts: parts, missing: missing };
  }

  function showTranslation() {
    var box = document.getElementById("transOut");
    var r = translateText(document.getElementById("vtxt").value);
    box.hidden = false;
    box.innerHTML = "";
    var close = el("button", "close", "×");
    close.type = "button";
    close.setAttribute("aria-label", T("Sluit"));
    close.onclick = function () { box.hidden = true; };
    box.appendChild(close);
    if (!r) {
      box.appendChild(el("div", "bad", T("Typ eerst iets.")));
      return;
    }
    box.appendChild(el("div", "es", r.text));
    if (r.whole) {
      box.appendChild(el("div", "nl", T("Dit is een vaste zin uit de gids.")));
    } else {
      if (r.parts.length) box.appendChild(el("div", "nl", T("Woord voor woord:") + " " + r.parts.join(" · ")));
      if (r.missing.length) {
        box.appendChild(el("div", "bad", T("Niet in de lijst:") + " " + r.missing.join(", ")));
        box.appendChild(el("div", "nl", T("Zoek het op of vraag het aan je gesprekspartner.")));
      } else {
        box.appendChild(el("div", "nl", T("Let op: woord voor woord. De volgorde en de vorm kunnen anders moeten.")));
      }
    }
    var row = el("div", "row");
    row.appendChild(speakBtn(r.text));
    box.appendChild(row);
  }

  // ---------- Gesprek (microfoon en typvak) ----------
  // ---- Zinnen herkennen en bijleren ----
  // Vergelijken gebeurt zonder accenten en leestekens, zodat kleine verschillen niet uitmaken.
  function norm(s) { return clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function lev(a, b) {
    var m = a.length, n = b.length, prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function near(a, b) {
    if (a === b) return true;
    var L2 = Math.max(a.length, b.length);
    if (L2 < 6 || Math.abs(a.length - b.length) > 3) return false;
    return lev(a, b) / L2 <= 0.18;
  }
  var TALK_RE = [];
  TALK.forEach(function (t, i) {
    // ^ en $ in een patroon gelden voor de hele zin
    var alts = [], depth = 0, cur = "";
    t.re.split("").forEach(function (ch) {
      if (ch === "(" || ch === "[") depth++;
      if (ch === ")" || ch === "]") depth--;
      if (ch === "|" && depth === 0) { alts.push(cur); cur = ""; } else cur += ch;
    });
    alts.push(cur);
    var anchored = alts.map(function (alt) {
      var st = alt.charAt(0) === "^", en = alt.charAt(alt.length - 1) === "$";
      var core = alt.replace(/^\^/, "").replace(/\$$/, "");
      return (st ? "^" : "(?:^| )") + "(?:" + core + ")" + (en ? "$" : "");
    }).join("|");
    try { TALK_RE[i] = new RegExp(anchored); } catch (e) { TALK_RE[i] = /$^/; }
  });
  function findTalk(n) {
    for (var i = 0; i < TALK.length; i++) { if (TALK_RE[i].test(n)) return TALK[i]; }
    return null;
  }
  function findReact(n) {
    var hit = null;
    var n2 = n.replace(/^(hola|oye|bueno|pues) /, "");
    REACT.forEach(function (r) { var k = norm(r.es); if (!hit && (k === n || k === n2)) hit = r; });
    if (!hit) REACT.forEach(function (r) { var k = norm(r.es); if (!hit && (near(k, n) || near(k, n2))) hit = r; });
    return hit;
  }
  // Wat de gebruiker de app zelf heeft geleerd (blijft op het toestel staan)
  function learned(kind) { var o = store.get(kind, {}); return (o && typeof o === "object") ? o : {}; }
  function learnSentence(es, meaning) { var o = learned("geleerdZin"); var k = norm(es); o[k] = o[k] || {}; o[k][lang] = meaning; store.set("geleerdZin", o); }
  function learnWord(w, meaning) { var o = learned("geleerdWoord"); o[lang] = o[lang] || {}; o[lang][norm(w)] = meaning; store.set("geleerdWoord", o); }
  function learnReply(es, reply) { var o = learned("geleerdAntwoord"); var k = norm(es); o[k] = o[k] || []; if (o[k].indexOf(reply) < 0) o[k].push(reply); store.set("geleerdAntwoord", o); }

  var REV_NORM = {};
  var VERB_ENDS = ["ieron", "iendo", "aron", "amos", "emos", "imos", "aste", "iste", "ando", "aba", "ado", "ido", "ais", "eis", "an", "as", "en", "es", "io", "a", "e", "o", "i"];
  function revNorm(rev) {
    if (!REV_NORM[lang]) {
      var o = nullProto({}), k;
      for (k in rev) { var nk = norm(k); if (o[nk] === undefined) o[nk] = rev[k]; }
      REV_NORM[lang] = o;
    }
    return REV_NORM[lang];
  }
  function esToLang(text) {
    var t = clean(text), n = norm(text);
    var ls = learned("geleerdZin")[n];
    if (ls && ls[lang]) return { text: ls[lang], whole: true, learned: true };
    var hit = null;
    allItems().forEach(function (it) { if (!hit && clean(it.es) === t) hit = it; });
    if (!hit) allItems().forEach(function (it) { if (!hit && norm(it.es) === n) hit = it; });
    if (hit) return { text: L(hit.m), whole: true, es: hit.es };
    var r = findReact(n);
    if (r) return { text: L(r.m), whole: true, es: r.es };
    var tk = findTalk(n);
    if (tk && !tk.gen) return { text: L(tk.m), whole: true, es: tk.es, about: norm(tk.es) !== n };
    allItems().forEach(function (it) { if (!hit && near(norm(it.es), n)) hit = it; });
    if (hit) return { text: L(hit.m), whole: true, es: hit.es, about: true };
    // Grammatica-motor (NL, EN, DE, FR): eerst de zin ontleden en opbouwen.
    // Lukt dat niet, dan valt de app terug op woord-voor-woord.
    if (typeof GRAM !== "undefined") {
      var gw = function (s) {
        var lwx = learned("geleerdWoord")[lang] || {};
        if (lwx[norm(s)] !== undefined) return lwx[norm(s)];
        var PHX = (typeof PHRASES_ES !== "undefined" && PHRASES_ES[lang]) || {};
        if (PHX[s] !== undefined) return PHX[s];
        if (s.indexOf(" ") >= 0) return undefined;
        var rvx = REVS[lang];
        return rvx[s] !== undefined ? rvx[s] : revNorm(rvx)[norm(s)];
      };
      var gr = GRAM.translate(text, gw, lang);
      if (gr) return { text: gr.text, parts: gr.parts, missing: [], grammar: true };
    }
    var rev = REVS[lang], lw = learned("geleerdWoord")[lang] || {};
    var out = [], parts = [], missing = [];
    // Eerst meerwoordige uitdrukkingen (bijv. "fin de semana") als één geheel
    var PHE = (typeof PHRASES_ES !== "undefined" && PHRASES_ES[lang]) || {};
    var tw = t.split(" "), tokens = [];
    for (var ti = 0; ti < tw.length; ti++) {
      var hitP = null;
      for (var sz = 3; sz >= 2 && !hitP; sz--) {
        var cand = tw.slice(ti, ti + sz).join(" ");
        if (ti + sz <= tw.length && PHE[cand] !== undefined) hitP = { n: sz, w: cand, v: PHE[cand] };
      }
      if (hitP) { tokens.push({ w: hitP.w, v: hitP.v }); ti += hitP.n - 1; }
      else tokens.push({ w: tw[ti], v: undefined });
    }
    tokens.forEach(function (tok) {
      var w = tok.w;
      if (!w) return;
      if (tok.v !== undefined) { out.push(tok.v); parts.push(w + " = " + tok.v); return; }
      var v = lw[norm(w)] !== undefined ? lw[norm(w)] : rev[w];
      if (v === undefined) v = revNorm(rev)[norm(w)]; // ook zonder accenten getypt (rapido = rápido)
      var inf = null;
      if (v === undefined) { // vervoegde vorm: zoek het hele werkwoord op (trabaja -> trabajar)
        var rn = revNorm(rev), nw = norm(w);
        VERB_ENDS.some(function (e) {
          if (nw.length - e.length < 2 || nw.slice(-e.length) !== e) return false;
          return ["ar", "er", "ir"].some(function (x) {
            var c = nw.slice(0, nw.length - e.length) + x;
            if (rn[c] !== undefined) { v = rn[c]; inf = c; return true; }
            return false;
          });
        });
      }
      if (inf) { out.push(v); parts.push(w + " = " + v + " (" + inf + ")"); }
      else if (v !== undefined) { out.push(v); parts.push(w + " = " + v); }
      else { out.push("?"); parts.push(w + " = ?"); missing.push(w); }
    });
    return { text: out.join(" "), parts: parts, missing: missing };
  }

  // ---------- Geslacht van de gesprekspartner ----------
  // Instelling: "auto" (uit de zin van de partner, anders neutraal), "neutraal", "hij" of "zij".
  // We raden nooit uit de stem: alleen als de partner zelf een bijvoeglijk naamwoord met -o of -a gebruikt.
  var GEN_ADJ = ["cansad", "preocupad", "nervios", "emocionad", "preparad", "content", "list", "ocupad", "sorprendid", "enfadad", "perdid"];
  function partnerGenderSetting() { return store.get("partnerGender", "auto"); }
  function partnerGenderEffective() {
    var s0 = partnerGenderSetting();
    if (s0 === "hij" || s0 === "zij") return s0;
    if (s0 === "neutraal") return "neutraal";
    return store.get("partnerGenderAuto", null) || "neutraal";
  }
  // Uit een mededeling van de partner over zichzelf (estoy/soy/me siento + bijvoeglijk naamwoord)
  function detectPartnerGender(text) {
    if (/[¿?]/.test(text)) return null; // vragen gaan over de gebruiker, niet over de partner
    var m0 = text.toLowerCase().match(new RegExp("\\b(estoy|soy|me siento|estuve|estaba)\\s+(?:un poco |muy |bastante |algo |tan |)?(" + GEN_ADJ.join("|") + ")(o|a)\\b"));
    if (!m0) return null;
    return m0[3] === "a" ? "zij" : "hij";
  }
  // Maakt de Spaanse vorm passend bij het geslacht van de partner (hij: -o, zij: -a, neutraal: o/a)
  function genderEs(es) {
    if (!es) return es;
    var g = partnerGenderEffective();
    return es.replace(new RegExp("\\b(" + GEN_ADJ.join("|") + ")(o|a)(\\/a)?\\b", "g"), function (all, stem) {
      if (g === "hij") return stem + "o";
      if (g === "zij") return stem + "a";
      return stem + "o/a";
    });
  }

  function makeTurn(text) {
    var n = norm(text);
    var genDetected = detectPartnerGender(text);
    if (genDetected) store.set("partnerGenderAuto", genDetected);
    var ANS = UI["Antwoord"];
    var replies = [];
    (learned("geleerdAntwoord")[n] || []).forEach(function (r) { replies.push({ label: UI["Mijn antwoord"], es: r, m: null }); });
    var react = findReact(n), tk = react ? null : findTalk(n);
    if (react) react.styles.forEach(function (s) { replies.push({ label: LBL[s[0]], es: s[1], m: s[2] }); });
    else if (tk) tk.a.forEach(function (x) { replies.push({ label: ANS, es: x.es, m: x.m }); });
    var fu = [];
    if (!react && !tk) {
      // Geen vast patroon: antwoorden en vragen gaan over het onderwerp van de zin, nooit over iets anders.
      var tp = topicOf(text), isQ = /[¿?]/.test(text);
      var tr = tp ? topicReplies(tp, isQ) : null;
      if (tr) {
        replies.push({ label: ANS, es: tr.answer.es, m: tr.answer.m });
        fu = tr.questions.map(function (x) { return { label: UI["Vraag door"], es: x.es, m: x.m }; });
      } else {
        // Geen onderwerp te vinden: vraag om herhaling of uitleg van wat er gezegd is
        [
          { es: "¿Puedes repetirlo, por favor?", m: { nl: "Kun je dat herhalen, alsjeblieft?", en: "Can you repeat that, please?", de: "Kannst du das bitte wiederholen?", fr: "Tu peux répéter, s'il te plaît ?" } },
          { es: "¿Qué quieres decir?", m: { nl: "Wat bedoel je?", en: "What do you mean?", de: "Was meinst du?", fr: "Qu'est-ce que tu veux dire ?" } }
        ].forEach(function (x) { fu.push({ label: UI["Vraag door"], es: x.es, m: x.m }); });
      }
    }
    var opts = replies.concat(fu).map(function (o) {
      // Eigen opgeslagen antwoorden blijven precies zoals de gebruiker ze schreef
      return o.label === UI["Mijn antwoord"] ? o : { label: o.label, es: genderEs(o.es), m: o.m };
    });
    return { es: text.trim(), tr: esToLang(text), options: opts, gen: genDetected };
  }

  // Zoekt het onderwerp van een zin: het zelfstandig naamwoord na een lidwoord of bezittelijk voornaamwoord
  var TOPIC_STOP = ["el", "la", "los", "las", "un", "una", "unos", "unas", "tu", "tus", "mi", "mis", "su", "sus",
    "de", "del", "que", "como", "qué", "por", "para", "y", "o", "a", "en", "con", "es", "son", "esta", "está", "estás",
    "estoy", "estamos", "tiene", "tienes", "tengo", "hay", "muy", "bien", "hoy", "ya", "no", "sí", "si", "te", "me", "se",
    "lo", "le", "al", "yo", "tú", "usted", "fin", "cuando", "donde", "dónde", "cuándo", "cuánto", "cuántos", "también"];
  var TOPIC_M = ["mapa", "día", "problema", "sistema", "programa", "idioma", "planeta", "tema", "clima", "sofá"];

  function topicOf(text) {
    var ws = text.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, " ").split(/\s+/).filter(Boolean);
    var DET = ["el", "la", "los", "las", "un", "una", "tu", "tus", "mi", "mis", "su", "sus"];
    var mk = function (det, noun) {
      var art = (det === "la" || det === "las") ? "la" : (det === "el" || det === "los") ? "el" : null;
      if (!art) art = (/a$/.test(noun) && TOPIC_M.indexOf(noun) < 0) ? "la" : "el";
      return { es: noun, art: art, det: det };
    };
    for (var i = 0; i < ws.length - 1; i++) {
      if (DET.indexOf(ws[i]) >= 0 && TOPIC_STOP.indexOf(ws[i + 1]) < 0 && ws[i + 1].length > 2) return mk(ws[i], ws[i + 1]);
    }
    return null; // zonder lidwoord of bezittelijk voornaamwoord geen onderwerp (bijv. "hace frío")
  }

  // Vertaling van het onderwerp in een taal, zonder lidwoord (voor de Nederlandse, Engelse, Duitse en Franse zinnen)
  function topicGloss(l, es) {
    var r = REVS[l], v = r && r[es];
    if (!v) return es;
    v = String(v).split(/\s*[\/;,]\s*/)[0];
    if (l === "de" || l === "fr") v = v.replace(/^(der|die|das|ein|eine|le|la|les|un|une|l')\s*/i, "");
    return v;
  }

  // Antwoorden over het onderwerp van de zin. Het geslacht komt uit de tabel van de grammatica.
  // Staat het woord niet in de tabel, dan blijven de antwoorden zonder naam ("Ich mag es.") en
  // blijft het antwoord over het onderwerp, nooit een willekeurige vraag.
  function topicReplies(tp, isQ) {
    var x = tp.es, art = tp.art, dk = tp.det;
    var dSpec = (dk === "un" || dk === "una") ? "un" : (dk === "tu" || dk === "tus") ? "tu" : (dk === "mi" || dk === "mis") ? "mi" : "el";
    var gD = (typeof GRAM !== "undefined") ? GRAM.gen(x, "de") : null;
    var gF = (typeof GRAM !== "undefined") ? GRAM.gen(x, "fr") : null;
    var known = !!(gD && gF);
    var g = gD || "m", gfr = gF || "m";
    var np = function (l, det, role) { return known ? GRAM.np(l, det, x, role, null) : null; };
    var capDE = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    var nlN = topicGloss("nl", x), enBare = topicGloss("en", x), enN = "the " + enBare;
    var nlNoun = (g === "n" ? "het " : "de ") + nlN;
    var nlPron = { m: "hij", f: "zij", n: "het" }[g];
    var pDE = { m: "er", f: "sie", n: "es" }[g], pFR = gfr === "f" ? "elle" : "il";
    var deAcc = np("de", dSpec, "acc"), frAcc = np("fr", dSpec, "acc");
    var deNom = np("de", "el", "nom");
    if (!isQ) { // mededeling: reageer enthousiast en vraag door over hetzelfde onderwerp
      return {
        answer: { es: "¡Qué bien! Me gusta " + art + " " + x + ".",
          m: { nl: "Wat leuk! Ik vind " + nlNoun + " ook leuk.", en: "How nice! I like " + enN + ".",
            de: "Wie schön! Ich mag " + (deAcc || "es") + ".",
            fr: "Super ! " + (frAcc ? "J'aime " + frAcc : "Je l'aime bien") + "." } },
        questions: [
          { es: "¿Cómo se llama " + art + " " + x + "?",
            m: { nl: "Hoe heet " + nlPron + "?", en: "What is its name?",
              de: "Wie heißt " + (known ? pDE : "es") + "?", fr: "Comment s'appelle-t-" + (known ? pFR : "il") + " ?" } },
          { es: "¿Cómo es " + art + " " + x + "?",
            m: { nl: "Hoe is " + nlNoun + "?", en: "What is " + enN + " like?",
              de: "Wie ist " + (deNom || "es") + "?", fr: "Comment est-" + (known ? pFR : "il") + " ?" } }
        ]
      };
    }
    return {
      answer: { es: "Mi " + x + " está muy bien, gracias.",
        m: { nl: "Met mijn " + nlN + " gaat het goed, dank je.", en: "My " + enBare + " is doing very well, thanks.",
          de: (known ? capDE(np("de", "mi", "dat")) + " geht es" : "Es geht ihm") + " sehr gut, danke.",
          fr: known ? "Ça va très bien pour " + np("fr", "mi", "acc") + ", merci." : "Ça va très bien, merci." } },
      questions: [
        { es: "¿Te gusta " + art + " " + x + "?",
          m: { nl: "Vind je " + nlNoun + " leuk?", en: "Do you like " + enN + "?",
            de: "Magst du " + (deAcc || "es") + "?", fr: "Tu aimes " + (frAcc || "ça") + " ?" } },
        { es: "¿Cómo es " + art + " " + x + "?",
          m: { nl: "Hoe is " + nlNoun + "?", en: "What is " + enN + " like?",
            de: "Wie ist " + (deNom || "es") + "?", fr: "Comment est-" + (known ? pFR : "il") + " ?" } }
      ]
    };
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function errorText(code) {
    if (code === "not-allowed" || code === "service-not-allowed") return T("Microfoon is niet toegestaan op deze pagina. Typ hieronder wat je gesprekspartner zei.");
    if (code === "no-speech") return T("Geen spraak gehoord. Probeer het opnieuw.");
    if (code === "audio-capture" && isIOS()) return T("Op iPhone werkt spraakherkenning in Safari vaak niet. Typ hieronder wat je gesprekspartner zei.");
    if (code === "audio-capture") return T("De microfoon kan niet worden gebruikt. Sluit andere apps of tabbladen die de microfoon gebruiken, controleer de microfoon-toegang van je browser, of typ hieronder.");
    return T("Spraakherkenning gaf een fout") + " (" + code + "). " + T("Typ hieronder wat je gesprekspartner zei.");
  }

  // ---- Spraak op iPhone: Whisper draait in de browser (gratis, zonder server) ----
  // De gebruiker kiest zelf of en welk spraakmodel wordt gedownload; daarna blijft het op het toestel staan.
  var WH = { rec: null, chunks: [], stream: null, worker: null, ready: false, pending: null, jobs: {}, jobId: 0 };
  var WH_MODELS = { tiny: "onnx-community/whisper-tiny", base: "onnx-community/whisper-base" };

  // Diagnose: elke stap van de spraakroute wordt genoteerd, zodat een fout precies aan te wijzen is.
  var APP_VERSION = "45";
  var WH_LOG = [];
  function whLog(msg) {
    var d = new Date();
    WH_LOG.push(("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + " " + msg);
    if (WH_LOG.length > 40) WH_LOG.shift();
  }
  function whReport() {
    return "Speech Partner v" + APP_VERSION + "\n" + navigator.userAgent + "\n" +
      "standalone: " + (!!navigator.standalone) + " | model: " + store.get("whModel", "-") + " | ready: " + WH.ready + "\n" +
      (WH_LOG.length ? WH_LOG.join("\n") : "(nog geen stappen)");
  }
  window.addEventListener("error", function (e) { whLog("JS-fout: " + (e && e.message)); });
  window.addEventListener("unhandledrejection", function (e) { whLog("Promise-fout: " + (e && e.reason && (e.reason.message || e.reason))); });

  function whSetStatus(text) {
    S.whStatus = text;
    var n = document.getElementById("whStatus");
    if (n) { n.textContent = text; n.style.display = text ? "" : "none"; }
  }
  // Het model draait in een aparte werker; laden gebeurt altijd VOOR het opnemen, nooit tijdens.
  function whLoad() {
    if (WH.ready) return Promise.resolve(true);
    if (WH.pending) return WH.pending;
    var model = WH_MODELS[store.get("whModel", "tiny")] || WH_MODELS.tiny;
    S.whLoading = true;
    whLog("model laden: " + model);
    whSetStatus(T("Spraakmodel laden…"));
    WH.pending = new Promise(function (resolve, reject) {
      var w;
      try { w = new Worker("js/whisper-worker.js", { type: "module" }); } catch (e) { reject(e); return; }
      WH.worker = w; WH.jobs = {}; WH.jobId = 0;
      w.onmessage = function (ev) {
        var d = ev.data || {};
        if (d.type === "progress") {
          whSetStatus(T("Spraakmodel laden…") + " " + Math.round(d.loaded / 1048576) + " / " + Math.round(d.total / 1048576) + " MB");
        } else if (d.type === "ready") {
          resolve(true);
        } else if (d.type === "result") {
          if (WH.jobs[d.id]) { WH.jobs[d.id][0](d.text); delete WH.jobs[d.id]; }
        } else if (d.type === "error") {
          if (d.phase === "load") reject(new Error(d.message));
          else if (WH.jobs[d.id]) { WH.jobs[d.id][1](new Error(d.message)); delete WH.jobs[d.id]; }
        }
      };
      w.onerror = function (e) { reject(new Error((e && e.message) || "worker")); };
      w.postMessage({ type: "load", model: model });
    }).then(function () {
      WH.ready = true; S.whLoading = false; whSetStatus("");
      whLog("model klaar");
      return true;
    }, function (e) {
      WH.pending = null; WH.ready = false; S.whLoading = false; whSetStatus("");
      whLog("model FOUT: " + (e && e.message));
      if (WH.worker) { try { WH.worker.terminate(); } catch (x) {} WH.worker = null; }
      throw e;
    });
    return WH.pending;
  }
  function whReset() {
    if (WH.worker) { try { WH.worker.terminate(); } catch (x) {} }
    WH.worker = null; WH.pending = null; WH.ready = false; S.whLoading = false;
  }
  function whRun(audio) {
    return new Promise(function (resolve, reject) {
      var id = ++WH.jobId;
      WH.jobs[id] = [resolve, reject];
      WH.worker.postMessage({ type: "run", id: id, audio: audio }, [audio.buffer]);
    });
  }
  function whLoadWithNote() {
    return whLoad().then(function () {
      S.note = T("Het spraakmodel is klaar. Tik op Opnemen.");
      if (S.tab === "gesprek") render();
    }).catch(function (e) {
      S.note = whErr(e);
      if (S.tab === "gesprek") render();
    });
  }

  // Geluid decoderen en zelf naar 16 kHz mono omrekenen (werkt ook op oudere iPhones).
  function whDecode(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var AC = window.AudioContext || window.webkitAudioContext;
      var ac = new AC();
      return new Promise(function (res, rej) { ac.decodeAudioData(buf, res, rej); }).then(function (audio) {
        try { if (ac.state !== "closed") ac.close().catch(function () {}); } catch (e) {}
        var ch = audio.numberOfChannels, len = audio.length, mono = new Float32Array(len), c, i;
        for (c = 0; c < ch; c++) {
          var d = audio.getChannelData(c);
          for (i = 0; i < len; i++) mono[i] += d[i] / ch;
        }
        var ratio = audio.sampleRate / 16000;
        var n = Math.max(1, Math.floor(len / ratio)), out = new Float32Array(n);
        for (i = 0; i < n; i++) {
          var pos = i * ratio, i0 = Math.floor(pos), i1 = Math.min(i0 + 1, len - 1), f = pos - i0;
          out[i] = mono[i0] * (1 - f) + mono[i1] * f;
        }
        return out;
      });
    });
  }

  function whErr(e) {
    var msg = e && (e.message || e.name) ? String(e.message || e.name).slice(0, 120) : "";
    return T("Spraakherkenning gaf een fout") + (msg ? " (" + msg + ")" : "") + ". " + T("Typ hieronder wat je gesprekspartner zei.");
  }

  // Keuzekaart: toestemming voor het downloaden van het spraakmodel
  function whConsentCard() {
    var c = el("div", "card panel");
    c.appendChild(el("div", "sec-title", T("Spraakmodel downloaden?")));
    c.appendChild(el("div", "", T("Om Spaans te verstaan op de iPhone downloadt de app eenmalig een spraakmodel. Het blijft daarna op je toestel staan en werkt ook zonder internet. Gebruik bij voorkeur wifi.")));
    var row = el("div", "chips");
    function choose(kind) {
      store.set("whModel", kind);
      whReset();
      S.whAsk = false; S.note = "";
      render();
      whLoadWithNote();
    }
    row.appendChild(btn(T("Snel (ongeveer 40 MB)"), "primary small", function () { choose("tiny"); }));
    row.appendChild(btn(T("Nauwkeuriger (ongeveer 80 MB, trager)"), "small", function () { choose("base"); }));
    row.appendChild(btn(T("Niet nu"), "small", function () { S.whAsk = false; render(); }));
    c.appendChild(row);
    return c;
  }

  // Opnemen op iPhone: het geluid wordt rechtstreeks als ruwe samples opgevangen (geen bestand
  // dat achteraf gedecodeerd moet worden), daarna naar 16 kHz gebracht en op volume gebracht.
  function whStart() {
    if (!store.get("whModel", null)) { S.whAsk = true; S.note = ""; go("gesprek"); return; }
    if (!WH.ready) {
      // Eerst het model laden (uit de opslag van het toestel), pas daarna opnemen.
      S.note = T("Het spraakmodel wordt nog geladen. Wacht even.");
      go("gesprek");
      whLoadWithNote();
      return;
    }
    if (WH.starting) return;
    WH.starting = true;
    var AC = window.AudioContext || window.webkitAudioContext;
    var ac = null;
    try { ac = new AC(); ac.resume(); } catch (e) { ac = null; whLog("AudioContext FOUT: " + e.message); }
    whLog("opname gevraagd; audio: " + (ac ? ac.state + " " + ac.sampleRate + " Hz" : "geen"));
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } }).then(function (stream) {
      WH.starting = false;
      WH.stream = stream; WH.pcm = [];
      var trk = stream.getAudioTracks()[0];
      whLog("microfoon ok: " + (trk ? trk.label + " (" + trk.readyState + ")" : "geen spoor"));
      if (trk) { trk.onended = function () { whLog("microfoonspoor BEEINDIGD door het systeem"); }; trk.onmute = function () { whLog("microfoon gedempt door het systeem"); }; }

      // Route 1: ruwe samples via de audio-motor. Op iPhone kan die motor stilvallen zodra de
      // microfoon start; daarom opnieuw starten, en zo nodig een nieuwe motor maken.
      function wire(ctx) {
        WH.ac = ctx; WH.rate = ctx.sampleRate;
        var src = ctx.createMediaStreamSource(stream);
        var proc = ctx.createScriptProcessor(4096, 1, 1);
        var mute = ctx.createGain(); mute.gain.value = 0;
        proc.onaudioprocess = function (e) { WH.pcm.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
        src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
        WH.src = src; WH.proc = proc;
        ctx.onstatechange = function () { whLog("audio-status: " + ctx.state); };
        try { ctx.resume(); } catch (e) {}
        whLog("audio-motor gekoppeld: " + ctx.state + " " + ctx.sampleRate + " Hz");
      }
      try { if (!ac) ac = new AC(); wire(ac); } catch (e) { whLog("audio-motor FOUT: " + e.message); }
      WH.watch = setTimeout(function () {
        if (!S.wrec || WH.pcm.length) return;
        whLog("geen samples na 0,8 s (status " + (WH.ac ? WH.ac.state : "-") + "); nieuwe audio-motor");
        try { WH.proc.onaudioprocess = null; WH.src.disconnect(); WH.proc.disconnect(); WH.ac.close().catch(function () {}); } catch (e) {}
        try { wire(new AC()); } catch (e) { whLog("nieuwe audio-motor FOUT: " + e.message); }
      }, 800);

      // Route 2 (reserve): gewone opname als bestand, voor als route 1 niets oplevert.
      WH.rec = null; WH.chunks = [];
      if (window.MediaRecorder) {
        try {
          var rec = new MediaRecorder(stream);
          rec.ondataavailable = function (e) { if (e.data && e.data.size) WH.chunks.push(e.data); };
          rec.start();
          WH.rec = rec;
          whLog("reserve-opname gestart (" + (rec.mimeType || "?") + ")");
        } catch (e) { whLog("reserve-opname FOUT: " + e.message); }
      }
      S.listening = true; S.wrec = true; S.note = "";
      updateMic(); render();
    }).catch(function (e) {
      WH.starting = false;
      whLog("microfoon FOUT: " + (e && (e.name + " " + e.message)));
      if (ac) { try { ac.close().catch(function () {}); } catch (x) {} }
      S.note = T("Microfoon is niet toegestaan op deze pagina. Typ hieronder wat je gesprekspartner zei.");
      go("gesprek");
    });
  }

  // Samples naar 16 kHz brengen
  function whTo16k(flat, rate) {
    var ratio = rate / 16000, len = flat.length, n = Math.floor(len / ratio), out = new Float32Array(n), i;
    for (i = 0; i < n; i++) {
      var pos = i * ratio, i0 = Math.floor(pos), i1 = Math.min(i0 + 1, len - 1), f = pos - i0;
      out[i] = flat[i0] * (1 - f) + flat[i1] * f;
    }
    return out;
  }

  function whStop() {
    clearTimeout(WH.watch);
    try { WH.proc.onaudioprocess = null; WH.src.disconnect(); WH.proc.disconnect(); } catch (e) {}
    var rate = WH.rate || 48000;
    var chunks = WH.pcm || []; WH.pcm = [];
    var len = 0, i;
    for (i = 0; i < chunks.length; i++) len += chunks[i].length;
    whLog("opname gestopt: route 1 gaf " + chunks.length + " blokken, " + (Math.round(len / rate * 10) / 10) + " s, " + rate + " Hz");
    S.listening = false; S.wrec = false;
    S.note = T("Bezig met verwerken…");
    updateMic(); go("gesprek");

    function release() {
      if (WH.stream) { WH.stream.getTracks().forEach(function (t) { t.stop(); }); WH.stream = null; }
      if (WH.ac) { try { WH.ac.close().catch(function () {}); } catch (e) {} WH.ac = null; }
    }
    // Reserve-opname afsluiten en als samples teruggeven (of null)
    function backup() {
      var rec = WH.rec; WH.rec = null;
      if (!rec || rec.state === "inactive") return Promise.resolve(null);
      return new Promise(function (resolve) {
        var done = false;
        function fin() {
          if (done) return; done = true;
          var blob = new Blob(WH.chunks, { type: rec.mimeType || "audio/mp4" });
          WH.chunks = [];
          whLog("reserve-opname: " + blob.size + " bytes");
          if (!blob.size) { resolve(null); return; }
          whDecode(blob).then(resolve, function (e) { whLog("reserve decoderen FOUT: " + (e && e.message)); resolve(null); });
        }
        rec.onstop = fin;
        try { rec.stop(); } catch (e) { fin(); }
        setTimeout(fin, 2500);
      });
    }

    var p;
    if (len >= rate * 0.3) {
      var flat = new Float32Array(len), o = 0;
      for (i = 0; i < chunks.length; i++) { flat.set(chunks[i], o); o += chunks[i].length; }
      var peak1 = 0;
      for (i = 0; i < len; i += 7) { var a = flat[i] < 0 ? -flat[i] : flat[i]; if (a > peak1) peak1 = a; }
      if (peak1 > 0.002) { if (WH.rec) { try { WH.rec.stop(); } catch (e) {} WH.rec = null; } p = Promise.resolve(whTo16k(flat, rate)); }
      else { whLog("route 1 is stil (volume 0%); reserve gebruiken"); p = backup(); }
    } else {
      p = backup();
    }
    p.then(function (out) {
      release();
      if (!out || out.length < 16000 * 0.3) {
        whLog("geen bruikbaar geluid uit beide routes");
        S.note = T("Geen spraak gehoord. Probeer het opnieuw.") + " (" + T("opname") + " 0 s)";
        go("gesprek"); return null;
      }
      var n = out.length, peak = 0, k;
      for (k = 0; k < n; k++) { var v = out[k] < 0 ? -out[k] : out[k]; if (v > peak) peak = v; }
      // Zachte opnames (partner op afstand) versterken tot een normaal niveau.
      if (peak > 0.002) { var g = Math.min(0.9 / peak, 40); for (k = 0; k < n; k++) out[k] *= g; }
      var secs = Math.round(n / 1600) / 10;
      whLog(secs + " s, volume " + Math.round(peak * 100) + "%; naar model");
      var info = " (" + T("opname") + " " + secs + " s, " + T("volume") + " " + Math.round(peak * 100) + "%";
      return whRun(out).then(function (res) {
        var text = String(res || "").trim();
        whLog("model antwoord: \"" + text.slice(0, 60) + "\"");
        S.note = "";
        // Whisper zet stilte of ruis soms om in (música) of [Music]: dat telt niet als zin.
        var junk = /^[\(\[\{].*[\)\]\}]$/.test(text) || /^[\W_]+$/.test(text);
        if (text.length >= 2 && !junk) S.convo.push(makeTurn(text));
        else S.note = T("Geen spraak gehoord. Probeer het opnieuw.") + info + (text ? ", " + T("gehoord") + ": " + text.slice(0, 40) : "") + ")";
        go("gesprek");
      });
    }).catch(function (e) {
      release();
      whLog("verwerken FOUT: " + (e && e.message));
      S.note = whErr(e);
      go("gesprek");
    });
  }

  function startMic() {
    if (S.listening) return;
    if (typeof prRelease === "function") prRelease();
    if (isIOS() && (window.AudioContext || window.webkitAudioContext) && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) { whStart(); return; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec = null;
    if (SR) { try { rec = new SR(); } catch (e) { rec = null; } }
    if (!rec) {
      S.note = T("Spraakherkenning werkt niet in deze browser. Gebruik Chrome of Edge, of typ hieronder.");
      go("gesprek");
      return;
    }
    rec.lang = "es-ES";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    var heard = [], errored = false;
    rec.onresult = function (ev) {
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          var t = (ev.results[i][0].transcript || "").trim();
          if (t) heard.push(t);
        }
      }
    };
    rec.onerror = function (ev) {
      var code = ev && ev.error;
      if (code === "aborted") return; // door de app zelf gestopt, geen fout
      errored = true; S.note = errorText(code);
    };
    var ended = false;
    rec.onend = function () {
      if (ended) return;
      ended = true;
      S.listening = false; S.rec = null;
      if (heard.length) {
        heard.forEach(function (t) { S.convo.push(makeTurn(t)); });
        S.note = "";
      } else if (!errored) {
        S.note = T("Geen spraak gehoord. Probeer het opnieuw.");
      }
      go("gesprek");
    };
    S.listening = true; S.rec = rec; S.note = "";
    updateMic();
    try { rec.start(); } catch (e) {
      S.listening = false; S.rec = null;
      S.note = T("Spraakherkenning werkt niet in deze browser. Gebruik Chrome of Edge, of typ hieronder.");
      go("gesprek");
    }
  }
  // Stoppen: als het spraak-einde-event uitblijft (gebeurt op iPhone), rond de opname zelf af.
  // Stoppen: laat de herkenning eerst de laatste zin verwerken (stop, niet abort);
  // alleen als het eindsignaal dan nog ontbreekt, rond de app zelf af.
  function stopMic() {
    if (S.wrec) { whStop(); return; }
    var rec = S.rec;
    if (!rec) return;
    try { rec.stop(); } catch (e) {}
    setTimeout(function () {
      if (S.rec === rec && rec.onend) rec.onend();
    }, 3000);
  }

  // ---------- Info: uitleg over de app, de maker en de bronnen ----------
  var INFO_SECTIONS = [
    { t: m("Wat is Speech Partner.Spanish?", "What is Speech Partner.Spanish?", "Was ist Speech Partner.Spanish?", "Qu'est-ce que Speech Partner.Spanish ?"),
      b: m("Een gratis hulpmiddel om Spaans te spreken, ook als je de taal nog niet goed kent. Je vindt er kant-en-klare zinnen, uitleg over de grammatica en een gesprekstrainer. De app werkt op je telefoon, zonder account en zonder server.",
           "A free tool to speak Spanish, even if you don't know the language well yet. It has ready-made sentences, grammar explanations and a conversation trainer. The app runs on your phone, without an account and without a server.",
           "Ein kostenloses Hilfsmittel, um Spanisch zu sprechen, auch wenn du die Sprache noch nicht gut kennst. Es gibt fertige Sätze, Grammatikerklärungen und einen Gesprächstrainer. Die App läuft auf deinem Telefon, ohne Konto und ohne Server.",
           "Un outil gratuit pour parler espagnol, même si tu ne le maîtrises pas encore. Il contient des phrases toutes prêtes, des explications de grammaire et un entraîneur de conversation. L'application fonctionne sur ton téléphone, sans compte et sans serveur.") },
    { t: m("Zo gebruik je de tabbladen", "How to use the tabs", "So benutzt du die Reiter", "Comment utiliser les onglets"),
      b: m("Zinnen: kant-en-klare zinnen per situatie, met de vertaling en een uitleg. Onderwerpen: zinnen per onderwerp. Vastlopen: wat je zegt als je even niets weet. Zin bouwen: maak zelf zinnen met een patroon. Reageren: antwoorden op wat je gesprekspartner zegt. Leren: korte lessen en oefeningen. Regels: grammatica in het kort, met een test. Gesprek: je gesprekspartner spreekt in, de app vertaalt en geeft antwoorden. Uitspraak: oefen je uitspraak met opnemen. Info: deze pagina.",
           "Sentences: ready-made sentences per situation, with translation and explanation. Topics: sentences per topic. Stuck: what to say when you don't know what to say. Build a sentence: make your own sentences with a pattern. React: answers to what your conversation partner says. Learn: short lessons and exercises. Rules: grammar in brief, with a test. Conversation: your partner speaks, the app translates and suggests answers. Pronunciation: practise your pronunciation by recording. Info: this page.",
           "Sätze: fertige Sätze pro Situation, mit Übersetzung und Erklärung. Themen: Sätze pro Thema. Hängen: was du sagst, wenn dir nichts einfällt. Satz bauen: eigene Sätze mit einem Muster. Reagieren: Antworten auf das, was dein Gesprächspartner sagt. Lernen: kurze Lektionen und Übungen. Regeln: Grammatik kurz gefasst, mit einem Test. Gespräch: dein Gesprächspartner spricht, die App übersetzt und schlägt Antworten vor. Aussprache: übe deine Aussprache mit Aufnehmen. Info: diese Seite.",
           "Phrases : phrases toutes prêtes par situation, avec traduction et explication. Sujets : phrases par sujet. Bloqué : que dire quand tu ne sais plus quoi dire. Construire une phrase : tes propres phrases avec un modèle. Réagir : réponses à ce que dit ton interlocuteur. Apprendre : courtes leçons et exercices. Règles : grammaire en bref, avec un test. Conversation : ton interlocuteur parle, l'application traduit et propose des réponses. Prononciation : entraîne ta prononciation en enregistrant. Info : cette page.") },
    { t: m("Spreken op de iPhone", "Speaking on iPhone", "Sprechen auf dem iPhone", "Parler sur iPhone"),
      b: m("Op de iPhone herkent de app spraak met een spraakmodel dat op je telefoon draait. Het model wordt één keer gedownload (ongeveer 40 of 80 MB; bij voorkeur via wifi). Daarna werkt het ook zonder internet. Tik op de microfoon, spreek de Spaanse zin en tik op Stop. Werkt spraak niet goed, typ dan de zin in het typvak.",
           "On iPhone the app recognises speech with a speech model that runs on your phone. The model is downloaded once (about 40 or 80 MB; preferably over Wi-Fi). After that it also works without internet. Tap the microphone, say the Spanish sentence and tap Stop. If speech doesn't work well, type the sentence in the text box.",
           "Auf dem iPhone erkennt die App Sprache mit einem Sprachmodell, das auf deinem Telefon läuft. Das Modell wird einmal heruntergeladen (etwa 40 oder 80 MB; am besten über WLAN). Danach funktioniert es auch ohne Internet. Tippe auf das Mikrofon, sprich den spanischen Satz und tippe auf Stopp. Funktioniert Sprache nicht gut, tippe den Satz in das Eingabefeld.",
           "Sur iPhone, l'application reconnaît la voix grâce à un modèle vocal qui tourne sur ton téléphone. Le modèle se télécharge une fois (environ 40 ou 80 Mo ; de préférence en Wi-Fi). Ensuite il fonctionne aussi hors ligne. Appuie sur le micro, dis la phrase espagnole puis appuie sur Stop. Si la voix ne marche pas bien, tape la phrase dans la zone de saisie.") },
    { t: m("Aanleren", "Teaching the app", "Der App etwas beibringen", "Enseigner à l'application"),
      b: m("Herkent de app een zin of woord niet? Dan kun je het zelf aanleren. Doe dat alleen als je de betekenis zeker weet; de app geeft je daarvoor een controleknop (vraag het na of controleer online). Wat je aanleert, blijft op je eigen toestel.",
           "If the app doesn't recognise a sentence or word, you can teach it yourself. Only do this if you are sure of the meaning; the app gives you a check button for that (ask or check online). What you teach stays on your own device.",
           "Erkennt die App einen Satz oder ein Wort nicht, kannst du es ihr selbst beibringen. Tu das nur, wenn du die Bedeutung sicher kennst; dafür gibt es eine Prüfknopf (nachfragen oder online prüfen). Was du beibringst, bleibt auf deinem eigenen Gerät.",
           "Si l'application ne reconnaît pas une phrase ou un mot, tu peux le lui apprendre. Fais-le seulement si tu es sûr du sens ; un bouton de vérification t'aide (demander ou vérifier en ligne). Ce que tu enseignes reste sur ton propre appareil.") },
    { t: m("Over de maker", "About the maker", "Über den Macher", "À propos de l'auteur"),
      b: m("Speech Partner.Spanish is ontworpen en gemaakt door Abel, in samenwerking met Claude (Anthropic). Abel bedacht de opzet, de inhoud en de werkwijze; Claude heeft de code en de teksten uitgewerkt en getest.",
           "Speech Partner.Spanish was designed and created by Abel, in collaboration with Claude (Anthropic). Abel devised the concept, content and approach; Claude developed and tested the code and texts.",
           "Speech Partner.Spanish wurde von Abel entworfen und erstellt, in Zusammenarbeit mit Claude (Anthropic). Abel hat das Konzept, den Inhalt und die Herangehensweise entwickelt; Claude hat den Code und die Texte ausgearbeitet und getestet.",
           "Speech Partner.Spanish a été conçu et créé par Abel, en collaboration avec Claude (Anthropic). Abel a imaginé le concept, le contenu et la démarche ; Claude a développé et testé le code et les textes.") },
    { t: m("Bronnen en licenties", "Sources and licences", "Quellen und Lizenzen", "Sources et licences"),
      b: m("Woordenlijst: Wiktionary, CC BY-SA 4.0, via kaikki.org. Spraakherkenning: Whisper (OpenAI, MIT-licentie) via Hugging Face en Transformers.js (Apache 2.0). De app zelf is gratis; er wordt niets verkocht.",
           "Word list: Wiktionary, CC BY-SA 4.0, via kaikki.org. Speech recognition: Whisper (OpenAI, MIT licence) via Hugging Face and Transformers.js (Apache 2.0). The app itself is free; nothing is sold.",
           "Wortliste: Wiktionary, CC BY-SA 4.0, über kaikki.org. Spracherkennung: Whisper (OpenAI, MIT-Lizenz) über Hugging Face und Transformers.js (Apache 2.0). Die App selbst ist kostenlos; es wird nichts verkauft.",
           "Liste de mots : Wiktionary, CC BY-SA 4.0, via kaikki.org. Reconnaissance vocale : Whisper (OpenAI, licence MIT) via Hugging Face et Transformers.js (Apache 2.0). L'application est gratuite ; rien n'est vendu.") }
  ];
  // ---------- Overzicht van de tabbladen, instellingen en extra's (Info-pagina) ----------
  var TAB_GUIDE = [
    { n: m("Zinnen", "Sentences", "Sätze", "Phrases"),
      w: m("Kant-en-klare zinnen per situatie, zoals begroeten, eten, werk en vakantie, met vertaling en uitleg.",
           "Ready-made sentences per situation, such as greeting, eating, work and holidays, with translation and explanation.",
           "Fertige Sätze pro Situation, zum Beispiel Begrüßen, Essen, Arbeit und Urlaub, mit Übersetzung und Erklärung.",
           "Phrases toutes prêtes par situation, comme saluer, manger, le travail et les vacances, avec traduction et explication."),
      k: [m("Kies bovenaan een groep.", "Choose a group at the top.", "Wähle oben eine Gruppe.", "Choisis un groupe en haut."),
          m("Tik op het luidsprekertje om een zin te horen.", "Tap the speaker icon to hear a sentence.", "Tippe auf das Lautsprechersymbol, um einen Satz zu hören.", "Touche le haut-parleur pour entendre une phrase."),
          m("Bij sommige zinnen kun je met 'Bouw verder' zelf een zin maken.", "For some sentences, 'Build further' lets you make your own sentence.", "Bei manchen Sätzen kannst du mit 'Weiterbauen' deinen eigenen Satz machen.", "Pour certaines phrases, « Continuer » te permet de faire ta propre phrase."),
          m("Zinnen die je begrijpt verdwijnen. Zet ze terug via Instellingen.", "Sentences you understand disappear. Bring them back via Settings.", "Verstandene Sätze verschwinden. Hol sie über die Einstellungen zurück.", "Les phrases que tu comprends disparaissent. Remets-les via les réglages.")] },
    { n: m("Onderwerpen", "Topics", "Themen", "Sujets"),
      w: m("Vragen per onderwerp om een gesprek te beginnen of gaande te houden.",
           "Questions per topic to start or keep a conversation going.",
           "Fragen pro Thema, um ein Gespräch zu beginnen oder am Laufen zu halten.",
           "Questions par sujet pour lancer ou entretenir une conversation."),
      k: [m("Lees de vraag hardop en luister naar het voorbeeld.", "Read the question aloud and listen to the example.", "Lies die Frage laut vor und höre das Beispiel an.", "Lis la question à voix haute et écoute l'exemple."),
          m("Gebruik ze als het gesprek stilvalt.", "Use them when the conversation stalls.", "Nutze sie, wenn das Gespräch stockt.", "Utilise-les quand la conversation s'arrête.")] },
    { n: m("Vastlopen", "Stuck", "Hängen", "Bloqué"),
      w: m("Wat je zegt als je even niets weet.", "What to say when you don't know what to say.", "Was du sagst, wenn dir nichts einfällt.", "Que dire quand tu ne sais plus quoi dire."),
      k: [m("Een grote zin met luisterknop.", "A large sentence with a listen button.", "Ein großer Satz mit Hörknopf.", "Une grande phrase avec bouton d'écoute."),
          m("'Andere zin' laat een nieuwe zin zien.", "'Another sentence' shows a new one.", "'Anderer Satz' zeigt einen neuen.", "« Autre phrase » en affiche une nouvelle."),
          m("Onderaan staat de volledige lijst.", "The full list is at the bottom.", "Unten steht die vollständige Liste.", "La liste complète est en bas.")] },
    { n: m("Zin bouwen", "Build a sentence", "Satz bauen", "Construire une phrase"),
      w: m("Maak zelf zinnen met een patroon uit woorden die je al kent.", "Make your own sentences with a pattern from words you already know.", "Baue eigene Sätze mit einem Muster aus Wörtern, die du schon kennst.", "Fais tes propres phrases avec un modèle à partir de mots que tu connais déjà."),
      k: [m("Kies een patroon en vul het in.", "Choose a pattern and fill it in.", "Wähle ein Muster und fülle es aus.", "Choisis un modèle et complète-le."),
          m("Lees je zin hardop voor.", "Read your sentence aloud.", "Lies deinen Satz laut vor.", "Lis ta phrase à voix haute.")] },
    { n: m("Reageren", "React", "Reagieren", "Réagir"),
      w: m("Antwoorden op wat je gesprekspartner vraagt, of op wat een vriend vertelt.", "Answers to what your partner asks, or to what a friend tells you.", "Antworten auf das, was dein Gesprächspartner fragt, oder auf das, was ein Freund erzählt.", "Réponses à ce que ton interlocuteur demande, ou à ce qu'un ami raconte."),
      k: [m("'Ik vraag': antwoorden op vragen van je partner.", "'I ask': answers to questions from your partner.", "'Ich frage': Antworten auf Fragen deines Partners.", "« Je demande » : réponses aux questions de ton interlocuteur."),
          m("'Vriend vertelt': reageer op een verhaal.", "'Friend tells': respond to a story.", "'Freund erzählt': reagiere auf eine Geschichte.", "« Un ami raconte » : réagis à une histoire."),
          m("Begrepen reacties verdwijnen uit de lijst.", "Understood responses disappear from the list.", "Verstandene Reaktionen verschwinden aus der Liste.", "Les réponses comprises disparaissent de la liste.")] },
    { n: m("Leren", "Learn", "Lernen", "Apprendre"),
      w: m("Oefenen met kaarten, een quiz en grammatica.", "Practise with flashcards, a quiz and grammar.", "Üben mit Karteikarten, einem Quiz und Grammatik.", "S'entraîner avec des cartes, un quiz et la grammaire."),
      k: [m("Kaarten: markeer wat je al kent als 'gekend'.", "Flashcards: mark what you already know as 'known'.", "Karten: markiere, was du schon kennst, als 'gekannt'.", "Cartes : marque ce que tu connais déjà comme « connu »."),
          m("Quiz: kies de juiste vertaling uit drie opties.", "Quiz: choose the right translation from three options.", "Quiz: wähle die richtige Übersetzung aus drei Optionen.", "Quiz : choisis la bonne traduction parmi trois options."),
          m("Grammatica: korte regels met voorbeelden en het waarom.", "Grammar: short rules with examples and the reason.", "Grammatik: kurze Regeln mit Beispielen und dem Warum.", "Grammaire : courtes règles avec exemples et explication.")] },
    { n: m("Regels", "Rules", "Regeln", "Règles"),
      w: m("Grammatica in het kort, met voorbeelden en een korte test.", "Grammar in brief, with examples and a short test.", "Grammatik kurz gefasst, mit Beispielen und einem kurzen Test.", "La grammaire en bref, avec exemples et un court test."),
      k: [m("Tik op het luidsprekertje om een voorbeeld te horen.", "Tap the speaker icon to hear an example.", "Tippe auf das Lautsprechersymbol, um ein Beispiel zu hören.", "Touche le haut-parleur pour entendre un exemple."),
          m("Doe de test om te zien wat je onthoudt.", "Take the test to see what you remember.", "Mach den Test, um zu sehen, was du behältst.", "Fais le test pour voir ce que tu retiens.")] },
    { n: m("Gesprek", "Conversation", "Gespräch", "Conversation"),
      w: m("Je gesprekspartner spreekt in of typt, de app vertaalt en geeft antwoorden.", "Your partner speaks or types, the app translates and suggests answers.", "Dein Gesprächspartner spricht oder tippt, die App übersetzt und schlägt Antworten vor.", "Ton interlocuteur parle ou écrit, l'application traduit et propose des réponses."),
      k: [m("Tik op Opnemen en spreek Spaans, of typ de zin in het veld.", "Tap Record and speak Spanish, or type the sentence in the field.", "Tippe auf Aufnehmen und sprich Spanisch, oder tippe den Satz ins Feld.", "Touche Enregistrer et parle espagnol, ou écris la phrase dans le champ."),
          m("Elke zin krijgt een vertaling, met uitleg per woord.", "Every sentence gets a translation, with an explanation per word.", "Jeder Satz bekommt eine Übersetzung, mit Erklärung pro Wort.", "Chaque phrase reçoit une traduction, avec une explication par mot."),
          m("Rechts staan mogelijke antwoorden in bellen.", "Possible answers are shown on the right in bubbles.", "Rechts stehen mögliche Antworten in Sprechblasen.", "À droite, les réponses possibles dans des bulles."),
          m("Verbeter een vertaling of voeg een eigen antwoord toe.", "Correct a translation or add your own answer.", "Verbessere eine Übersetzung oder füge eine eigene Antwort hinzu.", "Corrige une traduction ou ajoute ta propre réponse."),
          m("Wis gesprek begint opnieuw.", "Clear conversation starts over.", "'Gespräch leeren' fängt neu an.", "« Effacer » recommence la conversation."),
          m("Op de iPhone wordt spraak herkend met een model dat je eenmalig downloadt, met jouw toestemming.", "On iPhone, speech is recognised with a model you download once, with your permission.", "Auf dem iPhone wird Sprache mit einem Modell erkannt, das du einmal mit deiner Zustimmung lädst.", "Sur iPhone, la parole est reconnue par un modèle que tu télécharges une fois, avec ton accord.")] },
    { n: m("Uitspraak", "Pronunciation", "Aussprache", "Prononciation"),
      w: m("Oefen je uitspraak met opnemen en vergelijken, met minimale paren en shadowing.", "Practise your pronunciation by recording and comparing, with minimal pairs and shadowing.", "Übe deine Aussprache mit Aufnehmen und Vergleichen, mit Minimalpaaren und Shadowing.", "Entraîne ta prononciation en enregistrant et en comparant, avec paires minimales et shadowing."),
      k: [m("Luister, herhaal en neem jezelf op.", "Listen, repeat and record yourself.", "Hör zu, wiederhole und nimm dich auf.", "Écoute, répète et enregistre-toi."),
          m("Vergelijk jezelf met het voorbeeld en beoordeel jezelf.", "Compare yourself with the example and assess yourself.", "Vergleiche dich mit dem Beispiel und bewerte dich selbst.", "Compare-toi à l'exemple et évalue-toi."),
          m("Het tempo stel je in bij Instellingen.", "Set the speed in Settings.", "Das Tempo stellst du in den Einstellungen ein.", "Règle la vitesse dans les réglages.")] },
    { n: m("Info", "Info", "Info", "Info"),
      w: m("Deze pagina: uitleg over de app en de tabbladen.", "This page: an explanation of the app and the tabs.", "Diese Seite: Erklärung der App und der Reiter.", "Cette page : explication de l'application et des onglets."),
      k: [] }
  ];
  var EXTRA_GUIDE = { n: m("Instellingen en extra's", "Settings and extras", "Einstellungen und Extras", "Réglages et extras"),
    k: [m("Vertaalbalk bovenaan: typ Nederlands en tik op Vertaal.", "Translation bar at the top: type Dutch and tap Translate.", "Übersetzungsleiste oben: Niederländisch tippen und auf Übersetzen tippen.", "Barre de traduction en haut : écris en néerlandais et touche Traduire."),
        m("Taal: via het logo of het tandwiel (Nederlands, Engels, Duits, Frans).", "Language: via the logo or the gear icon (Dutch, English, German, French).", "Sprache: über das Logo oder das Zahnrad (Niederländisch, Englisch, Deutsch, Französisch).", "Langue : via le logo ou la roue crantée (néerlandais, anglais, allemand, français)."),
        m("Thema: Standaard, Café, IJs, Jungle of Ruimte.", "Theme: Standard, Café, Ice, Jungle or Outer space.", "Design: Standard, Café, Eis, Dschungel oder Weltraum.", "Thème : Standard, Café, Glace, Jungle ou Espace."),
        m("Gesprekspartner: automatisch, neutraal (o/a), man (hij) of vrouw (zij). Automatisch leidt het alleen af uit een zin die de partner over zichzelf zegt.", "Conversation partner: automatic, neutral (o/a), man (he) or woman (she). Automatic only uses a sentence in which the partner describes themselves.", "Gesprächspartner: automatisch, neutral (o/a), Mann (er) oder Frau (sie). Automatisch leitet nur aus einem Satz ab, in dem der Partner sich selbst beschreibt.", "Partenaire : automatique, neutre (o/a), homme (il) ou femme (elle). Automatique ne se base que sur une phrase où le partenaire se décrit lui-même."),
        m("Snelheid van voorlezen: stel het tempo in.", "Reading speed: set the tempo.", "Vorlesegeschwindigkeit: stelle das Tempo ein.", "Vitesse de lecture : règle le rythme."),
        m("Begrepen items resetten en Voortgang resetten wissen je voortgang.", "Reset understood items and Reset progress clear your progress.", "Verstandene Elemente zurücksetzen und Fortschritt zurücksetzen löschen deinen Fortschritt.", "Réinitialiser les éléments compris et Réinitialiser la progression effacent ta progression."),
        m("De onderste balk verdwijnt na een paar seconden. Veeg omhoog vanaf de onderkant om hem terug te halen.", "The bottom bar disappears after a few seconds. Swipe up from the bottom to bring it back.", "Die untere Leiste verschwindet nach ein paar Sekunden. Wische vom unteren Rand nach oben, um sie zurückzuholen.", "La barre du bas disparaît après quelques secondes. Glisse vers le haut depuis le bas pour la faire revenir."),
        m("De uil in de koptekst reageert op het gesprek. Tik erop voor een sprong.", "The owl in the header reacts to the conversation. Tap it for a hop.", "Die Eule im Kopfbereich reagiert auf das Gespräch. Tippe darauf für einen Hüpfer.", "La chouette dans l'en-tête réagit à la conversation. Touche-la pour un petit saut.")] };
  function viewInfo() {
    var w = el("div");
    var head = el("div", "card big");
    head.appendChild(el("div", "big-es", "Speech Partner.Spanish"));
    head.appendChild(el("div", "nl", T("Versie") + " " + APP_VERSION + " · " + T("Gemaakt door Abel, met Claude")));
    w.appendChild(head);
    // Overzicht per tabblad: wat het is en wat je ermee kunt
    w.appendChild(el("h2", "", T("Tabbladen")));
    TAB_GUIDE.forEach(function (tb) {
      var c = el("div", "card");
      c.appendChild(el("div", "sec-title", L(tb.n)));
      c.appendChild(el("div", "", L(tb.w)));
      if (tb.k.length) {
        var ul = el("ul", "guide-list");
        tb.k.forEach(function (k) { ul.appendChild(el("li", "", L(k))); });
        c.appendChild(ul);
      }
      w.appendChild(c);
    });
    var ex = el("div", "card");
    ex.appendChild(el("div", "sec-title", L(EXTRA_GUIDE.n)));
    var exl = el("ul", "guide-list");
    EXTRA_GUIDE.k.forEach(function (k) { exl.appendChild(el("li", "", L(k))); });
    ex.appendChild(exl);
    w.appendChild(ex);
    // De algemene secties (oude tabbladen-alinea is vervangen door het overzicht hierboven)
    INFO_SECTIONS.filter(function (sec) { return sec.t.nl.indexOf("Zo gebruik je de tabbladen") !== 0; }).forEach(function (sec) {
      var c = el("div", "card");
      c.appendChild(el("div", "sec-title", L(sec.t)));
      c.appendChild(el("div", "", L(sec.b)));
      w.appendChild(c);
    });
    // Plaats voor het installatiekaartje (vult speels.js), onderaan zodat het de uitleg niet onderbreekt
    var slot = el("div");
    slot.id = "installSlot";
    w.appendChild(slot);
    return w;
  }

  function viewGesprek() {
    var w = el("div");
    var row = el("div", "chips");
    if (S.listening) row.appendChild(btn("⏹ " + T("Stop"), "primary", stopMic));
    else row.appendChild(btn("🎤 " + T("Opnemen"), "primary", startMic));
    if (S.convo.length) row.appendChild(btn(T("Wis gesprek"), "small", function () { S.convo = []; S.note = ""; render(); }));
    w.appendChild(row);
    if (S.note) w.appendChild(el("div", "bad", S.note));
    if (isIOS()) {
      if (S.whAsk) w.appendChild(whConsentCard());
      else if (store.get("whModel", null) && !WH.ready && !WH.pending) whLoadWithNote();
      var ws = el("div", "note", S.whStatus || "");
      ws.id = "whStatus";
      if (!S.whStatus) ws.style.display = "none";
      w.appendChild(ws);
      if (store.get("whModel", null) && !S.whAsk && !S.listening) {
        w.appendChild(btn(T("Spraakmodel wijzigen"), "small", function () { S.whAsk = true; render(); }));
      }
    }
    w.appendChild(el("div", "note", T("Spraak hangt af van je browser. Het typvak werkt altijd.")));

    var box = el("div", "card");
    box.appendChild(el("div", "nl", T("Of typ wat je gesprekspartner zei")));
    var tIn = document.createElement("textarea");
    tIn.className = "big-input";
    tIn.style.minHeight = "56px";
    tIn.placeholder = T("Typ hier de Spaanse zin");
    box.appendChild(tIn);
    box.appendChild(btn(T("Verwerk"), "primary", function () {
      var v = tIn.value.trim();
      if (!v) return;
      S.note = "";
      S.convo.push(makeTurn(v));
      render();
    }));
    w.appendChild(box);

    if (!S.convo.length) {
      w.appendChild(el("div", "note", T("Nog geen gesprek. Tik op de microfoon en zeg bijvoorbeeld ¿Qué tal?")));
      return w;
    }
    function refresh(t) { var nt = makeTurn(t.es); t.tr = nt.tr; t.options = nt.options; S.teach = null; render(); }
    function teachForm(card, ph, onSave, ctx) {
      // Eerst uitleg: alleen aanleren wat je zeker weet, met twee manieren om het na te gaan.
      var info = el("div", "card panel");
      info.appendChild(el("div", "sec-title", T("Eerst controleren, dan aanleren")));
      info.appendChild(el("div", "", ctx.kind === "antwoord"
        ? T("Voeg alleen een antwoord toe waarvan je zeker weet dat het goed Spaans is. De app toont het daarna zonder controle.")
        : T("Leer de app alleen iets aan als je de betekenis zeker weet. De app toont jouw vertaling daarna als juist. Weet je het niet zeker? Vraag het na of controleer het online, of sla niets op.")));
      var hr = el("div", "chips");
      if (ctx.kind !== "antwoord") {
        var q = "¿Qué significa " + ctx.text + "?";
        hr.appendChild(btn("🔊 " + T("Vraag het na") + ": " + q, "small", function () { speak(q); }));
      }
      var a = document.createElement("a");
      a.className = "btn small"; a.target = "_blank"; a.rel = "noopener";
      a.textContent = T("Controleer online");
      a.href = "https://translate.google.com/?sl=es&tl=" + lang + "&text=" + encodeURIComponent(ctx.text) + "&op=translate";
      hr.appendChild(a);
      info.appendChild(hr);
      card.appendChild(info);
      var f = el("div", "row");
      var inp = document.createElement("input");
      inp.type = "text"; inp.className = "teach-input"; inp.placeholder = ph;
      f.appendChild(inp);
      f.appendChild(btn(T("Opslaan"), "primary small", function () { var v = inp.value.trim(); if (v) onSave(v); }));
      f.appendChild(btn(T("Annuleer"), "small", function () { S.teach = null; render(); }));
      card.appendChild(f);
    }
    S.convo.slice().reverse().forEach(function (t, ti) {
      var turn = el("div", "turn");
      var card = el("div", "card bubble partner");
      card.appendChild(el("div", "nl", T("Gesprekspartner zei")));
      var line = el("div", "line-row");
      var tx = el("div", "txt");
      tx.appendChild(el("div", "es", t.es));
      line.appendChild(tx);
      line.appendChild(speakBtn(t.es));
      card.appendChild(line);
      card.appendChild(el("div", "nl", T("Vertaling")));
      // De vertaling wordt bij het tonen opnieuw gemaakt, zodat ze altijd de gekozen taal volgt.
      var trr = esToLang(t.es) || t.tr;
      card.appendChild(el("div", "", trr.text));
      if (t.gen) card.appendChild(el("div", "nl", T("Uit de zin afgeleid: vorm voor de gesprekspartner") + " (" + (t.gen === "zij" ? "zij" : "hij") + ")"));
      if (trr.about && trr.es) card.appendChild(el("div", "nl", T("Herkend als:") + " " + trr.es));
      if (trr.learned) card.appendChild(el("div", "nl", T("Door jou aangeleerd")));
      if (trr.parts) card.appendChild(el("div", "nl", trr.parts.join(" · ")));
      var teach = (S.teach && S.teach.i === ti) ? S.teach : null;
      if (trr.missing && trr.missing.length) {
        card.appendChild(el("div", "bad", T("Niet in de lijst. Tik op een woord om het de app te leren:")));
        var mr = el("div", "chips");
        trr.missing.forEach(function (wd) {
          mr.appendChild(btn(wd + " = ?", teach && teach.word === wd ? "primary small" : "small", function () { S.teach = { i: ti, kind: "word", word: wd }; render(); }));
        });
        card.appendChild(mr);
      }
      var tr2 = el("div", "chips");
      tr2.appendChild(btn(T("Verbeter vertaling"), "small", function () { S.teach = { i: ti, kind: "zin" }; render(); }));
      tr2.appendChild(btn(T("Eigen antwoord toevoegen"), "small", function () { S.teach = { i: ti, kind: "antwoord" }; render(); }));
      card.appendChild(tr2);
      if (teach && teach.kind === "word") teachForm(card, teach.word + " = …", function (v) { learnWord(teach.word, v); refresh(t); }, { kind: "word", text: teach.word });
      if (teach && teach.kind === "zin") teachForm(card, T("Wat betekent deze zin?"), function (v) { learnSentence(t.es, v); refresh(t); }, { kind: "zin", text: t.es.replace(/[¿?¡!.]+/g, "").trim() });
      if (teach && teach.kind === "antwoord") teachForm(card, T("Jouw antwoord in het Spaans"), function (v) { learnReply(t.es, v); refresh(t); }, { kind: "antwoord", text: t.es });
      turn.appendChild(card);
      // Vervolgopties als eigen bellen aan de andere kant van het gesprek
      var rep = el("div", "replies");
      rep.appendChild(el("div", "sec-title", T("Mogelijke vervolg")));
      t.options.forEach(function (o) {
        var l = el("div", "line-row bubble me");
        var x = el("div", "txt");
        x.appendChild(el("div", "nl", L(o.label)));
        x.appendChild(el("div", "es", o.es));
        if (o.m) x.appendChild(el("div", "nl", L(o.m)));
        l.appendChild(x);
        l.appendChild(speakBtn(o.es));
        rep.appendChild(l);
      });
      turn.appendChild(rep);
      w.appendChild(turn);
    });
    return w;
  }

  // ---------- Uitspraaktrainer ----------
  var PR = { sub: "pairs", pair: 0, side: "a", shadow: 0, rr: 0, ds: 0, dt: 0 };
  var prRec = null, prChunks = [], prUrl = null, prStream = null, prCtx = null;

  function prStartRecording(onStop) {
    if (!navigator.mediaDevices || !window.MediaRecorder) return Promise.resolve(false);
    // Geen ruis- of echo-onderdrukking (die dempen een gesprekspartner op afstand),
    // en het signaal wordt versterkt en begrensd zodat de partner goed hoorbaar is.
    var constraints = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } };
    return navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      var AC = window.AudioContext || window.webkitAudioContext;
      var ctx = null, rawStream = stream, recStream = stream;
      prStream = stream;
      try {
        ctx = new AC(); prCtx = ctx;
        var src = ctx.createMediaStreamSource(stream);
        var gain = ctx.createGain(); gain.gain.value = 3.0;
        var comp = ctx.createDynamicsCompressor();
        var dest = ctx.createMediaStreamDestination();
        src.connect(gain); gain.connect(comp); comp.connect(dest);
        recStream = dest.stream;
        if (ctx.state === "suspended") ctx.resume();
      } catch (e) { recStream = stream; }
      prChunks = [];
      prRec = new MediaRecorder(recStream);
      prRec.ondataavailable = function (e) { prChunks.push(e.data); };
      prRec.onstop = function () {
        rawStream.getTracks().forEach(function (t) { t.stop(); });
        if (ctx && ctx.state !== "closed") { try { ctx.close().catch(function () {}); } catch (e) {} }
        if (prUrl) URL.revokeObjectURL(prUrl);
        prUrl = URL.createObjectURL(new Blob(prChunks, { type: prRec.mimeType || "audio/webm" }));
        onStop && onStop(prUrl);
      };
      prRec.start();
      return true;
    }).catch(function () { return false; });
  }
  function prStopRecording() { if (prRec && prRec.state !== "inactive") prRec.stop(); }
  // Laat de microfoon volledig los (opname, audio en herkenning), zodat andere
  // onderdelen van de app hem weer kunnen gebruiken.
  function prRelease() {
    if (prRec && prRec.state !== "inactive") { try { prRec.stop(); } catch (e) {} }
    if (prRecog) { try { prRecog.abort(); } catch (e) {} prRecog = null; }
    if (prStream) { prStream.getTracks().forEach(function (t) { t.stop(); }); prStream = null; }
    if (prCtx) { if (prCtx.state !== "closed") { try { prCtx.close().catch(function () {}); } catch (e) {} } prCtx = null; }
  }

  // Eén zin herkennen; geeft tekst of null (niet ondersteund / mislukt)
  var prRecog = null;
  function prHear(cb) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { cb(null); return; }
    var done = false;
    function finish(v) { if (!done) { done = true; cb(v); } }
    try {
      prRecog = new SR();
      prRecog.lang = "es-ES";
      prRecog.interimResults = false;
      prRecog.maxAlternatives = 1;
      prRecog.onresult = function (e) { finish(e.results[0][0].transcript); };
      prRecog.onerror = function () { finish(null); };
      prRecog.onend = function () { finish(null); };
      prRecog.start();
    } catch (e) { finish(null); }
  }
  function prNorm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zñ\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function prSimilar(target, heard) {
    var t = prNorm(target).split(" ");
    var h = {};
    prNorm(heard).split(" ").forEach(function (w) { h[w] = true; });
    if (!t.length || !t[0]) return 0;
    var hit = t.filter(function (w) { return h[w]; }).length;
    return Math.round(hit / t.length * 100);
  }

  function prLog(kind, item, stars) {
    var entries = store.get("uitspraakLog", []);
    entries.push({ t: new Date().toISOString(), kind: kind, item: item, stars: stars });
    store.set("uitspraakLog", entries.slice(-500));
  }
  function prStars(kind, item) {
    var wrap = el("div", "chips");
    wrap.appendChild(el("span", "note", T("Hoe ging het?")));
    for (var i = 1; i <= 5; i++) (function (n) {
      wrap.appendChild(btn("★", "small", function () {
        prLog(kind, item, n);
        wrap.innerHTML = "";
        wrap.appendChild(el("span", "good", T("Opgeslagen") + ": " + n + "/5"));
      }));
    })(i);
    return wrap;
  }

  // Opneemblok: opnemen, herkennen en afspelen van eigen opname
  function prRecordBlock(target) {
    var box = el("div");
    var row = el("div", "chips");
    var recB = btn("● " + T("Opnemen"), "primary small", null);
    var stopB = btn("■ " + T("Stop"), "small", null);
    var playB = btn("▶ " + T("Mijn opname"), "small", null);
    stopB.disabled = true; playB.disabled = true;
    var status = el("span", "note", "");
    row.appendChild(recB); row.appendChild(stopB); row.appendChild(playB); row.appendChild(status);
    var result = el("div");
    var audio = new Audio();
    playB.onclick = function () { if (prUrl) { audio.src = prUrl; audio.play().catch(function () {}); } };
    recB.onclick = function () {
      prStartRecording(function () { playB.disabled = false; status.textContent = T("Opname klaar."); })
        .then(function (ok) {
          if (!ok) { result.appendChild(el("div", "bad", T("Microfoon is niet beschikbaar. Geef toegang of beoordeel jezelf met de sterren."))); return; }
          recB.disabled = true; stopB.disabled = false;
          status.textContent = T("● Opname loopt");
          prHear(function (text) {
            recB.disabled = false; stopB.disabled = true;
            result.innerHTML = "";
            if (text === null) { result.appendChild(el("div", "note", T("Spraakherkenning werkt niet in deze browser; beoordeel jezelf met de sterren."))); return; }
            var s = prSimilar(target, text);
            result.appendChild(el("div", "heard", T("Herkend") + ": " + text));
            result.appendChild(el("div", s >= 70 ? "good" : "bad", T("Overeenkomst") + ": " + s + "%"));
            result.appendChild(el("div", "note", T("Herkenning is grof: ze checkt woorden, niet de klank. Vergelijk ook met je opname.")));
          });
        });
    };
    stopB.onclick = function () {
      prStopRecording();
      if (prRecog) { try { prRecog.stop(); } catch (e) {} }
      recB.disabled = false; stopB.disabled = true;
    };
    box.appendChild(row); box.appendChild(result);
    return box;
  }

  function prSubTabs() {
    var row = el("div", "chips");
    [["pairs", "Minimale paren"], ["shadow", "Shadowing"], ["rr", "Getrilde r"], ["dlg", "Gesprek"], ["log", "Voortgang"]].forEach(function (t) {
      row.appendChild(btn(T(t[1]), PR.sub === t[0] ? "primary small" : "small", function () { PR.sub = t[0]; render(); }));
    });
    return row;
  }

  function prPairs() {
    var w = el("div");
    var p = PRON.PAIRS[PR.pair];
    var target = PR.side === "a" ? p.a : p.b;
    var card = el("div", "card big");
    card.appendChild(el("div", "nl", T("Minimaal paar") + " " + (PR.pair + 1) + " / " + PRON.PAIRS.length));
    card.appendChild(el("div", "es", p.a + "  /  " + p.b));
    card.appendChild(el("div", "nl", L(p.tip)));
    var lr = el("div", "chips");
    lr.appendChild(btn("🔊 " + T("Luister"), "primary small", function () { speak(target); }));
    lr.appendChild(btn(p.a, "small" + (PR.side === "a" ? " active" : ""), function () { PR.side = "a"; render(); }));
    lr.appendChild(btn(p.b, "small" + (PR.side === "b" ? " active" : ""), function () { PR.side = "b"; render(); }));
    card.appendChild(lr);
    w.appendChild(card);
    var rc = el("div", "card");
    rc.appendChild(el("div", "nl", T("Oefen dit woord:") + " " + target));
    rc.appendChild(prRecordBlock(target));
    w.appendChild(rc);
    w.appendChild(prStars("paar", target));
    w.appendChild(prNav(function (d) { PR.pair = (PR.pair + d + PRON.PAIRS.length) % PRON.PAIRS.length; PR.side = "a"; }));
    return w;
  }

  function prNav(move) {
    var row = el("div", "chips");
    row.appendChild(btn("← " + T("Vorige"), "small", function () { move(-1); render(); }));
    row.appendChild(btn(T("Volgende") + " →", "small", function () { move(1); render(); }));
    return row;
  }

  function prShadow() {
    var w = el("div");
    var text = PRON.SHADOW[PR.shadow];
    var card = el("div", "card big");
    card.appendChild(el("div", "nl", T("Luister en herhaal direct daarna.") + " " + (PR.shadow + 1) + " / " + PRON.SHADOW.length));
    card.appendChild(el("div", "es", text));
    var lr = el("div", "chips");
    lr.appendChild(btn("🔊 " + T("Luister"), "primary small", function () { speak(text); }));
    card.appendChild(lr);
    w.appendChild(card);
    var rc = el("div", "card");
    rc.appendChild(el("div", "nl", T("Herhaal hardop en neem op:")));
    rc.appendChild(prRecordBlock(text));
    w.appendChild(rc);
    w.appendChild(prStars("shadow", text.slice(0, 40)));
    w.appendChild(prNav(function (d) { PR.shadow = (PR.shadow + d + PRON.SHADOW.length) % PRON.SHADOW.length; }));
    return w;
  }

  function prRR() {
    var w = el("div");
    var item = PRON.RR[PR.rr];
    var card = el("div", "card big");
    card.appendChild(el("div", "nl", T("Trap") + " " + (PR.rr + 1) + " / " + PRON.RR.length + " · " + T("van makkelijk naar moeilijk")));
    card.appendChild(el("div", "es", item.t));
    card.appendChild(el("div", "nl", L(item.note)));
    var lr = el("div", "chips");
    lr.appendChild(btn("🔊 " + T("Luister"), "primary small", function () { speak(item.t); }));
    card.appendChild(lr);
    w.appendChild(card);
    var rc = el("div", "card");
    rc.appendChild(el("div", "nl", T("Oefen en neem op:")));
    rc.appendChild(prRecordBlock(item.t));
    w.appendChild(rc);
    w.appendChild(prStars("rr", item.t));
    w.appendChild(prNav(function (d) { PR.rr = Math.max(0, Math.min(PRON.RR.length - 1, PR.rr + d)); }));
    return w;
  }

  function prDialog() {
    var w = el("div");
    var d = PRON.DIALOGS[PR.ds];
    if (PR.dt >= d.turns.length) {
      var done = el("div", "card big");
      done.appendChild(el("div", "good", T("Gesprek klaar ✓")));
      done.appendChild(el("div", "nl", L(d.title)));
      var r = el("div", "chips");
      r.appendChild(btn(T("Opnieuw"), "primary small", function () { PR.dt = 0; render(); }));
      r.appendChild(btn(T("Volgend gesprek") + " →", "small", function () { PR.ds = (PR.ds + 1) % PRON.DIALOGS.length; PR.dt = 0; render(); }));
      done.appendChild(r);
      w.appendChild(done);
      return w;
    }
    var turn = d.turns[PR.dt];
    var card = el("div", "card");
    card.appendChild(el("div", "nl", L(d.title) + " · " + T("beurt") + " " + (PR.dt + 1) + " / " + d.turns.length));
    card.appendChild(el("div", "nl", T("Partner zegt:")));
    card.appendChild(el("div", "es", turn.say));
    var lr = el("div", "chips");
    lr.appendChild(btn("🔊 " + T("Luister"), "primary small", function () { speak(turn.say); }));
    card.appendChild(lr);
    w.appendChild(card);

    var rc = el("div", "card");
    rc.appendChild(el("div", "nl", T("Jouw antwoord:")));
    var fb = el("div");
    var mic = btn("🎤 " + T("Spreek"), "primary small", null);
    var pass = btn(T("Ik heb het gezegd"), "small", function () { PR.dt++; render(); });
    pass.style.display = "none";
    var status = el("span", "note", "");
    var mrow = el("div", "chips");
    mrow.appendChild(mic); mrow.appendChild(status); mrow.appendChild(pass);
    rc.appendChild(mrow);
    mic.onclick = function () {
      mic.disabled = true;
      status.textContent = T("Luistert…");
      prHear(function (text) {
        mic.disabled = false; status.textContent = "";
        fb.innerHTML = "";
        if (text === null) {
          fb.appendChild(el("div", "note", T("Spraakherkenning werkt niet in deze browser. Zeg het hardop en klik op 'Ik heb het gezegd'.")));
          pass.style.display = "inline-block";
          return;
        }
        var score = Math.max.apply(null, turn.ok.map(function (o) { return prSimilar(o, text); }));
        if (score >= 70) {
          fb.appendChild(el("div", "good", T("Goed gezegd ✓")));
          fb.appendChild(el("div", "heard", T("Herkend") + ": " + text));
          fb.appendChild(btn(T("Volgende beurt") + " →", "primary small", function () { PR.dt++; render(); }));
        } else {
          fb.appendChild(el("div", "bad", T("Nog niet helemaal. Probeer opnieuw of kijk naar het voorbeeld.")));
          fb.appendChild(el("div", "heard", T("Herkend") + ": " + text));
        }
      });
    };
    rc.appendChild(fb);
    var ex = el("div", "chips");
    ex.appendChild(btn(T("Toon voorbeeld"), "small", function () { fb.innerHTML = ""; fb.appendChild(el("div", "nl", T("Voorbeeld") + ": " + turn.model)); }));
    ex.appendChild(btn(T("Overslaan"), "small", function () { PR.dt++; render(); }));
    ex.appendChild(btn(T("Ander gesprek"), "small", function () { PR.ds = (PR.ds + 1) % PRON.DIALOGS.length; PR.dt = 0; render(); }));
    rc.appendChild(ex);
    w.appendChild(rc);
    return w;
  }

  function prLogView() {
    var w = el("div");
    var entries = store.get("uitspraakLog", []);
    if (!entries.length) { w.appendChild(el("div", "card", T("Nog geen oefeningen opgeslagen. Sterren geven na een oefening vult dit overzicht."))); return w; }
    var byKind = {};
    entries.forEach(function (e) { (byKind[e.kind] = byKind[e.kind] || []).push(e.stars); });
    var card = el("div", "card");
    Object.keys(byKind).forEach(function (k) {
      var arr = byKind[k];
      var avg = (arr.reduce(function (a, b) { return a + b; }, 0) / arr.length).toFixed(1);
      card.appendChild(el("div", "", k + ": " + arr.length + "×, " + T("gemiddeld") + " " + avg + "/5"));
    });
    w.appendChild(card);
    var recent = el("div", "card");
    entries.slice(-15).reverse().forEach(function (e) {
      recent.appendChild(el("div", "nl", new Date(e.t).toLocaleDateString() + " · " + e.kind + " · " + e.item + " · " + e.stars + "/5"));
    });
    w.appendChild(recent);
    w.appendChild(btn(T("Wis voortgang uitspraak"), "small", function () { store.set("uitspraakLog", []); render(); }));
    return w;
  }

  function viewUitspraak() {
    var w = el("div");
    w.appendChild(el("div", "note", T("Luister, herhaal, neem op, vergelijk en beoordeel jezelf. Het tempo stel je in bij Instellingen.")));
    w.appendChild(prSubTabs());
    var views = { pairs: prPairs, shadow: prShadow, rr: prRR, dlg: prDialog, log: prLogView };
    w.appendChild(views[PR.sub]());
    return w;
  }

  // ---------- Opbouw van de pagina ----------
  var VIEWS = {
    zinnen: viewZinnen, onderwerpen: viewOnderwerpen, vastlopen: viewVastlopen,
    bouwen: viewBouwen, reageren: viewReageren, leren: viewLeren,
    regels: viewRegels, gesprek: viewGesprek, uitspraak: viewUitspraak, info: viewInfo
  };

  // Vlaggen als SVG (overal gelijk; geen emoji nodig). Spaans is altijd rood-geel-rood.
  var FLAG_BANDS = {
    nl: { dir: "h", c: ["#AE1C28", "#FFFFFF", "#21468B"] },
    de: { dir: "h", c: ["#000000", "#DD0000", "#FFCE00"] },
    fr: { dir: "v", c: ["#002395", "#FFFFFF", "#ED2939"] },
    es: { dir: "h", c: ["#AA151B", "#F1BF00", "#AA151B"] }
  };
  function flagInner(code, w, h) {
    if (code === "en") {
      return '<rect width="' + w + '" height="' + h + '" fill="#012169"/>' +
        '<path d="M0,0 L' + w + ',' + h + ' M' + w + ',0 L0,' + h + '" stroke="#FFFFFF" stroke-width="' + (h * 0.2) + '"/>' +
        '<path d="M0,0 L' + w + ',' + h + ' M' + w + ',0 L0,' + h + '" stroke="#C8102E" stroke-width="' + (h * 0.07) + '"/>' +
        '<path d="M' + (w / 2) + ',0 V' + h + ' M0,' + (h / 2) + ' H' + w + '" stroke="#FFFFFF" stroke-width="' + (h * 0.33) + '"/>' +
        '<path d="M' + (w / 2) + ',0 V' + h + ' M0,' + (h / 2) + ' H' + w + '" stroke="#C8102E" stroke-width="' + (h * 0.2) + '"/>';
    }
    var f = FLAG_BANDS[code] || FLAG_BANDS.nl, out = "", i;
    for (i = 0; i < 3; i++) {
      if (f.dir === "h") out += '<rect x="0" y="' + (i * h / 3) + '" width="' + w + '" height="' + (h / 3 + 0.5) + '" fill="' + f.c[i] + '"/>';
      else out += '<rect x="' + (i * w / 3) + '" y="0" width="' + (w / 3 + 0.5) + '" height="' + h + '" fill="' + f.c[i] + '"/>';
    }
    if (code === "es") { // Spanje: geel midden is breder
      out = '<rect width="' + w + '" height="' + h + '" fill="#AA151B"/><rect y="' + h * 0.25 + '" width="' + w + '" height="' + h * 0.5 + '" fill="#F1BF00"/>';
    }
    return out;
  }
  function flagSVG(code, w, h) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">' + flagInner(code, w, h) + '</svg>';
  }

  // Logo: ring in de kleuren van alle talen met SP in schrijfletters (als pad, dus overal gelijk).
  // Het kleine label rechtsonder toont de gekozen taal; een tik opent het taalmenu.
  var LOGO_INNER = '<path d="M54.19,13.24 A37,37 0 0 1 83.67,34.66" fill="none" stroke="#D52B1E" stroke-width="6.5" stroke-linecap="round"/><path d="M86.26,42.62 A37,37 0 0 1 75.00,77.28" fill="none" stroke="#FCD116" stroke-width="6.5" stroke-linecap="round"/><path d="M68.22,82.20 A37,37 0 0 1 31.78,82.20" fill="none" stroke="#009E49" stroke-width="6.5" stroke-linecap="round"/><path d="M25.00,77.28 A37,37 0 0 1 13.74,42.62" fill="none" stroke="#0052B4" stroke-width="6.5" stroke-linecap="round"/><path d="M16.33,34.66 A37,37 0 0 1 45.81,13.24" fill="none" stroke="#1a1a1a" stroke-width="6.5" stroke-linecap="round"/><path d="M21.54 81.79Q17.08 81.79 12.89 80.27Q8.7 78.74 5.81 75.62Q2.92 72.51 2.36 67.83Q1.86 63.68 3.41 61.37Q4.97 59.05 7.61 58.14Q10.24 57.22 12.84 57.22Q10.71 59.81 9.78 62.56Q8.85 65.31 9.15 67.8Q9.46 70.42 11.07 72.67Q12.67 74.93 15.51 76.34Q18.35 77.75 22.31 77.75Q25.73 77.75 28.86 76.59Q31.98 75.44 33.8 73.16Q35.62 70.88 35.2 67.41Q34.83 64.3 32.77 62.06Q30.7 59.81 27.66 58.02Q24.62 56.23 21.3 54.59Q17.97 52.95 14.92 51.03Q11.87 49.11 9.78 46.61Q7.68 44.1 7.25 40.58Q6.88 37.45 8.02 33.9Q9.16 30.36 11.68 27.23Q14.21 24.1 18.09 22.15Q21.98 20.21 27.02 20.21Q32.28 20.21 34.69 22.42Q37.09 24.63 37.52 28.22Q37.85 31.01 37.25 34.23Q36.66 37.44 35.59 40.35Q34.52 43.25 33.47 45.31Q31.74 44.93 30.79 43.98Q29.83 43.02 29.64 41.42Q29.45 39.82 29.87 37.83Q30.3 35.85 30.89 33.71Q31.48 31.58 31.9 29.56Q32.32 27.53 32.14 26.01Q31.98 24.63 31.08 23.87Q30.19 23.11 27.72 23.11Q24.08 23.11 21.22 24.71Q18.36 26.31 16.42 28.76Q14.47 31.22 13.56 33.92Q12.66 36.62 12.92 38.83Q13.25 41.57 15.24 43.53Q17.24 45.49 20.21 47.08Q23.18 48.67 26.47 50.27Q29.75 51.88 32.77 53.88Q35.79 55.88 37.88 58.61Q39.97 61.35 40.44 65.27Q40.92 69.28 39.49 72.33Q38.07 75.38 35.27 77.48Q32.46 79.58 28.9 80.69Q25.33 81.79 21.54 81.79ZM52.9 81.79Q50.61 81.79 48.44 80.57Q46.27 79.35 46.04 77.44Q45.93 76.45 46.13 75.31Q46.34 74.16 46.52 73.17Q48.02 65.92 49.33 59.62Q50.63 53.33 52.03 47.49Q53.43 41.65 55.05 35.77Q56.67 29.9 58.8 23.49Q55.98 24.1 54.03 25.05Q52.08 26.01 50.87 26.73Q49.66 27.46 49.05 27.46Q48.67 27.46 47.88 26.92Q47.09 26.39 46.48 25.7Q45.86 25.01 45.79 24.48Q47.82 23.56 50.56 22.57Q53.31 21.58 56.58 20.89Q59.86 20.21 63.22 20.21Q66.8 20.21 70.66 21.16Q74.51 22.11 77.9 23.98Q81.29 25.85 83.58 28.64Q85.86 31.42 86.3 35.16Q86.79 39.21 85.31 42.11Q83.82 45.01 81.05 46.99Q78.27 48.98 74.91 50.2Q71.54 51.42 68.14 52.03Q64.74 52.64 62.02 52.87Q59.3 53.1 57.93 53.1H57.47Q56.24 60.65 55.08 68.17Q53.92 75.69 52.9 81.79ZM57.87 50.73Q62.11 50.43 66.25 49.28Q70.38 48.14 73.61 46.12Q76.84 44.09 78.58 41.04Q80.31 37.99 79.82 33.94Q79.37 30.13 77.06 27.76Q74.75 25.4 71.44 24.17Q68.13 22.95 64.61 22.88Q62.5 28.22 60.86 35.51Q59.21 42.8 57.87 50.73Z" fill="#1b1b1b" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"/>';
  function renderLogo() {
    document.getElementById("logo").innerHTML =
      '<svg viewBox="0 0 100 100" aria-hidden="true">' + LOGO_INNER.replace('fill="#1b1b1b" stroke="#ffffff"', 'style="fill:var(--ink);stroke:var(--card)"') + '</svg>' +
      '<span class="logolang">' + lang.toUpperCase() + '</span>';
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    document.body.setAttribute("data-lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(function (n) { n.textContent = T(n.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (n) { n.setAttribute("aria-label", T(n.getAttribute("data-i18n-aria"))); });
    document.querySelectorAll("[data-ph]").forEach(function (n) { n.placeholder = T(n.getAttribute("data-ph")); });
    document.getElementById("langSel").value = lang;
    document.getElementById("themeSel").value = theme;
    if (document.getElementById("genSel")) document.getElementById("genSel").value = partnerGenderSetting();
    document.body.classList.toggle("cafe", theme === "cafe");
    ["ijs", "jungle", "ruimte"].forEach(function (t) { document.body.classList.toggle("th-" + t, theme === t); });
    renderLogo();
  }

  function updateMic() {
    var b = document.getElementById("mbtn");
    var label = S.listening ? T("Stop") : T("Spreek een Spaanse reactie in");
    b.textContent = S.listening ? "⏹" : "🎤";
    b.classList.toggle("rec", S.listening);
    b.title = label;
    b.setAttribute("aria-label", label);
    var out = document.getElementById("transOut");
    if (S.listening) {
      out.hidden = false;
      out.innerHTML = "";
      var lm = el("div", "bad listen-msg", "● " + T("Luistert…"));
      out.appendChild(lm);
    } else if (out.querySelector && out.querySelector(".listen-msg")) {
      out.innerHTML = "";
      out.hidden = true;
    }
  }

  function render() {
    applyStatic();
    renderNav();
    var view = document.getElementById("view");
    view.innerHTML = "";
    view.appendChild(S.build ? viewBuilder() : VIEWS[S.tab]());
    updateMic();
  }

  // ---------- Instellingen en vertaalvak koppelen ----------
  function setup() {
    applyStatic();

    var rateEl = document.getElementById("rate");
    var rateVal = document.getElementById("rateVal");
    rateEl.value = String(rate);
    rateVal.textContent = String(rate);
    rateEl.addEventListener("input", function () {
      rate = parseFloat(rateEl.value);
      rateVal.textContent = rateEl.value;
      store.set("rate", rate);
    });

    document.getElementById("langSel").addEventListener("change", function (e) {
      lang = e.target.value;
      store.set("lang", lang);
      S.lShow = false;
      render();
      if (!document.getElementById("transOut").hidden) showTranslation();
    });
    if (document.getElementById("genSel")) document.getElementById("genSel").addEventListener("change", function (e) {
      store.set("partnerGender", e.target.value);
      render();
    });
    document.getElementById("themeSel").addEventListener("change", function (e) {
      theme = e.target.value;
      store.set("theme", theme);
      applyStatic();
    });
    // Taalopties schuiven onder de koptekst uit: via het logo, de vlag of het instellingenwiel.
    function toggleSettings() {
      var p = document.getElementById("settings");
      var open = !p.classList.contains("open");
      p.classList.toggle("open", open);
      p.setAttribute("aria-hidden", open ? "false" : "true");
    }
    document.getElementById("setBtn").onclick = toggleSettings;
    // Tik op de titel: terug naar het begin (Zinnen, met de hoofdcategorie open).
    var ttl = document.querySelector("header.top h1");
    if (ttl) {
      ttl.style.cursor = "pointer";
      ttl.onclick = function () {
        S.build = null; S.teach = null; S.listening = false;
        document.getElementById("settings").classList.remove("open");
        go("zinnen");
        window.scrollTo(0, 0);
      };
    }
    // Tik op het logo: klein lijstje met alleen de taalafkortingen.
    var lm = document.getElementById("langMenu"), lg = document.getElementById("logo");
    function closeLangMenu() { lm.hidden = true; lg.setAttribute("aria-expanded", "false"); }
    lg.onclick = function (e) {
      e.stopPropagation();
      if (!lm.hidden) { closeLangMenu(); return; }
      lm.innerHTML = "";
      ["nl", "en", "de", "fr"].forEach(function (code) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "langopt" + (code === lang ? " on" : "");
        b.textContent = code.toUpperCase();
        b.onclick = function (ev) {
          ev.stopPropagation();
          closeLangMenu();
          var sel = document.getElementById("langSel");
          sel.value = code;
          sel.dispatchEvent(new Event("change"));
        };
        lm.appendChild(b);
      });
      lm.hidden = false; lg.setAttribute("aria-expanded", "true");
    };
    document.addEventListener("click", closeLangMenu);
    document.getElementById("resetUnd").onclick = function () {
      store.set("begrepen", []); render();
    };
    document.getElementById("resetProg").onclick = function () {
      store.set("gekend", []); S.lIdx = 0; S.lShow = false; S.score = [0, 0]; S.quiz = null; S.rAns = {}; render();
    };

    document.getElementById("vbtn").onclick = showTranslation;
    document.getElementById("vtxt").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); showTranslation(); }
    });
    document.getElementById("mbtn").onclick = function () {
      if (S.listening) stopMic(); else startMic();
    };

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();

  // Offline werken via de service worker
  // Automatisch bijwerken: zodra er een nieuwe versie is, wordt die actief en ververst de pagina zelf.
  // Het vinkje in sessionStorage voorkomt een eindeloze herlaadlus.
  if ("serviceWorker" in navigator) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController) { hadController = true; return; }
      try {
        if (sessionStorage.getItem("sp-reloaded") === APP_VERSION) return;
        sessionStorage.setItem("sp-reloaded", APP_VERSION);
      } catch (e) {}
      window.location.reload();
    });
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        reg.update().catch(function () {});
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "visible") reg.update().catch(function () {});
        });
      }).catch(function () {});
    });
  }
})();
