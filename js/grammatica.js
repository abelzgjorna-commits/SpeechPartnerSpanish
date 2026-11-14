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

  // ---- Vaste woordgroepen en gedrag per zinsdeel
  var NOUN_BEFORE = ["mucho", "poco", "mi", "mis", "tu", "tus", "su", "sus", "un", "una", "el", "la", "los", "las", "muy", "buen", "buena", "nuestro", "nuestra"];
  var GO_NEXT = ["a", "al", "en", "hacia", "hasta", "para"];
  var QW_KEYS = ["que", "como", "donde", "cuando", "quien"];
  var POSS_ES = ["tu", "tus", "mi", "mis", "su", "sus"];
  var DETS = ["el", "la", "un", "una", "tu", "mi", "su"];
  var ADVSET = ["ayer", "hoy", "ya", "siempre", "nunca", "tambien", "todavia", "luego", "despues", "antes", "ahora", "anoche"];
  var DAYS_ES = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  var PRON_KEY = { "yo": "yo", "tú": "tu", "él": "el", "el": "el", "ella": "ella", "usted": "usted",
    "nosotros": "nosotros", "nosotras": "nosotros", "vosotros": "vosotros", "vosotras": "vosotros",
    "ellos": "ellos", "ellas": "ellas" };
  function isVowel(w) { return !!w && /^[aeiouyhàâéèêëîïôöùûüœ]/i.test(w); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // ---- Per taal: persoonlijke voornaamwoorden, vraagwoorden, voegwoorden, dagen
  var IMPLS = {
    nl: ["ik", "je", "hij", "wij", "jullie", "zij"],
    en: ["I", "you", "it", "we", "you", "they"],
    de: ["ich", "du", "es", "wir", "ihr", "sie"],
    fr: ["je", "tu", "il", "nous", "vous", "ils"]
  };
  var SUBJ = {
    yo: { nl: "ik", en: "I", de: "ich", fr: "je" },
    tu: { nl: "je", en: "you", de: "du", fr: "tu" },
    el: { nl: "hij", en: "he", de: "er", fr: "il" },
    ella: { nl: "zij", en: "she", de: "sie", fr: "elle" },
    usted: { nl: "u", en: "you", de: "Sie", fr: "vous" },
    nosotros: { nl: "wij", en: "we", de: "wir", fr: "nous" },
    vosotros: { nl: "jullie", en: "you", de: "ihr", fr: "vous" },
    ellos: { nl: "zij", en: "they", de: "sie", fr: "ils" },
    ellas: { nl: "zij", en: "they", de: "sie", fr: "elles" }
  };
  var QW = {
    nl: { que: "wat", como: "hoe", donde: "waar", cuando: "wanneer", quien: "wie" },
    en: { que: "what", como: "how", donde: "where", cuando: "when", quien: "who" },
    de: { que: "was", como: "wie", donde: "wo", cuando: "wann", quien: "wer" },
    fr: { que: "Qu'est-ce que", como: "comment", donde: "où", cuando: "quand", quien: "qui" }
  };
  var CONJ = {
    porque: { nl: "omdat", en: "because", de: "weil", fr: "parce que" },
    que: { nl: "dat", en: "that", de: "dass", fr: "que" },
    cuando: { nl: null, en: "when", de: null, fr: "quand" },
    y: { nl: "en", en: "and", de: "und", fr: "et" },
    pero: { nl: "maar", en: "but", de: "aber", fr: "mais" }
  };
  var DAYS = {
    nl: { prep: "op", names: ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"] },
    en: { prep: "on", names: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
    de: { prep: "am", names: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"] },
    fr: { prep: "", names: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] }
  };
  function dayName(lang, f) { var i = DAYS_ES.indexOf(f); return i < 0 ? null : DAYS[lang].names[i]; }

  // Bijwoorden en bijvoeglijke naamwoorden (Duits en Frans; Nederlands en Engels komen uit de woordenlijst)
  var ADV_T = {
    ayer: { de: "gestern", fr: "hier" }, hoy: { de: "heute", fr: "aujourd'hui" }, ya: { de: "schon", fr: "déjà" },
    siempre: { de: "immer", fr: "toujours" }, nunca: { de: "nie", fr: "jamais" }, tambien: { de: "auch", fr: "aussi" },
    muy: { de: "sehr", fr: "très" }, mucho: { de: "viel", fr: "beaucoup" }, bien: { de: "gut", fr: "bien" }, mal: { de: "schlecht", fr: "mal" }
  };
  var ADJ_T = {
    tranquilo: { de: "ruhig", fr: "tranquille" }, cansado: { de: "müde", fr: "fatigué" },
    frio: { de: "kalt", fr: "froid" }, triste: { de: "traurig", fr: "triste" }
  };

  // Zelfstandige naamwoorden met geslacht (m, f, n) voor Duits en Frans
  var LEX_RAW = {
    "fin de semana": { de: ["n", "Wochenende"], fr: ["m", "week-end"] },
    "semana": { de: ["f", "Woche"], fr: ["f", "semaine"] },
    "trabajo": { de: ["f", "Arbeit"], fr: ["m", "travail"] },
    "amigo": { de: ["m", "Freund"], fr: ["m", "ami"] },
    "amiga": { de: ["f", "Freundin"], fr: ["f", "amie"] },
    "cine": { de: ["n", "Kino"], fr: ["m", "cinéma"] },
    "conejo": { de: ["n", "Kaninchen"], fr: ["m", "lapin"] },
    "perro": { de: ["m", "Hund"], fr: ["m", "chien"] },
    "gato": { de: ["f", "Katze"], fr: ["m", "chat"] },
    "café": { de: ["m", "Kaffee"], fr: ["m", "café"] },
    "hermano": { de: ["m", "Bruder"], fr: ["m", "frère"] },
    "hermana": { de: ["f", "Schwester"], fr: ["f", "sœur"] },
    "casa": { de: ["n", "Haus"], fr: ["f", "maison"] },
    "hora": { de: ["f", "Uhr"], fr: ["f", "heure"] },
    "tiempo": { de: ["f", "Zeit"], fr: ["m", "temps"] },
    "día": { de: ["m", "Tag"], fr: ["m", "jour"] },
    "noche": { de: ["f", "Nacht"], fr: ["f", "nuit"] },
    "libro": { de: ["n", "Buch"], fr: ["m", "livre"] },
    "coche": { de: ["n", "Auto"], fr: ["f", "voiture"] },
    "mesa": { de: ["m", "Tisch"], fr: ["f", "table"] },
    "ciudad": { de: ["f", "Stadt"], fr: ["f", "ville"] },
    "madre": { de: ["f", "Mutter"], fr: ["f", "mère"] },
    "padre": { de: ["m", "Vater"], fr: ["m", "père"] },
    "familia": { de: ["f", "Familie"], fr: ["f", "famille"] },
    "escuela": { de: ["f", "Schule"], fr: ["f", "école"] },
    "música": { de: ["f", "Musik"], fr: ["f", "musique"] },
    "película": { de: ["m", "Film"], fr: ["m", "film"] },
    "viaje": { de: ["f", "Reise"], fr: ["m", "voyage"] },
    "problema": { de: ["n", "Problem"], fr: ["m", "problème"] },
    "dinero": { de: ["n", "Geld"], fr: ["m", "argent"] }
  };
  var LEXF = {};
  Object.keys(LEX_RAW).forEach(function (k) { LEXF[fold(k)] = LEX_RAW[k]; });

  var DEF = { nom: { m: "der", f: "die", n: "das" }, acc: { m: "den", f: "die", n: "das" }, dat: { m: "dem", f: "der", n: "dem" } };
  var IND = { nom: { m: "ein", f: "eine", n: "ein" }, acc: { m: "einen", f: "eine", n: "ein" }, dat: { m: "einem", f: "einer", n: "einem" } };
  var POSS_DE = {
    mein: { nom: { m: "mein", f: "meine", n: "mein" }, acc: { m: "meinen", f: "meine", n: "mein" }, dat: { m: "meinem", f: "meiner", n: "meinem" } },
    dein: { nom: { m: "dein", f: "deine", n: "dein" }, acc: { m: "deinen", f: "deine", n: "dein" }, dat: { m: "deinem", f: "deiner", n: "deinem" } }
  };

  // ---- Werkwoorden in de andere talen (Spaans lemma -> vorm per taal)
  var VERBS = {
    "ser": { en: { be: true }, de: { inf: "sein", aux: "sein", pp: "gewesen", prt: ["war", "warst", "war", "waren", "wart", "waren"], pres: ["bin", "bist", "ist", "sind", "seid", "sind"] },
      fr: { inf: "être", aux: "avoir", pp: "été", pres: ["suis", "es", "est", "sommes", "êtes", "sont"] } },
    "estar": { en: { be: true }, de: { inf: "sein", aux: "sein", pp: "gewesen", prt: ["war", "warst", "war", "waren", "wart", "waren"], pres: ["bin", "bist", "ist", "sind", "seid", "sind"] },
      fr: { inf: "être", aux: "avoir", pp: "été", pres: ["suis", "es", "est", "sommes", "êtes", "sont"] } },
    "ir": { en: { base: "go", past: "went", s3: "goes" }, de: { inf: "gehen", aux: "sein", pp: "gegangen" },
      fr: { inf: "aller", aux: "être", pp: "allé", pres: ["vais", "vas", "va", "allons", "allez", "vont"] } },
    "tener": { en: { base: "have", past: "had", s3: "has" }, de: { inf: "haben", aux: "haben", pp: "gehabt", prt: ["hatte", "hattest", "hatte", "hatten", "hattet", "hatten"], pres: ["habe", "hast", "hat", "haben", "habt", "haben"] },
      fr: { inf: "avoir", aux: "avoir", pp: "eu", pres: ["ai", "as", "a", "avons", "avez", "ont"] } },
    "hacer": { en: { base: "do", past: "did", s3: "does" }, de: { inf: "machen", aux: "haben", pp: "gemacht" },
      fr: { inf: "faire", aux: "avoir", pp: "fait", pres: ["fais", "fais", "fait", "faisons", "faites", "font"] } },
    "decir": { en: { base: "say", past: "said", s3: "says" }, de: { inf: "sagen", aux: "haben", pp: "gesagt" },
      fr: { inf: "dire", aux: "avoir", pp: "dit", pres: ["dis", "dis", "dit", "disons", "dites", "disent"] } },
    "ver": { en: { base: "see", past: "saw", s3: "sees" }, de: { inf: "sehen", aux: "haben", pp: "gesehen", pres: ["sehe", "siehst", "sieht", "sehen", "seht", "sehen"] },
      fr: { inf: "voir", aux: "avoir", pp: "vu", pres: ["vois", "vois", "voit", "voyons", "voyez", "voient"] } },
    "poder": { en: { modal: true, base: "can", past: "could" }, de: { inf: "können", aux: "haben", pp: "gekonnt", prt: ["konnte", "konntest", "konnte", "konnten", "konntet", "konnten"], pres: ["kann", "kannst", "kann", "können", "könnt", "können"] },
      fr: { inf: "pouvoir", aux: "avoir", pp: "pu", pres: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"] } },
    "querer": { en: { base: "want", past: "wanted", s3: "wants" }, de: { inf: "wollen", aux: "haben", pp: "gewollt", prt: ["wollte", "wolltest", "wollte", "wollten", "wolltet", "wollten"], pres: ["will", "willst", "will", "wollen", "wollt", "wollen"] },
      fr: { inf: "vouloir", aux: "avoir", pp: "voulu", pres: ["veux", "veux", "veut", "voulons", "voulez", "veulent"] } },
    "saber": { en: { base: "know", past: "knew", s3: "knows" }, de: { inf: "wissen", aux: "haben", pp: "gewusst", prt: ["wusste", "wusstest", "wusste", "wussten", "wusstet", "wussten"], pres: ["weiß", "weißt", "weiß", "wissen", "wisst", "wissen"] },
      fr: { inf: "savoir", aux: "avoir", pp: "su", pres: ["sais", "sais", "sait", "savons", "savez", "savent"] } },
    "dar": { en: { base: "give", past: "gave", s3: "gives" }, de: { inf: "geben", aux: "haben", pp: "gegeben", pres: ["gebe", "gibst", "gibt", "geben", "gebt", "geben"] },
      fr: { inf: "donner", aux: "avoir", pp: "donné", pres: ["donne", "donnes", "donne", "donnons", "donnez", "donnent"] } },
    "venir": { en: { base: "come", past: "came", s3: "comes" }, de: { inf: "kommen", aux: "sein", pp: "gekommen" },
      fr: { inf: "venir", aux: "être", pp: "venu", pres: ["viens", "viens", "vient", "venons", "venez", "viennent"] } },
    "leer": { en: { base: "read", past: "read", s3: "reads" }, de: { inf: "lesen", aux: "haben", pp: "gelesen", pres: ["lese", "liest", "liest", "lesen", "lest", "lesen"] },
      fr: { inf: "lire", aux: "avoir", pp: "lu", pres: ["lis", "lis", "lit", "lisons", "lisez", "lisent"] } },
    "dormir": { en: { base: "sleep", past: "slept", s3: "sleeps" }, de: { inf: "schlafen", aux: "haben", pp: "geschlafen", pres: ["schlafe", "schläfst", "schläft", "schlafen", "schlaft", "schlafen"] },
      fr: { inf: "dormir", aux: "avoir", pp: "dormi", pres: ["dors", "dors", "dort", "dormons", "dormez", "dorment"] } },
    "empezar": { en: { base: "start", past: "started", s3: "starts" }, de: { inf: "beginnen", aux: "haben", pp: "begonnen", pres: ["beginne", "beginnst", "beginnt", "beginnen", "beginnt", "beginnen"] },
      fr: { inf: "commencer", aux: "avoir", pp: "commencé", pres: ["commence", "commences", "commence", "commençons", "commencez", "commencent"] } },
    "entender": { en: { base: "understand", past: "understood", s3: "understands" }, de: { inf: "verstehen", aux: "haben", pp: "verstanden", pres: ["verstehe", "verstehst", "versteht", "verstehen", "versteht", "verstehen"] },
      fr: { inf: "comprendre", aux: "avoir", pp: "compris", pres: ["comprends", "comprends", "comprend", "comprenons", "comprenez", "comprennent"] } },
    "jugar": { en: { base: "play", past: "played", s3: "plays" }, de: { inf: "spielen", aux: "haben", pp: "gespielt" },
      fr: { inf: "jouer", aux: "avoir", pp: "joué", pres: ["joue", "joues", "joue", "jouons", "jouez", "jouent"] } },
    "comer": { en: { base: "eat", past: "ate", s3: "eats" }, de: { inf: "essen", aux: "haben", pp: "gegessen", pres: ["esse", "isst", "isst", "essen", "esst", "essen"] },
      fr: { inf: "manger", aux: "avoir", pp: "mangé", pres: ["mange", "manges", "mange", "mangeons", "mangez", "mangent"] } },
    "beber": { en: { base: "drink", past: "drank", s3: "drinks" }, de: { inf: "trinken", aux: "haben", pp: "getrunken" },
      fr: { inf: "boire", aux: "avoir", pp: "bu", pres: ["bois", "bois", "boit", "buvons", "buvez", "boivent"] } },
    "hablar": { en: { base: "talk", past: "talked", s3: "talks" }, de: { inf: "sprechen", aux: "haben", pp: "gesprochen", pres: ["spreche", "sprichst", "spricht", "sprechen", "sprecht", "sprechen"] },
      fr: { inf: "parler", aux: "avoir", pp: "parlé", pres: ["parle", "parles", "parle", "parlons", "parlez", "parlent"] } },
    "trabajar": { en: { base: "work", past: "worked", s3: "works" }, de: { inf: "arbeiten", aux: "haben", pp: "gearbeitet" },
      fr: { inf: "travailler", aux: "avoir", pp: "travaillé", pres: ["travaille", "travailles", "travaille", "travaillons", "travaillez", "travaillent"] } },
    "llegar": { en: { base: "arrive", past: "arrived", s3: "arrives" }, de: null,
      fr: { inf: "arriver", aux: "être", pp: "arrivé", pres: ["arrive", "arrives", "arrive", "arrivons", "arrivez", "arrivent"] } },
    "comprar": { en: { base: "buy", past: "bought", s3: "buys" }, de: { inf: "kaufen", aux: "haben", pp: "gekauft" },
      fr: { inf: "acheter", aux: "avoir", pp: "acheté", pres: ["achète", "achètes", "achète", "achetons", "achetez", "achètent"] } },
    "decidir": { en: { base: "decide", past: "decided", s3: "decides" }, de: { inf: "entscheiden", aux: "haben", pp: "entschieden" },
      fr: { inf: "décider", aux: "avoir", pp: "décidé", pres: ["décide", "décides", "décide", "décidons", "décidez", "décident"] } },
    "estudiar": { en: { base: "study", past: "studied", s3: "studies" }, de: { inf: "studieren", aux: "haben", pp: "studiert" },
      fr: { inf: "étudier", aux: "avoir", pp: "étudié", pres: ["étudie", "étudies", "étudie", "étudions", "étudiez", "étudient"] } },
    "vivir": { en: { base: "live", past: "lived", s3: "lives" }, de: { inf: "leben", aux: "haben", pp: "gelebt" },
      fr: { inf: "vivre", aux: "avoir", pp: "vécu", pres: ["vis", "vis", "vit", "vivons", "vivez", "vivent"] } },
    "cocinar": { en: { base: "cook", past: "cooked", s3: "cooks" }, de: { inf: "kochen", aux: "haben", pp: "gekocht" },
      fr: { inf: "cuisiner", aux: "avoir", pp: "cuisiné", pres: ["cuisine", "cuisines", "cuisine", "cuisinons", "cuisinez", "cuisinent"] } },
    "escuchar": { en: { base: "listen", past: "listened", s3: "listens" }, de: { inf: "hören", aux: "haben", pp: "gehört" },
      fr: { inf: "écouter", aux: "avoir", pp: "écouté", pres: ["écoute", "écoutes", "écoute", "écoutons", "écoutez", "écoutent"] } },
    "mirar": { en: { base: "look", past: "looked", s3: "looks" }, de: { inf: "schauen", aux: "haben", pp: "geschaut" },
      fr: { inf: "regarder", aux: "avoir", pp: "regardé", pres: ["regarde", "regardes", "regarde", "regardons", "regardez", "regardent"] } },
    "correr": { en: { base: "run", past: "ran", s3: "runs" }, de: { inf: "laufen", aux: "sein", pp: "gelaufen", pres: ["laufe", "läufst", "läuft", "laufen", "lauft", "laufen"] },
      fr: { inf: "courir", aux: "avoir", pp: "couru", pres: ["cours", "cours", "court", "courons", "courez", "courent"] } },
    "pasar": { en: { base: "happen", past: "happened", s3: "happens" }, de: { inf: "passieren", aux: "sein", pp: "passiert" }, fr: null },
    "escribir": { en: { base: "write", past: "wrote", s3: "writes" }, de: { inf: "schreiben", aux: "haben", pp: "geschrieben" },
      fr: { inf: "écrire", aux: "avoir", pp: "écrit", pres: ["écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"] } }
  };
  var SEIN_PRES = ["bin", "bist", "ist", "sind", "seid", "sind"];
  var HABEN_PRES = ["habe", "hast", "hat", "haben", "habt", "haben"];
  var AVOIR_PRES = ["ai", "as", "a", "avons", "avez", "ont"];
  var ETRE_PRES = ["suis", "es", "est", "sommes", "êtes", "sont"];
  var ESNL = {};
  ES_VERBS.forEach(function (v) { ESNL[v.es] = v.nl; });

  function verbEntry(es, lang) {
    if (!has(VERBS, es) || !VERBS[es][lang]) throw new Error("werkwoord onbekend in " + lang);
    return VERBS[es][lang];
  }
  // Duitse regelmatige persoonsvormen (Präsens)
  function dePres(inf, p) {
    var stem = inf.slice(0, -2), e = /(d|t|m|n)$/.test(stem);
    if (p === 0) return stem + "e";
    if (p === 1) return stem + (e ? "est" : "st");
    if (p === 2 || p === 4) return stem + (e ? "et" : "t");
    return inf;
  }
  function s3Of(base) {
    if (/(s|sh|ch|x|o)$/.test(base)) return base + "es";
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
    return base + "s";
  }
  function enV(es, tense, p) {
    var v = verbEntry(es, "en");
    if (v.be) return { kind: "be", main: tense === "pres" ? ["am", "are", "is", "are", "are", "are"][p] : ["was", "were", "was", "were", "were", "were"][p] };
    if (v.modal) return { kind: "modal", main: tense === "pres" ? "can" : "could" };
    var main = tense === "pres" ? (p === 2 ? (v.s3 || s3Of(v.base)) : v.base) : v.past;
    return { kind: "lex", main: main, base: v.base, do: tense === "pres" ? (p === 2 ? "does" : "do") : "did" };
  }
  function deV(es, tense, p) {
    var d = verbEntry(es, "de");
    if (tense === "pres") return { fin: d.pres ? d.pres[p] : dePres(d.inf, p), aux: null, pp: null };
    if (d.prt) return { fin: d.prt[p], aux: null, pp: null };
    return { fin: null, aux: (d.aux === "sein" ? SEIN_PRES : HABEN_PRES)[p], pp: d.pp };
  }
  function frV(es, tense, p) {
    var f = verbEntry(es, "fr");
    if (tense === "pres") return { fin: f.pres[p], aux: null, pp: null };
    return { fin: null, aux: (f.aux === "être" ? ETRE_PRES : AVOIR_PRES)[p], pp: f.pp };
  }

  // ---- Zelfstandige naamwoorden en woordgroepen (Duits en Frans)
  function matchNoun(toks, i, lang) {
    for (var n = 3; n >= 1; n--) {
      if (i + n <= toks.length) {
        var key = toks.slice(i, i + n).map(function (t) { return t.f; }).join(" ");
        if (has(LEXF, key) && LEXF[key][lang]) return { n: n, lex: LEXF[key][lang] };
      }
    }
    return null;
  }
  function itemsOf(toks, lang) {
    var items = [], i = 0, pend = null;
    while (i < toks.length) {
      var t = toks[i], f = t.f;
      if (f === "con" || f === "de" || f === "al") {
        if (pend) throw new Error("twee voorzetsels");
        pend = f; i++; continue;
      }
      if (f === "el" && i + 1 < toks.length && dayName(lang, toks[i + 1].f)) {
        if (pend) throw new Error("voorzetsel bij dag");
        items.push({ k: "day", name: dayName(lang, toks[i + 1].f) }); i += 2; continue;
      }
      if (DETS.indexOf(f) >= 0 && f !== "su") {
        var m = matchNoun(toks, i + 1, lang);
        if (!m) throw new Error("naamwoord onbekend");
        items.push({ k: "np", det: f, lex: m.lex, prep: pend }); pend = null; i += 1 + m.n; continue;
      }
      if (f === "mucho") {
        var m2 = matchNoun(toks, i + 1, lang);
        if (m2) { items.push({ k: "np", det: "mucho", lex: m2.lex, prep: pend }); pend = null; i += 1 + m2.n; continue; }
        if (pend) throw new Error("voorzetsel bij bijwoord");
        items.push({ k: "adv", f: f }); i++; continue;
      }
      if (pend === "al") {
        var m3 = matchNoun(toks, i, lang);
        if (m3) { items.push({ k: "np", det: "el", lex: m3.lex, prep: "al" }); pend = null; i += m3.n; continue; }
      }
      if (has(ADJ_T, f) || has(ADV_T, f)) {
        if (pend) throw new Error("voorzetsel bij bijvoeglijk naamwoord");
        items.push({ k: has(ADJ_T, f) ? "adj" : "adv", f: f }); i++; continue;
      }
      throw new Error("woord onbekend: " + t.w);
    }
    if (pend) throw new Error("voorzetsel zonder naamwoord");
    return items;
  }
  function npDE(it, role) {
    var g = it.lex[0], w = it.lex[1];
    var caseK = (it.prep === "con" || it.prep === "de") ? "dat" : (it.prep === "al" ? "acc" : role);
    var pre = it.prep === "con" ? "mit " : it.prep === "de" ? "von " : it.prep === "al" ? "in " : "";
    if (it.det === "mucho") return pre + "viel " + w;
    if (it.prep === "al" && it.det === "el" && g === "n") return "ins " + w;
    var art;
    if (it.det === "el" || it.det === "la") art = DEF[caseK][g];
    else if (it.det === "un" || it.det === "una") art = IND[caseK][g];
    else if (it.det === "mi") art = POSS_DE.mein[caseK][g];
    else if (it.det === "tu") art = POSS_DE.dein[caseK][g];
    if (!art) throw new Error("lidwoord onbekend");
    return pre + art + " " + w;
  }
  function frArt(det, g, w) {
    var vow = isVowel(w);
    if (det === "el" || det === "la") return vow ? "l'" : (g === "f" ? "la " : "le ");
    if (det === "un" || det === "una") return g === "f" ? "une " : "un ";
    if (det === "mi") return (g === "f" && !vow) ? "ma " : "mon ";
    if (det === "tu") return (g === "f" && !vow) ? "ta " : "ton ";
    throw new Error("lidwoord onbekend");
  }
  function npFR(it) {
    var g = it.lex[0], w = it.lex[1];
    if (it.det === "mucho") {
      if (it.prep) throw new Error("voorzetsel bij beaucoup");
      return isVowel(w) ? "beaucoup d'" + w : "beaucoup de " + w;
    }
    if (it.prep === "de") throw new Error("de + naamwoord niet ondersteund");
    if (it.prep === "al") {
      if (it.det !== "el") throw new Error("al zonder lidwoord");
      if (g === "m") return "au " + w;
      return isVowel(w) ? "à l'" + w : "à la " + w;
    }
    return (it.prep === "con" ? "avec " : "") + frArt(it.det, g, w) + w;
  }
  function renderItems(lang, items, role) {
    return items.map(function (it) {
      if (it.k === "np") return lang === "de" ? npDE(it, role) : npFR(it);
      if (it.k === "day") return lang === "de" ? "am " + it.name : it.name;
      var v = ADV_T[it.f] || ADJ_T[it.f];
      if (!v || !v[lang]) throw new Error("vertaling onbekend");
      return v[lang];
    }).join(" ");
  }

  // Woordgroep vertalen: Nederlands en Engels via de woordenlijst, Duits en Frans via de tabel
  function trans(lang, toks, wordFn) {
    var out = [], i = 0;
    while (i < toks.length) {
      var done = false;
      for (var sz = 3; sz >= 2 && !done; sz--) {
        if (i + sz <= toks.length) {
          var span = toks.slice(i, i + sz).map(function (t) { return t.w; }).join(" ");
          var pv = wordFn(span);
          if (pv) { out.push(pv); i += sz; done = true; }
        }
      }
      if (done) continue;
      var t = toks[i];
      if (t.f === "el" && i + 1 < toks.length && dayName(lang, toks[i + 1].f)) {
        var pr = DAYS[lang].prep;
        out.push((pr ? pr + " " : "") + dayName(lang, toks[i + 1].f)); i += 2; continue;
      }
      if (lang === "nl" && (t.w === "tu" || t.w === "tus")) { out.push("je"); i++; continue; }
      if (lang === "en" && t.f === "mucho") {
        var nx0 = i + 1 < toks.length ? wordFn(toks[i + 1].w) : null;
        out.push(nx0 ? "a lot of" : "a lot"); i++; continue;
      }
      var v = wordFn(t.w);
      if (!v) throw new Error("woord onbekend: " + t.w);
      if (lang === "en" && (t.f === "un" || t.f === "una")) {
        var nx = i + 1 < toks.length ? wordFn(toks[i + 1].w) : null;
        if (nx && /^[aeiou]/i.test(nx)) v = "an";
      }
      out.push(v); i++;
    }
    return out;
  }
  function phrase(lang, toks, role, wordFn) {
    if (lang === "de" || lang === "fr") return renderItems(lang, itemsOf(toks, lang), role);
    return trans(lang, toks, wordFn).join(" ");
  }

  // ---- Ontleding van de Spaanse zin
  function parse(text) {
    var isQ = /[¿?]/.test(text);
    var words = text.toLowerCase().replace(/[¿¡?!.,;:()"«»…]/g, " ").split(/\s+/).filter(function (x) { return x; });
    if (!words.length) return null;
    var toks = words.map(function (w) { return { w: w, f: fold(w) }; });
    if (toks.some(function (t) { return t.f === "hace" || t.f === "hay"; })) return null; // idiomen niet vertalen
    toks.forEach(function (t, i) {
      var c = has(ESEX, t.w) ? ESEX[t.w] : (has(ESIDX, t.f) ? ESIDX[t.f] : null);
      if (!c) return;
      if (i === 0 && QW_KEYS.indexOf(t.f) >= 0) return; // "¿Cómo…?" is een vraagwoord, niet "como" (ik eet)
      if (i > 0 && NOUN_BEFORE.indexOf(toks[i - 1].w) >= 0) return; // "mucho trabajo" is een naamwoord
      var pick = c[0];
      if (c.length > 1) {
        var nxt = toks[i + 1] ? toks[i + 1].f : "";
        var wantIr = GO_NEXT.indexOf(nxt) >= 0;
        pick = c.filter(function (x) { return (x.es === "ir") === wantIr; })[0] || c[0];
      }
      t.v = pick;
    });
    // Opdelen in clausules
    var segs = [], cur = { conj: null, toks: [] };
    toks.forEach(function (t, i) {
      var key = null;
      if (i > 0) {
        if (t.f === "porque" || t.f === "que" || t.f === "cuando" || t.f === "y" || t.f === "pero") key = t.f;
      }
      if (key) {
        segs.push(cur);
        cur = { conj: { key: key, sub: ["porque", "que", "cuando"].indexOf(key) >= 0 }, toks: [] };
      } else cur.toks.push(t);
    });
    segs.push(cur);
    var merged = [];
    segs.forEach(function (s, idx) {
      var hasV = s.toks.some(function (t) { return t.v; });
      if (idx > 0 && !hasV && !s.conj.sub && merged.length) {
        var prev = merged[merged.length - 1];
        prev.toks.push({ w: s.conj.key, f: s.conj.key });
        s.toks.forEach(function (t) { prev.toks.push(t); });
      } else {
        merged.push({ conj: idx === 0 ? null : s.conj, toks: s.toks });
      }
    });
    if (merged.some(function (s) { return s.toks.filter(function (t) { return t.v; }).length !== 1; })) return null;
    return {
      isQ: isQ,
      segs: merged.map(function (s, idx) {
        var vi = -1;
        s.toks.forEach(function (t, i) { if (vi < 0 && t.v) vi = i; });
        var vt = s.toks[vi];
        var neg = s.toks.some(function (t) { return t.f === "no"; });
        var pre = s.toks.slice(0, vi).filter(function (t) { return t.f !== "no"; });
        var post = s.toks.slice(vi + 1).filter(function (t) { return t.f !== "no"; });
        var qw = null;
        if (idx === 0 && pre.length && QW_KEYS.indexOf(pre[0].f) >= 0) { qw = pre[0].f; pre = pre.slice(1); }
        var pron = null;
        if (pre.length && has(PRON_KEY, pre[pre.length - 1].w)) { pron = PRON_KEY[pre[pre.length - 1].w]; pre = pre.slice(0, -1); }
        var adv = pre.filter(function (t) { return ADVSET.indexOf(t.f) >= 0; });
        var np = pre.filter(function (t) { return ADVSET.indexOf(t.f) < 0; });
        var postNP = !!qw && post.length > 0 && (POSS_ES.indexOf(post[0].f) >= 0 ||
          (DETS.indexOf(post[0].f) >= 0 && !(post[1] && DAYS_ES.indexOf(post[1].f) >= 0)));
        return { conj: s.conj, qw: qw, pron: pron, neg: neg, adv: adv, np: np,
          verb: { es: vt.v.es, tense: vt.v.tense, p: vt.v.p, w: vt.w }, rest: post, postNP: postNP };
      })
    };
  }

  // ---- Zin opbouwen per taal
  function realize(lang, seg, wordFn, parts) {
    var v = seg.verb;
    var tense = v.tense === "pres" ? "pres" : "pret";
    var S = { p: v.p, tense: tense, neg: seg.neg, qw: null, subj: null, subjNP: null, adv: null, rest: "", postNP: seg.postNP, v: null };
    if (seg.qw) S.qw = QW[lang][seg.qw];
    if (seg.pron) S.subj = SUBJ[seg.pron][lang];
    if (seg.np.length) S.subjNP = phrase(lang, seg.np, "nom", wordFn);
    if (seg.adv.length) S.adv = phrase(lang, seg.adv, "acc", wordFn);
    S.timeOnly = seg.rest.length > 0 && seg.rest.every(function (t) {
      return has(ADV_T, t.f) || DAYS_ES.indexOf(t.f) >= 0 || t.f === "el";
    });
    if (seg.postNP) {
      if (S.subjNP) throw new Error("twee onderwerpen");
      S.subjNP = phrase(lang, seg.rest, "nom", wordFn);
    } else if (seg.rest.length) {
      S.rest = phrase(lang, seg.rest, "acc", wordFn);
    }
    if (lang === "nl") {
      var fin = nlVerb(ESNL[v.es], tense, v.p);
      var inv = (tense === "pres" && v.p === 1) ? nlVerb(ESNL[v.es], tense, 0) : fin;
      S.v = { fin: fin, inv: inv };
    } else if (lang === "en") {
      S.v = enV(v.es, tense, v.p);
    } else if (lang === "de") {
      S.v = deV(v.es, tense, v.p);
    } else {
      S.v = frV(v.es, tense, v.p);
    }
    var shown = S.v.fin || (S.v.aux ? S.v.aux + " " + S.v.pp : null) || S.v.main || S.v.inv || "";
    parts.push(v.w + " = " + shown + " (" + v.es + ", " + PERS[v.p] + ", " +
      (tense === "pres" ? "tegenwoordige tijd" : "verleden tijd") + ")");
    return S;
  }
  function asmNL(S, kind) {
    var verb = S.v.fin, verbI = S.v.inv;
    var subj = S.subj || S.subjNP || IMPL[S.p];
    var neg = S.neg ? "niet" : null;
    var parts;
    if (kind === "sub") parts = [subj, S.adv, neg, S.rest, verb];
    else if (kind === "wh") parts = [S.qw, verbI, subj, neg, S.rest];
    else if (kind === "yn") parts = [verbI, subj, neg, S.adv, S.rest];
    else parts = S.adv ? [S.adv, verb, subj, neg, S.rest] : [subj, verb, neg, S.rest];
    return parts.filter(Boolean).join(" ");
  }
  function asmEN(S, kind) {
    var v = S.v, subj = S.subj || S.subjNP || IMPLS.en[S.p];
    var parts;
    if (kind === "wh" || kind === "yn") {
      var qp = S.qw ? [S.qw] : [];
      if (v.kind === "lex") parts = qp.concat([v.do, subj, S.neg ? "not" : null, v.base, S.rest]);
      else parts = qp.concat([v.main, subj, S.neg ? "not" : null, S.rest]);
    } else {
      parts = [S.adv, subj];
      if (v.kind === "be") parts.push(v.main + (S.neg ? " not" : ""));
      else if (v.kind === "modal") parts.push(S.neg ? (v.main === "can" ? "cannot" : "could not") : v.main);
      else if (S.neg) parts.push(v.do, "not", v.base);
      else parts.push(v.main);
      parts.push(S.rest);
    }
    return parts.filter(Boolean).join(" ");
  }
  function asmDE(S, kind) {
    var v = S.v, sj = S.subj || S.subjNP || IMPLS.de[S.p];
    var fa = v.aux || v.fin, neg = S.neg ? "nicht" : null, parts;
    // Bij tijdsbepalingen na het werkwoord komt "nicht" achteraan: "isst heute nicht"
    var nb = S.timeOnly ? null : neg, na = S.timeOnly ? neg : null;
    if (kind === "sub") parts = [sj, nb, S.rest, na, v.pp, v.aux || v.fin];
    else if (kind === "wh") parts = [S.qw, fa, sj, nb, S.rest, na, v.pp];
    else if (kind === "yn") parts = [fa, sj, nb, S.rest, na, v.pp];
    else if (S.adv) parts = [S.adv, fa, sj, nb, S.rest, na, v.pp];
    else parts = [sj, fa, nb, S.rest, na, v.pp];
    return parts.filter(Boolean).join(" ");
  }
  function asmFR(S, kind) {
    var v = S.v, first = v.aux || v.fin, neg = S.neg;
    var vpart = neg ? (isVowel(first) ? "n'" + first : "ne " + first) : first;
    var pas = neg ? "pas" : null;
    var nounSubj = !S.subj && S.subjNP ? S.subjNP : null;
    var subj = S.subj || nounSubj || IMPLS.fr[S.p];
    var clause = nounSubj ? nounSubj + " " + vpart
      : (subj === "je" && !neg && isVowel(first) ? "j'" + first : subj + " " + vpart);
    var parts;
    if (kind === "sub") parts = [clause, pas, v.pp, S.rest];
    else if (kind === "yn") parts = ["Est-ce que", clause, pas, v.pp, S.rest];
    else if (kind === "wh") {
      if (S.qw === QW.fr.que) parts = [S.qw, clause, pas, v.pp, S.rest];
      else if (nounSubj) parts = [S.qw, vpart, v.pp, nounSubj, S.rest];
      else parts = [S.qw, "est-ce que", clause, pas, v.pp, S.rest];
    } else parts = [S.adv, clause, pas, v.pp, S.rest];
    return parts.filter(Boolean).join(" ");
  }
  function conjWord(conj, lang, S) {
    if (conj.key === "cuando") {
      if (lang === "nl") return S.tense === "pret" ? "toen" : "als";
      if (lang === "de") return S.tense === "pret" ? "als" : "wenn";
    }
    return CONJ[conj.key][lang];
  }

  // "me/te/nos gusta(n) X" heeft een eigen vorm: het onderwerp van de Nederlandse, Engelse, Duitse en Franse zin is
  // de persoon die iets leuk vindt. Geeft null als de zin niet over "gustar" gaat.
  function gustar(lang, text, wordFn) {
    var isQ = /[¿?]/.test(text);
    var words = text.toLowerCase().replace(/[¿¡?!.,;:()"«»…]/g, " ").split(/\s+/).filter(function (x) { return x; });
    var neg = false;
    if (words[0] === "no") { neg = true; words = words.slice(1); }
    if (words.length < 3 || ["me", "te", "nos"].indexOf(words[0]) < 0 || (words[1] !== "gusta" && words[1] !== "gustan")) return null;
    var who = words[0], objW = words.slice(2);
    var mucho = objW.length === 1 && objW[0] === "mucho";
    if (mucho && (isQ || neg || who !== "me")) return null;
    var obj = mucho ? "" : phrase(lang, objW.map(function (w) { return { w: w, f: fold(w) }; }), "acc", wordFn);
    var out;
    if (lang === "nl") {
      if (mucho) out = "Ik vind het erg leuk";
      else if (who === "te") out = (isQ ? "Vind je " : "Je vindt ") + obj + (neg ? " niet" : "") + " leuk";
      else out = (who === "me" ? "Ik vind " : "Wij vinden ") + obj + (neg ? " niet" : "") + " leuk";
    } else if (lang === "en") {
      if (mucho) out = "I like it a lot";
      else if (who === "te" && isQ) out = "Do you" + (neg ? " not" : "") + " like " + obj;
      else out = (who === "me" ? "I" : who === "nos" ? "we" : "you") + (neg ? " do not" : "") + " like " + obj;
    } else if (lang === "de") {
      if (mucho) out = "Ich mag es sehr";
      else if (who === "te") out = (isQ ? "Magst du " : "Du magst ") + obj + (neg ? " nicht" : "");
      else out = (who === "me" ? "Ich mag " : "Wir mögen ") + obj + (neg ? " nicht" : "");
    } else {
      if (mucho) out = "J'aime beaucoup";
      else if (who === "te") out = "Tu " + (neg ? "n'aimes pas " : "aimes ") + obj;
      else if (who === "nos") out = "Nous " + (neg ? "n'aimons pas " : "aimons ") + obj;
      else out = (neg ? "Je n'aime pas " : "J'aime ") + obj;
    }
    if (isQ) out += lang === "fr" ? " ?" : "?";
    return { text: cap(out), parts: [] };
  }

  function translate(text, wordFn, lang) {
    lang = lang || "nl";
    try {
      var gu = gustar(lang, text, wordFn);
      if (gu) return gu;
      var P = parse(text);
      if (!P) return null;
      var parts = [];
      var pieces = P.segs.map(function (seg, idx) {
        var S = realize(lang, seg, wordFn, parts);
        var kind = (P.isQ && idx === 0 && S.qw) ? "wh" : (P.isQ && idx === 0) ? "yn" : (seg.conj && seg.conj.sub) ? "sub" : "decl";
        var s = lang === "nl" ? asmNL(S, kind) : lang === "en" ? asmEN(S, kind) : lang === "de" ? asmDE(S, kind) : asmFR(S, kind);
        if (idx > 0 && seg.conj) s = conjWord(seg.conj, lang, S) + " " + s;
        return s;
      });
      var txt = cap(pieces.join(lang === "de" ? ", " : " "));
      if (P.isQ) txt += lang === "fr" ? " ?" : "?";
      return { text: txt, parts: parts };
    } catch (e) {
      return null;
    }
  }

  // Losse naamwoordgroep met lidwoord, bijvoorbeeld voor de antwoorden van de app.
  // Geeft null als het zelfstandig naamwoord niet in de tabel staat.
  function np(lang, det, noun, role, prep) {
    try {
      var toks = [];
      if (prep) toks.push({ w: prep, f: fold(prep) });
      toks.push({ w: det, f: fold(det) });
      toks.push({ w: noun, f: fold(noun) });
      return renderItems(lang, itemsOf(toks, lang), role || "acc");
    } catch (e) {
      return null;
    }
  }

  // Geslacht van een zelfstandig naamwoord in een taal ("m", "f" of "n"), of null als het niet in de tabel staat
  function gen(noun, lang) {
    var e = LEXF[fold(noun)];
    return e && e[lang] ? e[lang][0] : null;
  }

  return { translate: translate, np: np, gen: gen };
})();
