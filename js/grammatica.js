// Grammatica-motor, eerste versie (Spaans -> Nederlands).
// Ontleedt een Spaanse zin in werkwoorden, onderwerp, ontkenning en bijzinnen en bouwt daarna
// een Nederlandse zin op met de juiste persoonsvorm en woordvolgorde.
// Lukt dat niet (onbekend woord, ingewikkelde zin), dan geeft translate() null terug en
// gebruikt de app de gewone woord-voor-woord vertaling.
var GRAM = (function () {

  function fold(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function has(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }

  // Volgorde van personen: 0 yo, 1 tú, 2 él/ella/usted, 3 nosotros, 4 vosotros, 5 ellos/ellas
  var PERS = ["1e pers.", "2e pers.", "3e pers.", "1e pers. mv.", "2e pers. mv.", "3e pers. mv."];
  // Nederlandse persoonlijke voornaamwoorden bij het weglaten van het onderwerp
  var IMPL = ["ik", "je", "hij", "wij", "jullie", "zij"];

  // ---- Spaanse regelmatige uitgangen (ik, jij, hij, wij, jullie, zij)
  var ES_END = {
    ar: {
      pres: ["o", "as", "a", "amos", "áis", "an"],
      pret: ["é", "aste", "ó", "amos", "asteis", "aron"],
      imp: ["aba", "abas", "aba", "ábamos", "abais", "aban"]
    },
    er: {
      pres: ["o", "es", "e", "emos", "éis", "en"],
      pret: ["í", "iste", "ió", "imos", "isteis", "ieron"],
      imp: ["ía", "ías", "ía", "íamos", "íais", "ían"]
    },
    ir: {
      pres: ["o", "es", "e", "imos", "ís", "en"],
      pret: ["í", "iste", "ió", "imos", "isteis", "ieron"],
      imp: ["ía", "ías", "ía", "íamos", "íais", "ían"]
    }
  };

  function regular(inf) {
    var cls = inf.slice(-2), stem = inf.slice(0, -2), end = ES_END[cls];
    var s1 = stem;
    if (cls === "ar") { // spelling: llegar -> llegué, jugar -> jugué, empezar -> empecé
      if (/c$/.test(stem)) s1 = stem.slice(0, -1) + "qu";
      else if (/g$/.test(stem)) s1 = stem + "u";
      else if (/z$/.test(stem)) s1 = stem.slice(0, -1) + "c";
    }
    var pret = end.pret.map(function (e, i) { return (i === 0 ? s1 : stem) + e; });
    return {
      pres: end.pres.map(function (e) { return stem + e; }),
      pret: pret,
      imp: end.imp.map(function (e) { return stem + e; })
    };
  }

  // ---- Spaanse werkwoorden: onregelmatige vormen expliciet, de rest wordt afgeleid
  var ES_VERBS = [
    { es: "ser", nl: "zijn", pres: ["soy", "eres", "es", "somos", "sois", "son"],
      pret: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"], imp: ["era", "eras", "era", "éramos", "erais", "eran"] },
    { es: "ir", nl: "gaan", pres: ["voy", "vas", "va", "vamos", "vais", "van"],
      pret: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"], imp: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"] },
    { es: "estar", nl: "zijn", pres: ["estoy", "estás", "está", "estamos", "estáis", "están"],
      pret: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"] },
    { es: "tener", nl: "hebben", pres: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
      pret: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"] },
    { es: "hacer", nl: "doen", pres: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
      pret: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"] },
    { es: "decir", nl: "zeggen", pres: ["digo", "dices", "dice", "decimos", "decís", "dicen"],
      pret: ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"] },
    { es: "ver", nl: "zien", pres: ["veo", "ves", "ve", "vemos", "veis", "ven"],
      pret: ["vi", "viste", "vio", "vimos", "visteis", "vieron"] },
    { es: "poder", nl: "kunnen", pres: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
      pret: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"] },
    { es: "querer", nl: "willen", pres: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
      pret: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"] },
    { es: "saber", nl: "weten", pres: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
      pret: ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"] },
    { es: "dar", nl: "geven", pres: ["doy", "das", "da", "damos", "dais", "dan"],
      pret: ["di", "diste", "dio", "dimos", "disteis", "dieron"] },
    { es: "venir", nl: "komen", pres: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
      pret: ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"] },
    { es: "leer", nl: "lezen", pres: ["leo", "lees", "lee", "leemos", "leéis", "leen"],
      pret: ["leí", "leíste", "leyó", "leímos", "leísteis", "leyeron"] },
    { es: "dormir", nl: "slapen", pres: ["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"],
      pret: ["dormí", "dormiste", "durmió", "dormimos", "dormisteis", "durmieron"] },
    { es: "empezar", nl: "beginnen", pres: ["empiezo", "empiezas", "empieza", "empezamos", "empezáis", "empiezan"] },
    { es: "entender", nl: "begrijpen", pres: ["entiendo", "entiendes", "entiende", "entendemos", "entendéis", "entienden"] },
    { es: "jugar", nl: "spelen", pres: ["juego", "juegas", "juega", "jugamos", "jugáis", "juegan"] },
    // regelmatige werkwoorden
    { es: "comer", nl: "eten" }, { es: "beber", nl: "drinken" }, { es: "hablar", nl: "praten" },
    { es: "trabajar", nl: "werken" }, { es: "llegar", nl: "aankomen" }, { es: "comprar", nl: "kopen" },
    { es: "decidir", nl: "beslissen" }, { es: "estudiar", nl: "studeren" }, { es: "vivir", nl: "wonen" },
    { es: "cocinar", nl: "koken" }, { es: "escuchar", nl: "luisteren" }, { es: "mirar", nl: "kijken" },
    { es: "correr", nl: "rennen" }, { es: "pasar", nl: "gebeuren" }, { es: "escribir", nl: "schrijven" }
  ];

  // Vormen die te algemeen zijn (zoals het voornaamwoord "se") tellen niet als werkwoord
  var SKIP_FORMS = ["se"];

  var ESIDX = {}, ESEX = {}; // ESEX: met accenten (llegó ≠ llego), ESIDX: zonder accenten
  ES_VERBS.forEach(function (v) {
    var base = regular(v.es);
    var tbl = { pres: v.pres || base.pres, pret: v.pret || base.pret, imp: v.imp || base.imp };
    ["pres", "pret", "imp"].forEach(function (tense) {
      tbl[tense].forEach(function (form, p) {
        var k = fold(form);
        if (SKIP_FORMS.indexOf(k) >= 0) return;
        var entry = { es: v.es, nl: v.nl, tense: tense, p: p };
        (ESIDX[k] = ESIDX[k] || []).push(entry);
        (ESEX[form.toLowerCase()] = ESEX[form.toLowerCase()] || []).push(entry);
      });
    });
  });

  // ---- Nederlandse onregelmatige werkwoorden (ik, jij, hij, wij, jullie, zij)
  var NL_IRR = {
    zijn: { pret: ["was", "was", "was", "waren", "waren", "waren"], pres: ["ben", "bent", "is", "zijn", "zijn", "zijn"] },
    hebben: { pret: ["had", "had", "had", "hadden", "hadden", "hadden"], pres: ["heb", "hebt", "heeft", "hebben", "hebben", "hebben"] },
    gaan: { pret: ["ging", "ging", "ging", "gingen", "gingen", "gingen"], pres: ["ga", "gaat", "gaat", "gaan", "gaan", "gaan"] },
    doen: { pret: ["deed", "deed", "deed", "deden", "deden", "deden"], pres: ["doe", "doet", "doet", "doen", "doen", "doen"] },
    zeggen: { pret: ["zei", "zei", "zei", "zeiden", "zeiden", "zeiden"], pres: ["zeg", "zegt", "zegt", "zeggen", "zeggen", "zeggen"] },
    zien: { pret: ["zag", "zag", "zag", "zagen", "zagen", "zagen"], pres: ["zie", "ziet", "ziet", "zien", "zien", "zien"] },
    kunnen: { pret: ["kon", "kon", "kon", "konden", "konden", "konden"], pres: ["kan", "kan", "kan", "kunnen", "kunnen", "kunnen"] },
    willen: { pret: ["wilde", "wilde", "wilde", "wilden", "wilden", "wilden"], pres: ["wil", "wil", "wil", "willen", "willen", "willen"] },
    weten: { pret: ["wist", "wist", "wist", "wisten", "wisten", "wisten"], pres: ["weet", "weet", "weet", "weten", "weten", "weten"] },
    geven: { pret: ["gaf", "gaf", "gaf", "gaven", "gaven", "gaven"], pres: ["geef", "geeft", "geeft", "geven", "geven", "geven"] },
    komen: { pret: ["kwam", "kwam", "kwam", "kwamen", "kwamen", "kwamen"], pres: ["kom", "komt", "komt", "komen", "komen", "komen"] },
    eten: { pret: ["at", "at", "at", "aten", "aten", "aten"], pres: ["eet", "eet", "eet", "eten", "eten", "eten"] },
    rennen: { pret: ["rende", "rende", "rende", "renden", "renden", "renden"] },
    slapen: { pret: ["sliep", "sliep", "sliep", "sliepen", "sliepen", "sliepen"], pres: ["slaap", "slaapt", "slaapt", "slapen", "slapen", "slapen"] },
    beginnen: { pret: ["begon", "begon", "begon", "begonnen", "begonnen", "begonnen"], pres: ["begin", "begint", "begint", "beginnen", "beginnen", "beginnen"] },
    begrijpen: { pret: ["begreep", "begreep", "begreep", "begrepen", "begrepen", "begrepen"], pres: ["begrijp", "begrijpt", "begrijpt", "begrijpen", "begrijpen", "begrijpen"] },
    drinken: { pret: ["dronk", "dronk", "dronk", "dronken", "dronken", "dronken"], pres: ["drink", "drinkt", "drinkt", "drinken", "drinken", "drinken"] },
    kopen: { pret: ["kocht", "kocht", "kocht", "kochten", "kochten", "kochten"], pres: ["koop", "koopt", "koopt", "kopen", "kopen", "kopen"] },
    beslissen: { pret: ["besliste", "besliste", "besliste", "beslisten", "beslisten", "beslisten"] },
    praten: { pret: ["praatte", "praatte", "praatte", "praatten", "praatten", "praatten"], pres: ["praat", "praat", "praat", "praten", "praten", "praten"] },
    wonen: { pret: ["woonde", "woonde", "woonde", "woonden", "woonden", "woonden"], pres: ["woon", "woont", "woont", "wonen", "wonen", "wonen"] },
    koken: { pret: ["kookte", "kookte", "kookte", "kookten", "kookten", "kookten"], pres: ["kook", "kookt", "kookt", "koken", "koken", "koken"] },
    spelen: { pret: ["speelde", "speelde", "speelde", "speelden", "speelden", "speelden"], pres: ["speel", "speelt", "speelt", "spelen", "spelen", "spelen"] },
    kijken: { pret: ["keek", "keek", "keek", "keken", "keken", "keken"], pres: ["kijk", "kijkt", "kijkt", "kijken", "kijken", "kijken"] },
    schrijven: { pret: ["schreef", "schreef", "schreef", "schreven", "schreven", "schreven"], pres: ["schrijf", "schrijft", "schrijft", "schrijven", "schrijven", "schrijven"] },
    lezen: { pret: ["las", "las", "las", "lazen", "lazen", "lazen"], pres: ["lees", "leest", "leest", "lezen", "lezen", "lezen"] },
    aankomen: { pret: ["kwam aan", "kwam aan", "kwam aan", "kwamen aan", "kwamen aan", "kwamen aan"], pres: ["kom aan", "komt aan", "komt aan", "komen aan", "komen aan", "komen aan"] }
  };

  // Nederlandse persoonsvorm. Regelmatige zwakke werkwoorden worden uit de infinitief afgeleid.
  function nlVerb(inf, tense, p) {
    var ov = NL_IRR[inf];
    if (ov && ov[tense]) return ov[tense][p];
    var stem = inf.slice(0, -2);
    var voiceless = /[fkpstch]$/.test(stem);
    if (tense === "pres") {
      if (p === 0) return stem;
      if (p === 1 || p === 2) return /[dt]$/.test(stem) ? stem : stem + "t";
      return inf;
    }
    if (p >= 3) return stem + (voiceless ? "ten" : "den");
    return stem + (voiceless ? "te" : "de");
  }

  // ---- Woordgroepen
  var PRON = { yo: [0, "ik"], tu: [1, "je"], el: [2, "hij"], ella: [2, "zij"], usted: [2, "u"],
    nosotros: [3, "wij"], nosotras: [3, "wij"], vosotros: [4, "jullie"], ellos: [5, "zij"], ellas: [5, "zij"] };
  var QW = { que: "wat", como: "hoe", donde: "waar", cuando: "wanneer", quien: "wie", quienes: "wie" };
  var POSS = ["tu", "tus", "mi", "mis", "su", "sus", "nuestro", "nuestra", "nuestros", "nuestras"];
  var ADV = ["ayer", "hoy", "manana", "anoche", "ya", "siempre", "nunca", "luego", "despues", "antes", "ahora", "todavia", "tambien"];
  var DAYS = { lunes: "maandag", martes: "dinsdag", miercoles: "woensdag", jueves: "donderdag",
    viernes: "vrijdag", sabado: "zaterdag", domingo: "zondag" };
  // Woorden die een zelfstandig naamwoord aankondigen ("mucho trabajo" = werk, niet "ik werk")
  var NOUN_BEFORE = ["mucho", "poco", "mi", "mis", "tu", "tus", "su", "sus", "un", "una", "el", "la", "los", "las", "muy", "buen", "buena", "nuestro", "nuestra"];
  // (vergelijking op de geschreven vorm, zodat "tú" met accent als onderwerp blijft gelden)
  // Na "fui"/"fue" betekent het "ging" (ir) als hier een plaatsaanduiding volgt
  var GO_NEXT = ["a", "al", "en", "hacia", "hasta", "para"];

  // Vertaalt een lijst woorden. Meerwoordige uitdrukkingen eerst (fin de semana).
  function trans(list, wordFn, parts) {
    var out = [];
    var i = 0;
    while (i < list.length) {
      var done = false;
      for (var sz = 3; sz >= 2 && !done; sz--) {
        if (i + sz <= list.length) {
          var span = list.slice(i, i + sz).map(function (t) { return t.w; }).join(" ");
          var pv = wordFn(span);
          if (pv) { out.push(pv); parts.push(span + " = " + pv); i += sz; done = true; }
        }
      }
      if (done) continue;
      var t = list[i];
      if (t.f === "el" && i + 1 < list.length && has(DAYS, list[i + 1].f)) {
        var dv = "op " + DAYS[list[i + 1].f];
        out.push(dv); parts.push(t.w + " " + list[i + 1].w + " = " + dv);
        i += 2; continue;
      }
      var v = (t.f === "tu" || t.f === "tus") ? "je" : wordFn(t.w);
      if (!v) throw new Error("onbekend woord: " + t.w);
      out.push(v); parts.push(t.w + " = " + v);
      i++;
    }
    return out;
  }

  // Bouwt één clausule (hoofdzin of bijzin) op
  function clause(seg, idx, isQ, wordFn, parts) {
    var vi = -1;
    seg.toks.forEach(function (t, i) { if (vi < 0 && t.v) vi = i; });
    var vt = seg.toks[vi];
    var pre = seg.toks.slice(0, vi), post = seg.toks.slice(vi + 1);
    var neg = false;
    var keep = function (t) { if (t.f === "no") { neg = true; return false; } return true; };
    pre = pre.filter(keep); post = post.filter(keep);

    var qw = null;
    if (idx === 0 && pre.length && has(QW, pre[0].f)) {
      qw = QW[pre[0].f]; parts.push(pre[0].w + " = " + qw); pre = pre.slice(1);
    }
    var subj = null;
    if (pre.length && has(PRON, pre[pre.length - 1].f)) {
      var last = pre[pre.length - 1];
      subj = PRON[last.f][1]; parts.push(last.w + " = " + subj);
      pre = pre.slice(0, -1);
    }

    var tense = vt.v.tense === "pres" ? "pres" : "pret";
    var verbNl = nlVerb(vt.v.nl, tense, vt.v.p);
    // In een vraag met omkering: "je werkt" wordt "werk je?" (de ik-vorm)
    var verbInv = (tense === "pres" && vt.v.p === 1) ? nlVerb(vt.v.nl, tense, 0) : verbNl;
    parts.push(vt.w + " = " + verbNl + " (" + vt.v.es + ", " + PERS[vt.v.p] + ", " +
      (tense === "pres" ? "tegenwoordige tijd" : "verleden tijd") + ")");
    if (seg.conj && seg.conj.sub && seg.conj.nl === null) seg.conj.nl = tense === "pret" ? "toen" : "als";

    var hasAdv = pre.some(function (t) { return ADV.indexOf(t.f) >= 0; });
    var preNl = trans(pre, wordFn, parts);
    var postNl = trans(post, wordFn, parts).join(" ");
    var postNP = post.length > 0 && POSS.indexOf(post[0].f) >= 0;
    var implied = IMPL[vt.v.p];
    var negW = neg ? "niet" : null;
    var preStr = preNl.join(" ");

    if (seg.conj && seg.conj.sub) { // bijzin: werkwoord achteraan
      var sujS = subj || (preNl.length && !hasAdv ? preStr : implied);
      return [sujS, hasAdv ? preStr : null, negW, postNl, verbNl].filter(Boolean).join(" ");
    }
    if (qw) { // vraag met vraagwoord: vraagwoord + persoonsvorm + onderwerp
      var sujQ = subj || (postNP || preNl.length ? (preNl.length ? preStr : null) : implied);
      return [qw, verbInv, sujQ, negW, postNl].filter(Boolean).join(" ");
    }
    if (isQ && idx === 0) { // ja/nee-vraag: persoonsvorm eerst
      var sujY = subj || (preNl.length && !hasAdv ? preStr : implied);
      return [verbInv, sujY, negW, hasAdv ? preStr : null, postNl].filter(Boolean).join(" ");
    }
    if (hasAdv) { // bijwoord vooraan: bijwoord + persoonsvorm + onderwerp
      return [preStr, verbNl, subj || implied, negW, postNl].filter(Boolean).join(" ");
    }
    if (postNP && !subj && !preNl.length) throw new Error("onderwerp na werkwoord");
    return [subj || (preNl.length ? preStr : implied), verbNl, negW, postNl].filter(Boolean).join(" ");
  }

  function run(text, wordFn) {
    var isQ = /[¿?]/.test(text);
    var words = text.toLowerCase().replace(/[¿¡?!.,;:()"«»…]/g, " ").split(/\s+/).filter(function (x) { return x; });
    if (!words.length) return null;
    var toks = words.map(function (w) { return { w: w, f: fold(w) }; });
    if (toks.some(function (t) { return t.f === "hace" || t.f === "hay"; })) return null; // idiomen niet vertalen

    // Werkwoorden herkennen
    toks.forEach(function (t, i) {
      var c = has(ESEX, t.w) ? ESEX[t.w] : (has(ESIDX, t.f) ? ESIDX[t.f] : null);
      if (!c) return;
      if (i === 0 && has(QW, t.f)) return; // "¿Cómo…?" is een vraagwoord, niet "como" (ik eet)
      if (i > 0 && NOUN_BEFORE.indexOf(toks[i - 1].w) >= 0) return; // "mucho trabajo" is een zelfstandig naamwoord
      var pick = c[0];
      if (c.length > 1) {
        var nxt = toks[i + 1] ? toks[i + 1].f : "";
        var wantIr = GO_NEXT.indexOf(nxt) >= 0;
        pick = c.filter(function (x) { return (x.es === "ir") === wantIr; })[0] || c[0];
      }
      t.v = pick;
    });

    // Opdelen in clausules: bijzinnen (porque, que, cuando) en nevenschikkende voegwoorden (y, pero)
    var segs = [], cur = { conj: null, toks: [] };
    toks.forEach(function (t, i) {
      var bc = null;
      if (i > 0) {
        if (t.f === "porque") bc = { sub: true, nl: "omdat", w: t.w, f: t.f };
        else if (t.f === "que") bc = { sub: true, nl: "dat", w: t.w, f: t.f };
        else if (t.f === "cuando") bc = { sub: true, nl: null, w: t.w, f: t.f };
        else if (t.f === "y") bc = { sub: false, nl: "en", w: t.w, f: t.f };
        else if (t.f === "pero") bc = { sub: false, nl: "maar", w: t.w, f: t.f };
      }
      if (bc) { segs.push(cur); cur = { conj: bc, toks: [] }; }
      else cur.toks.push(t);
    });
    segs.push(cur);

    // Nevenschikking zonder eigen werkwoord blijft in de vorige clausule
    var merged = [];
    segs.forEach(function (s, idx) {
      var hasV = s.toks.some(function (t) { return t.v; });
      if (idx > 0 && !hasV && !s.conj.sub && merged.length) {
        var prev = merged[merged.length - 1];
        prev.toks.push({ w: s.conj.w, f: s.conj.f });
        s.toks.forEach(function (t) { prev.toks.push(t); });
      } else {
        merged.push(s);
      }
    });
    if (merged.some(function (s) { return s.toks.filter(function (t) { return t.v; }).length !== 1; })) return null;

    var parts = [];
    var strs = merged.map(function (s, idx) { return clause(s, idx, isQ, wordFn, parts); });
    var res = strs[0];
    for (var k = 1; k < merged.length; k++) {
      res += " " + merged[k].conj.nl + " " + strs[k];
    }
    res = res.charAt(0).toUpperCase() + res.slice(1);
    if (isQ) res += "?";
    return { text: res, parts: parts };
  }

  // Geeft { text, parts } terug, of null als de zin niet met de regels te vertalen is
  function translate(text, wordFn) {
    try { return run(text, wordFn); }
    catch (e) { return null; }
  }

  return { translate: translate };
})();
