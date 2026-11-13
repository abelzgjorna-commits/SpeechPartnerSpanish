// Inhoud van de gids. Elke zin heeft een Spaanse tekst (es) en een vertaling
// per taal (m: nl, en, de, fr). Het Spaans zelf blijft Spaans.
function p(es, nl, en, de, fr) { return { es: es, m: m(nl, en, de, fr) }; }

// ---------- Zinnen per categorie ----------
var PHRASES = {
  "Gesprek openen": [
    p("¿Qué tal?", "Hoe gaat het?", "How's it going?", "Wie geht's?", "Ça va ?"),
    p("¿Qué tal el fin de semana?", "Hoe was je weekend?", "How was your weekend?", "Wie war dein Wochenende?", "Comment s'est passé ton week-end ?"),
    p("¿Qué has hecho hoy?", "Wat heb je vandaag gedaan?", "What have you done today?", "Was hast du heute gemacht?", "Qu'est-ce que tu as fait aujourd'hui ?"),
    p("¡Qué bien verte!", "Wat leuk je te zien!", "Great to see you!", "Schön, dich zu sehen!", "Quel plaisir de te voir !")
  ],
  "Doorvragen": [
    p("¿Y tú?", "En jij?", "And you?", "Und du?", "Et toi ?"),
    p("¿Cómo fue?", "Hoe was het?", "How was it?", "Wie war es?", "Comment ça s'est passé ?"),
    p("¿Por qué?", "Waarom?", "Why?", "Warum?", "Pourquoi ?"),
    p("¿Desde cuándo?", "Sinds wanneer?", "Since when?", "Seit wann?", "Depuis quand ?"),
    p("Cuéntame más.", "Vertel meer.", "Tell me more.", "Erzähl mehr.", "Raconte-moi plus."),
    p("¿Qué pasó después?", "Wat gebeurde er daarna?", "What happened after that?", "Was ist danach passiert?", "Qu'est-ce qui s'est passé après ?")
  ],
  "Meningen geven": [
    p("Creo que sí.", "Ik denk van wel.", "I think so.", "Ich glaube schon.", "Je crois que oui."),
    p("Creo que no.", "Ik denk van niet.", "I don't think so.", "Ich glaube nicht.", "Je crois que non."),
    p("Me parece bien.", "Ik vind het goed.", "I think that's fine.", "Das finde ich gut.", "Ça me paraît bien."),
    p("Me parece un poco raro.", "Ik vind het een beetje raar.", "I think it's a bit strange.", "Das finde ich etwas komisch.", "Ça me paraît un peu bizarre."),
    p("A mí me gusta mucho.", "Ik vind het erg leuk.", "I really like it.", "Ich mag es sehr.", "Moi, j'aime beaucoup."),
    p("Yo no estoy de acuerdo.", "Ik ben het er niet mee eens.", "I don't agree.", "Ich bin nicht einverstanden.", "Je ne suis pas d'accord.")
  ],
  "Tijd winnen": [
    p("A ver...", "Even kijken...", "Let me see...", "Mal sehen...", "Voyons voir..."),
    p("Espera, lo pienso.", "Wacht, ik denk even na.", "Wait, let me think.", "Warte, ich denke kurz nach.", "Attends, je réfléchis."),
    p("Déjame pensar.", "Laat me nadenken.", "Let me think.", "Lass mich nachdenken.", "Laisse-moi réfléchir."),
    p("Bueno, pues...", "Nou, dan...", "Well, then...", "Also, na ja...", "Eh bien, alors...")
  ],
  "Herhaling vragen": [
    p("¿Puedes repetirlo, por favor?", "Kun je dat herhalen, alsjeblieft?", "Can you repeat that, please?", "Kannst du das bitte wiederholen?", "Tu peux le répéter, s'il te plaît ?"),
    p("Más despacio, por favor.", "Iets langzamer, alsjeblieft.", "Slower, please.", "Etwas langsamer, bitte.", "Plus lentement, s'il te plaît."),
    p("No entiendo.", "Ik begrijp het niet.", "I don't understand.", "Ich verstehe nicht.", "Je ne comprends pas."),
    p("¿Qué significa...?", "Wat betekent...?", "What does ... mean?", "Was bedeutet ...?", "Que signifie... ?")
  ],
  "Afronden": [
    p("Tengo que irme.", "Ik moet gaan.", "I have to go.", "Ich muss gehen.", "Je dois y aller."),
    p("Me alegro de verte.", "Leuk je gezien te hebben.", "Nice to have seen you.", "Schön, dich gesehen zu haben.", "Ravi de t'avoir vu."),
    p("Hablamos luego.", "Praten we later.", "Let's talk later.", "Wir sprechen später.", "On se parle plus tard."),
    p("Nos vemos.", "Tot ziens.", "See you.", "Bis bald.", "À bientôt.")
  ]
};

// Vastlopen: reddingszinnen
var STUCK = [
  p("¿Cómo se dice... en español?", "Hoe zeg je ... in het Spaans?", "How do you say ... in Spanish?", "Wie sagt man ... auf Spanisch?", "Comment dit-on ... en espagnol ?"),
  p("No me sale la palabra.", "Het woord komt niet bij me op.", "The word won't come to me.", "Mir fällt das Wort nicht ein.", "Le mot ne me vient pas."),
  p("Lo digo de otra manera.", "Ik zeg het op een andere manier.", "Let me say it another way.", "Ich sage es anders.", "Je le dis autrement."),
  p("Es algo como...", "Het is zoiets als...", "It's something like...", "Es ist so etwas wie...", "C'est un peu comme..."),
  p("Es lo que se usa para...", "Het is wat je gebruikt om...", "It's what you use to...", "Das benutzt man, um ...", "C'est ce qu'on utilise pour..."),
  p("¿Me explicas esa palabra?", "Kun je dat woord uitleggen?", "Can you explain that word?", "Kannst du mir das Wort erklären?", "Tu peux m'expliquer ce mot ?")
];

// Onderwerpen: vragen voor als het gesprek stilvalt
var TOPICS = [
  p("¿Qué te gusta hacer los fines de semana?", "Wat doe je graag in het weekend?", "What do you like doing on weekends?", "Was machst du gern am Wochenende?", "Qu'est-ce que tu aimes faire le week-end ?"),
  p("¿Cómo es tu trabajo o tu estudio?", "Hoe is je werk of studie?", "What's your job or studies like?", "Wie ist deine Arbeit oder dein Studium?", "Comment est ton travail ou tes études ?"),
  p("¿Qué música escuchas últimamente?", "Wat voor muziek luister je de laatste tijd?", "What music have you been listening to lately?", "Welche Musik hörst du in letzter Zeit?", "Quelle musique écoutes-tu ces temps-ci ?"),
  p("¿Qué serie o película te gustó?", "Welke serie of film vond je goed?", "What series or film did you like?", "Welche Serie oder welcher Film hat dir gefallen?", "Quelle série ou quel film t'a plu ?"),
  p("¿Qué planes tienes para las vacaciones?", "Wat zijn je plannen voor de vakantie?", "What are your plans for the holidays?", "Was hast du für den Urlaub vor?", "Quels sont tes projets pour les vacances ?"),
  p("¿Qué opinas de la comida de aquí?", "Wat vind je van het eten hier?", "What do you think of the food here?", "Was hältst du vom Essen hier?", "Que penses-tu de la cuisine d'ici ?"),
  p("¿Cuál fue lo mejor de tu semana?", "Wat was het beste van je week?", "What was the best part of your week?", "Was war das Beste an deiner Woche?", "Quel a été le meilleur moment de ta semaine ?"),
  p("¿Qué te gustaría aprender este año?", "Wat zou je dit jaar willen leren?", "What would you like to learn this year?", "Was würdest du dieses Jahr gern lernen?", "Qu'est-ce que tu aimerais apprendre cette année ?")
];

// Zin bouwen: patronen (label + voorbeeld)
var PATTERNS = [
  { label: m("Ayer + yo + fui a... (verleden tijd)", "Ayer + yo + fui a... (past tense)", "Ayer + yo + fui a... (Vergangenheit)", "Ayer + yo + fui a... (passé)"), ex: p("Ayer fui al cine con mi amigo.", "Gisteren ging ik met mijn vriend naar de bioscoop.", "Yesterday I went to the cinema with my friend.", "Gestern bin ich mit meinem Freund ins Kino gegangen.", "Hier je suis allé au cinéma avec mon ami.") },
  { label: m("Hoy + yo + estoy + ... (toestand)", "Hoy + yo + estoy + ... (state)", "Hoy + yo + estoy + ... (Zustand)", "Hoy + yo + estoy + ... (état)"), ex: p("Hoy estoy cansado porque trabajé mucho.", "Vandaag ben ik moe, omdat ik veel heb gewerkt.", "Today I'm tired because I worked a lot.", "Heute bin ich müde, weil ich viel gearbeitet habe.", "Aujourd'hui je suis fatigué parce que j'ai beaucoup travaillé.") },
  { label: m("Me gusta + werkwoord in de infinitief", "Me gusta + infinitive verb", "Me gusta + Infinitiv", "Me gusta + infinitif"), ex: p("Me gusta cocinar los domingos.", "Ik kook graag op zondag.", "I like cooking on Sundays.", "Ich koche sonntags gern.", "J'aime cuisiner le dimanche.") },
  { label: m("Creo que + zin", "Creo que + sentence", "Creo que + Satz", "Creo que + phrase"), ex: p("Creo que va a llover mañana.", "Ik denk dat het morgen gaat regenen.", "I think it's going to rain tomorrow.", "Ich glaube, morgen regnet es.", "Je crois qu'il va pleuvoir demain.") },
  { label: m("Cuando + zin, + zin", "Cuando + clause, + clause", "Cuando + Satz, + Satz", "Cuando + proposition, + proposition"), ex: p("Cuando tengo tiempo, leo un libro.", "Als ik tijd heb, lees ik een boek.", "When I have time, I read a book.", "Wenn ich Zeit habe, lese ich ein Buch.", "Quand j'ai le temps, je lis un livre.") },
  { label: m("Quiero + infinitief", "Quiero + infinitive", "Quiero + Infinitiv", "Quiero + infinitif"), ex: p("Quiero aprender más palabras.", "Ik wil meer woorden leren.", "I want to learn more words.", "Ich möchte mehr Wörter lernen.", "Je veux apprendre plus de mots.") }
];

// Wanneer zeg je dit (uitleg per zin, in het Spaans als sleutel)
var WHEN = {
  "¿Qué tal?": m("als je iemand begroet en wilt weten hoe het gaat.", "when you greet someone and want to know how they are.", "wenn du jemanden begrüßt und wissen willst, wie es geht.", "quand tu salues quelqu'un et veux savoir comment il va."),
  "¿Qué tal el fin de semana?": m("als je iemand na het weekend spreekt.", "when you speak to someone after the weekend.", "wenn du jemanden nach dem Wochenende sprichst.", "quand tu parles à quelqu'un après le week-end."),
  "¿Qué has hecho hoy?": m("als je wilt weten wat iemand vandaag heeft gedaan.", "when you want to know what someone has done today.", "wenn du wissen willst, was jemand heute gemacht hat.", "quand tu veux savoir ce que quelqu'un a fait aujourd'hui."),
  "¡Qué bien verte!": m("als je iemand blij tegenkomt.", "when you meet someone and are happy to see them.", "wenn du jemanden triffst und dich freust.", "quand tu croises quelqu'un avec plaisir."),
  "¿Y tú?": m("als iemand jou iets vraagt en jij het terugvraagt.", "when someone asks you something and you ask back.", "wenn dich jemand etwas fragt und du zurückfragst.", "quand on te pose une question et que tu la renvoies."),
  "¿Cómo fue?": m("als je wilt weten hoe iets is gegaan.", "when you want to know how something went.", "wenn du wissen willst, wie etwas gelaufen ist.", "quand tu veux savoir comment ça s'est passé."),
  "¿Por qué?": m("als je de reden wilt weten.", "when you want to know the reason.", "wenn du den Grund wissen willst.", "quand tu veux connaître la raison."),
  "¿Desde cuándo?": m("als je wilt weten sinds wanneer iets zo is.", "when you want to know since when something is like this.", "wenn du wissen willst, seit wann etwas so ist.", "quand tu veux savoir depuis quand c'est comme ça."),
  "Cuéntame más.": m("als je wilt dat iemand meer vertelt.", "when you want someone to tell you more.", "wenn du möchtest, dass jemand mehr erzählt.", "quand tu veux que quelqu'un en dise plus."),
  "¿Qué pasó después?": m("als je wilt weten wat er daarna gebeurde.", "when you want to know what happened next.", "wenn du wissen willst, was danach passiert ist.", "quand tu veux savoir ce qui s'est passé ensuite."),
  "Creo que sí.": m("als je het ergens mee eens bent, maar niet helemaal zeker weet.", "when you agree with something but aren't completely sure.", "wenn du etwas zustimmst, dir aber nicht ganz sicher bist.", "quand tu es plutôt d'accord, mais pas tout à fait sûr."),
  "Creo que no.": m("als je denkt dat iets niet zo is.", "when you think something isn't so.", "wenn du denkst, dass etwas nicht so ist.", "quand tu penses que ce n'est pas le cas."),
  "Me parece bien.": m("als je iets goed vindt.", "when you think something is good.", "wenn du etwas gut findest.", "quand tu trouves que quelque chose est bien."),
  "Me parece un poco raro.": m("als je iets een beetje vreemd vindt.", "when you find something a bit strange.", "wenn du etwas ein bisschen seltsam findest.", "quand tu trouves quelque chose un peu bizarre."),
  "A mí me gusta mucho.": m("als je zegt dat je iets erg leuk vindt.", "when you say you really like something.", "wenn du sagst, dass dir etwas sehr gefällt.", "quand tu dis que tu aimes beaucoup quelque chose."),
  "Yo no estoy de acuerdo.": m("als je het niet eens bent met iemand.", "when you disagree with someone.", "wenn du mit jemandem nicht einverstanden bist.", "quand tu n'es pas d'accord avec quelqu'un."),
  "A ver...": m("als je even nadenkt voordat je antwoordt.", "when you pause to think before answering.", "wenn du kurz überlegst, bevor du antwortest.", "quand tu réfléchis un instant avant de répondre."),
  "Espera, lo pienso.": m("als je wilt dat iemand even wacht.", "when you want someone to wait a moment.", "wenn du möchtest, dass jemand kurz wartet.", "quand tu veux que quelqu'un attende un peu."),
  "Déjame pensar.": m("als je even tijd nodig hebt om na te denken.", "when you need a moment to think.", "wenn du einen Moment zum Nachdenken brauchst.", "quand tu as besoin d'un moment pour réfléchir."),
  "Bueno, pues...": m("als je iets nieuws gaat zeggen of een besluit neemt.", "when you are about to say something new or decide.", "wenn du etwas Neues sagen oder dich entscheiden willst.", "quand tu vas dire quelque chose de nouveau ou décider."),
  "¿Puedes repetirlo, por favor?": m("als je iets niet goed hebt gehoord.", "when you didn't hear something well.", "wenn du etwas nicht gut verstanden hast.", "quand tu n'as pas bien entendu."),
  "Más despacio, por favor.": m("als iemand te snel praat.", "when someone speaks too fast.", "wenn jemand zu schnell spricht.", "quand quelqu'un parle trop vite."),
  "No entiendo.": m("als je iets niet begrijpt.", "when you don't understand something.", "wenn du etwas nicht verstehst.", "quand tu ne comprends pas quelque chose."),
  "¿Qué significa...?": m("als je wilt weten wat een woord betekent.", "when you want to know what a word means.", "wenn du wissen willst, was ein Wort bedeutet.", "quand tu veux savoir ce qu'un mot signifie."),
  "Tengo que irme.": m("als je weg moet.", "when you have to leave.", "wenn du gehen musst.", "quand tu dois partir."),
  "Me alegro de verte.": m("als je blij bent iemand te zien.", "when you are happy to see someone.", "wenn du dich freust, jemanden zu sehen.", "quand tu es content de voir quelqu'un."),
  "Hablamos luego.": m("als je afscheid neemt en later nog gaat praten.", "when you say goodbye and will talk again later.", "wenn du dich verabschiedest und später noch sprichst.", "quand tu dis au revoir et que vous vous reparlerez plus tard."),
  "Nos vemos.": m("als je afscheid neemt.", "when you say goodbye.", "wenn du dich verabschiedest.", "quand tu dis au revoir."),
  "¿Cómo se dice... en español?": m("als je niet weet hoe je iets in het Spaans zegt.", "when you don't know how to say something in Spanish.", "wenn du nicht weißt, wie man etwas auf Spanisch sagt.", "quand tu ne sais pas comment dire quelque chose en espagnol."),
  "No me sale la palabra.": m("als een woord je even niet te binnen schiet.", "when a word won't come to you.", "wenn dir ein Wort gerade nicht einfällt.", "quand un mot ne te vient pas."),
  "Lo digo de otra manera.": m("als je het anders gaat zeggen, zodat het duidelijker wordt.", "when you're going to say it differently, so it's clearer.", "wenn du es anders sagst, damit es klarer wird.", "quand tu vas le dire autrement, pour être plus clair."),
  "Es algo como...": m("als je iets uitlegt met een voorbeeld.", "when you explain something with an example.", "wenn du etwas mit einem Beispiel erklärst.", "quand tu expliques quelque chose avec un exemple."),
  "Es lo que se usa para...": m("als je uitlegt waarvoor iets dient.", "when you explain what something is used for.", "wenn du erklärst, wofür etwas benutzt wird.", "quand tu expliques à quoi sert quelque chose."),
  "¿Me explicas esa palabra?": m("als je wilt dat iemand een woord uitlegt.", "when you want someone to explain a word.", "wenn du möchtest, dass jemand ein Wort erklärt.", "quand tu veux que quelqu'un explique un mot."),
  "¿Qué te gusta hacer los fines de semana?": m("om een gesprek over het weekend te beginnen.", "to start a conversation about the weekend.", "um ein Gespräch über das Wochenende zu beginnen.", "pour lancer une conversation sur le week-end."),
  "¿Cómo es tu trabajo o tu estudio?": m("om te vragen naar het werk of de studie van iemand.", "to ask about someone's job or studies.", "um nach Arbeit oder Studium zu fragen.", "pour demander le travail ou les études de quelqu'un."),
  "¿Qué música escuchas últimamente?": m("om over muziek te praten.", "to talk about music.", "um über Musik zu sprechen.", "pour parler de musique."),
  "¿Qué serie o película te gustó?": m("om over een film of serie te praten.", "to talk about a film or series.", "um über einen Film oder eine Serie zu sprechen.", "pour parler d'un film ou d'une série."),
  "¿Qué planes tienes para las vacaciones?": m("om over vakantie te praten.", "to talk about holidays.", "um über den Urlaub zu sprechen.", "pour parler des vacances."),
  "¿Qué opinas de la comida de aquí?": m("om te vragen wat iemand van iets vindt.", "to ask what someone thinks about something.", "um zu fragen, was jemand von etwas hält.", "pour demander ce que quelqu'un pense de quelque chose."),
  "¿Cuál fue lo mejor de tu semana?": m("om te vragen wat het beste van de week was.", "to ask what the best part of the week was.", "um zu fragen, was das Beste der Woche war.", "pour demander quel a été le meilleur moment de la semaine."),
  "¿Qué te gustaría aprender este año?": m("om te praten over wat iemand wil leren.", "to talk about what someone would like to learn.", "um darüber zu sprechen, was jemand lernen möchte.", "pour parler de ce que quelqu'un aimerait apprendre."),
  "¿Cómo estás?": m("als je wilt weten hoe iemand zich voelt.", "when you want to know how someone feels.", "wenn du wissen willst, wie sich jemand fühlt.", "quand tu veux savoir comment quelqu'un se sent."),
  "¿Qué hiciste ayer?": m("als je wilt weten wat iemand gisteren deed.", "when you want to know what someone did yesterday.", "wenn du wissen willst, was jemand gestern gemacht hat.", "quand tu veux savoir ce que quelqu'un a fait hier."),
  "¿Qué vas a hacer el fin de semana?": m("als je wilt weten wat iemand in het weekend gaat doen.", "when you want to know what someone will do at the weekend.", "wenn du wissen willst, was jemand am Wochenende vorhat.", "quand tu veux savoir ce que quelqu'un va faire le week-end."),
  "Estoy cansado.": m("als je zegt dat je moe bent.", "when you say you are tired.", "wenn du sagst, dass du müde bist.", "quand tu dis que tu es fatigué."),
  "Tengo un examen mañana.": m("als je zegt dat je morgen een tentamen hebt.", "when you say you have an exam tomorrow.", "wenn du sagst, dass du morgen eine Prüfung hast.", "quand tu dis que tu as un examen demain."),
  "Fui al médico.": m("als je zegt dat je bij de dokter bent geweest.", "when you say you went to the doctor.", "wenn du sagst, dass du beim Arzt warst.", "quand tu dis que tu es allé chez le médecin."),
  "Me voy de vacaciones la semana que viene.": m("als je zegt dat je volgende week op vakantie gaat.", "when you say you're going on holiday next week.", "wenn du sagst, dass du nächste Woche in den Urlaub fährst.", "quand tu dis que tu pars en vacances la semaine prochaine.")
};

// Woord voor woord: Spaans woord -> [nl, en, de, fr]
var GLOSS = {
  "qué": m("wat", "what", "was", "quoi"), "tal": m("zo", "so", "so", "comme"), "el": m("de", "the", "der", "le"),
  "fin": m("einde", "end", "Ende", "fin"), "de": m("van", "of", "von", "de"), "semana": m("week", "week", "Woche", "semaine"),
  "has": m("heb", "have", "hast", "as"), "hecho": m("gedaan", "done", "gemacht", "fait"), "hoy": m("vandaag", "today", "heute", "aujourd'hui"),
  "bien": m("goed", "well", "gut", "bien"), "verte": m("je zien", "see you", "dich sehen", "te voir"), "y": m("en", "and", "und", "et"),
  "tú": m("jij", "you", "du", "tu"), "cómo": m("hoe", "how", "wie", "comment"), "fue": m("was", "was", "war", "fut"),
  "por": m("voor", "for", "wegen", "pour"), "desde": m("sinds", "since", "seit", "depuis"), "cuándo": m("wanneer", "when", "wann", "quand"),
  "cuéntame": m("vertel me", "tell me", "erzähl mir", "raconte-moi"), "más": m("meer", "more", "mehr", "plus"),
  "pasó": m("gebeurde", "happened", "passierte", "s'est passé"), "después": m("daarna", "after", "danach", "après"),
  "creo": m("denk", "think", "glaube", "crois"), "que": m("dat", "that", "dass", "que"), "sí": m("ja", "yes", "ja", "oui"),
  "no": m("nee", "no", "nein", "non"), "me": m("mij", "me", "mir", "me"), "parece": m("lijkt", "seems", "scheint", "semble"),
  "un": m("een", "a", "ein", "un"), "poco": m("beetje", "little", "wenig", "peu"), "raro": m("raar", "strange", "seltsam", "bizarre"),
  "a": m("naar", "to", "zu", "à"), "mí": m("mij", "me", "mir", "moi"), "gusta": m("bevalt", "likes", "gefällt", "plaît"),
  "mucho": m("veel", "much", "viel", "beaucoup"), "yo": m("ik", "I", "ich", "je"), "estoy": m("ben", "am", "bin", "suis"),
  "acuerdo": m("afspraak", "agreement", "Einverständnis", "accord"), "ver": m("zien", "see", "sehen", "voir"),
  "espera": m("wacht", "wait", "warte", "attends"), "lo": m("het", "it", "es", "le"), "pienso": m("denk", "think", "denke", "pense"),
  "déjame": m("laat me", "let me", "lass mich", "laisse-moi"), "pensar": m("denken", "think", "denken", "penser"),
  "bueno": m("goed", "well", "gut", "bon"), "pues": m("dan", "well", "also", "alors"), "puedes": m("kun jij", "you can", "du kannst", "tu peux"),
  "repetirlo": m("het herhalen", "repeat it", "es wiederholen", "le répéter"), "por": m("voor", "for", "wegen", "pour"),
  "favor": m("gunst", "favour", "Gefallen", "faveur"), "despacio": m("langzaam", "slowly", "langsam", "lentement"),
  "entiendo": m("begrijp", "understand", "verstehe", "comprends"), "significa": m("betekent", "means", "bedeutet", "signifie"),
  "tengo": m("heb", "have", "habe", "ai"), "irme": m("weggaan", "leave", "gehen", "partir"), "alegro": m("ben blij", "am glad", "freue mich", "suis ravi"),
  "hablamos": m("praten we", "we talk", "wir sprechen", "nous parlons"), "luego": m("later", "later", "später", "plus tard"),
  "nos": m("ons", "us", "uns", "nous"), "vemos": m("zien", "see", "sehen", "voyons"), "se": m("men", "one", "man", "on"),
  "dice": m("zegt", "says", "sagt", "dit"), "en": m("in", "in", "in", "en"), "español": m("Spaans", "Spanish", "Spanisch", "espagnol"),
  "sale": m("komt", "comes", "fällt", "vient"), "la": m("de", "the", "die", "la"), "palabra": m("woord", "word", "Wort", "mot"),
  "digo": m("zeg", "say", "sage", "dis"), "otra": m("andere", "other", "andere", "autre"), "manera": m("manier", "way", "Art", "façon"),
  "es": m("is", "is", "ist", "est"), "algo": m("iets", "something", "etwas", "quelque chose"), "como": m("zoals", "like", "wie", "comme"),
  "usa": m("gebruikt", "uses", "benutzt", "utilise"), "para": m("voor", "for", "für", "pour"), "explicas": m("legt uit", "explain", "erklärst", "expliques"),
  "esa": m("dat", "that", "das", "cette"), "te": m("jou", "you", "dir", "te"), "hacer": m("doen", "do", "machen", "faire"),
  "los": m("de", "the", "die", "les"), "trabajo": m("werk", "work", "Arbeit", "travail"), "o": m("of", "or", "oder", "ou"),
  "estudio": m("studie", "study", "Studium", "études"), "música": m("muziek", "music", "Musik", "musique"), "escuchas": m("luister", "listen", "hörst", "écoutes"),
  "últimamente": m("de laatste tijd", "lately", "in letzter Zeit", "ces derniers temps"), "serie": m("serie", "series", "Serie", "série"),
  "película": m("film", "film", "Film", "film"), "gustó": m("beviel", "liked", "hat gefallen", "a plu"), "planes": m("plannen", "plans", "Pläne", "projets"),
  "tienes": m("heb jij", "have you", "hast du", "as"), "vacaciones": m("vakantie", "holidays", "Urlaub", "vacances"), "opinas": m("vind", "think", "meinst", "penses"),
  "comida": m("eten", "food", "Essen", "cuisine"), "aquí": m("hier", "here", "hier", "ici"), "cuál": m("welke", "which", "welche", "quel"),
  "mejor": m("beste", "best", "beste", "meilleur"), "aprender": m("leren", "learn", "lernen", "apprendre"), "este": m("deze", "this", "dieses", "cette"),
  "año": m("jaar", "year", "Jahr", "an"), "gustaría": m("zou graag", "would like", "würde gern", "aimerais"), "estás": m("ben jij", "are you", "bist du", "es"),
  "hiciste": m("deed jij", "did you", "hast du gemacht", "as fait"), "ayer": m("gisteren", "yesterday", "gestern", "hier"),
  "vas": m("ga jij", "are you going", "gehst du", "vas"), "mañana": m("morgen", "tomorrow", "morgen", "demain"), "examen": m("tentamen", "exam", "Prüfung", "examen"),
  "médico": m("dokter", "doctor", "Arzt", "médecin"), "al": m("naar het", "to the", "zum", "au"), "cansado": m("moe", "tired", "müde", "fatigué"),
  "voy": m("ga", "go", "gehe", "vais"), "viene": m("komt", "comes", "kommt", "vient"),
  "fui": m("ging", "went", "ging", "suis allé"), "cine": m("bioscoop", "cinema", "Kino", "cinéma"), "con": m("met", "with", "mit", "avec"),
  "mi": m("mijn", "my", "mein", "mon"), "amigo": m("vriend", "friend", "Freund", "ami"), "trabajé": m("werkte", "worked", "arbeitete", "ai travaillé"),
  "cocinar": m("koken", "cook", "kochen", "cuisiner"), "domingos": m("zondagen", "Sundays", "Sonntage", "dimanches"), "va": m("gaat", "goes", "geht", "va"),
  "llover": m("regenen", "rain", "regnen", "pleuvoir"), "cuando": m("wanneer", "when", "wenn", "quand"), "tiempo": m("tijd", "time", "Zeit", "temps"),
  "leo": m("lees", "read", "lese", "lis"), "libro": m("boek", "book", "Buch", "livre"), "quiero": m("wil", "want", "will", "veux"),
  "palabras": m("woorden", "words", "Wörter", "mots")
};

// ---------- Reageren ----------
// Een reactie: [labelsleutel, Spaans, betekenis]
var REACT = [
  { kind: "vraag", es: "¿Cómo estás?", m: m("Hoe gaat het met je?", "How are you?", "Wie geht es dir?", "Comment tu vas ?"),
    styles: [
      ["blij", "¡Muy bien, gracias! ¿Y tú?", m("Heel goed, dank je! En jij?", "Very well, thanks! And you?", "Sehr gut, danke! Und du?", "Très bien, merci ! Et toi ?")],
      ["eerlijk", "Estoy bien, gracias. Hoy trabajé bastante.", m("Het gaat goed, bedankt. Ik heb vandaag flink gewerkt.", "I'm fine, thanks. I worked quite a lot today.", "Gut, danke. Heute habe ich ziemlich viel gearbeitet.", "Ça va, merci. J'ai pas mal travaillé aujourd'hui.")],
      ["moe", "Un poco cansado, pero bien.", m("Een beetje moe, maar het gaat.", "A bit tired, but okay.", "Ein bisschen müde, aber gut.", "Un peu fatigué, mais ça va.")],
      ["zorgen", "Estoy un poco preocupado por algo.", m("Ik maak me een beetje zorgen over iets.", "I'm a bit worried about something.", "Ich mache mir ein bisschen Sorgen um etwas.", "Je me fais un peu de souci pour quelque chose.")]
    ],
    vervolg: [
      { es: "¿Y tú?", m: m("En jij?", "And you?", "Und du?", "Et toi ?"), styles: [
        ["blij", "Yo también, muy bien.", m("Ik ook, heel goed.", "Me too, very well.", "Mir auch, sehr gut.", "Moi aussi, très bien.")],
        ["eerlijk", "Yo estoy bien, gracias por preguntar.", m("Het gaat goed met mij, bedankt dat je vraagt.", "I'm fine, thanks for asking.", "Mir geht es gut, danke der Nachfrage.", "Ça va pour moi, merci de demander.")],
        ["doorvragen", "¿Y tú qué tal el fin de semana?", m("En hoe was je weekend?", "And how was your weekend?", "Und wie war dein Wochenende?", "Et ton week-end, comment s'est-il passé ?")]
      ] }
    ] },
  { kind: "vraag", es: "¿Qué hiciste ayer?", m: m("Wat heb je gisteren gedaan?", "What did you do yesterday?", "Was hast du gestern gemacht?", "Qu'est-ce que tu as fait hier ?"),
    styles: [
      ["eerlijk", "Fui al supermercado y después estudié.", m("Ik ging naar de supermarkt en daarna heb ik gestudeerd.", "I went to the supermarket and then I studied.", "Ich bin zum Supermarkt gegangen und danach habe ich gelernt.", "Je suis allé au supermarché puis j'ai étudié.")],
      ["leuk", "Fui al cine con un amigo. Fue muy divertido.", m("Ik ging met een vriend naar de bioscoop. Het was erg leuk.", "I went to the cinema with a friend. It was great fun.", "Ich bin mit einem Freund ins Kino gegangen. Es war sehr lustig.", "Je suis allé au cinéma avec un ami. C'était très sympa.")],
      ["kort", "Nada especial, descansé en casa.", m("Niets bijzonders, ik heb thuis gerust.", "Nothing special, I rested at home.", "Nichts Besonderes, ich habe mich zu Hause ausgeruht.", "Rien de spécial, je me suis reposé à la maison.")],
      ["grappig", "Cociné y casi quemé la cena, ¡jaja!", m("Ik kookte en verbrandde bijna het eten, haha!", "I cooked and almost burned dinner, haha!", "Ich habe gekocht und fast das Abendessen verbrannt, haha!", "J'ai cuisiné et j'ai failli cramer le dîner, haha !")]
    ],
    vervolg: [
      { es: "¿Y tú qué hiciste?", m: m("En wat heb jij gedaan?", "And what did you do?", "Und was hast du gemacht?", "Et toi, qu'est-ce que tu as fait ?"), styles: [
        ["doorvragen", "¿Y qué tal fue?", m("En hoe was het?", "And how was it?", "Und wie war es?", "Et c'était comment ?")],
        ["eerlijk", "Nada más, fue un día tranquilo.", m("Niets meer, het was een rustige dag.", "Nothing more, it was a quiet day.", "Mehr nicht, es war ein ruhiger Tag.", "Rien d'autre, c'était une journée calme.")]
      ] }
    ] },
  { kind: "vraag", es: "¿Qué vas a hacer el fin de semana?", m: m("Wat ga je dit weekend doen?", "What are you going to do this weekend?", "Was machst du dieses Wochenende?", "Que vas-tu faire ce week-end ?"),
    styles: [
      ["eerlijk", "Todavía no sé. Quizás descanse.", m("Ik weet het nog niet. Misschien rust ik uit.", "I don't know yet. Maybe I'll rest.", "Ich weiß es noch nicht. Vielleicht ruhe ich mich aus.", "Je ne sais pas encore. Peut-être que je vais me reposer.")],
      ["enthousiast", "Voy a ir a la playa con mis amigos.", m("Ik ga met mijn vrienden naar het strand.", "I'm going to the beach with my friends.", "Ich fahre mit meinen Freunden an den Strand.", "Je vais à la plage avec mes amis.")],
      ["twijfel", "Creo que voy a estudiar, pero no estoy seguro.", m("Ik denk dat ik ga studeren, maar zeker weet ik het niet.", "I think I'll study, but I'm not sure.", "Ich glaube, ich lerne, aber ich bin mir nicht sicher.", "Je crois que je vais étudier, mais je n'en suis pas sûr.")]
    ],
    vervolg: [
      { es: "¿Quieres venir?", m: m("Wil je meekomen?", "Do you want to come?", "Willst du mitkommen?", "Tu veux venir ?"), styles: [
        ["ja", "¡Sí, claro! ¿A qué hora?", m("Ja, zeker! Hoe laat?", "Yes, of course! What time?", "Ja, klar! Um wie viel Uhr?", "Oui, bien sûr ! À quelle heure ?")],
        ["nee", "Lo siento, hoy no puedo.", m("Sorry, vandaag kan ik niet.", "Sorry, I can't today.", "Tut mir leid, heute kann ich nicht.", "Désolé, je ne peux pas aujourd'hui.")],
        ["later", "Déjame pensarlo y te digo.", m("Laat me er even over nadenken, dan laat ik het weten.", "Let me think about it and I'll let you know.", "Lass mich kurz darüber nachdenken, dann sage ich dir Bescheid.", "Laisse-moi y réfléchir, je te dis.")]
      ] }
    ] },
  { kind: "vertelt", es: "Estoy cansado.", m: m("Ik ben moe.", "I'm tired.", "Ich bin müde.", "Je suis fatigué."),
    styles: [
      ["meeleven", "Ay, lo siento. ¿Dormiste bien?", m("Oh, wat vervelend. Heb je goed geslapen?", "Oh, I'm sorry. Did you sleep well?", "Oh, das tut mir leid. Hast du gut geschlafen?", "Oh, désolé. Tu as bien dormi ?")],
      ["grappig", "¡Yo también! Hoy todo me cuesta.", m("Ik ook! Vandaag kost alles me moeite.", "Me too! Everything is hard today.", "Ich auch! Heute fällt mir alles schwer.", "Moi aussi ! Aujourd'hui, tout me coûte.")],
      ["vragen", "¿Por qué estás cansado?", m("Waarom ben je moe?", "Why are you tired?", "Warum bist du müde?", "Pourquoi tu es fatigué ?")],
      ["advies", "Descansa un poco, ¿vale?", m("Rust een beetje, oké?", "Rest a little, okay?", "Ruh dich ein bisschen aus, okay?", "Repose-toi un peu, d'accord ?")]
    ],
    vervolg: [
      { es: "Trabajé mucho.", m: m("Ik heb veel gewerkt.", "I worked a lot.", "Ich habe viel gearbeitet.", "J'ai beaucoup travaillé."), styles: [
        ["meeleven", "Qué duro. Espero que mañana sea más fácil.", m("Wat zwaar. Ik hoop dat morgen makkelijker wordt.", "How hard. I hope tomorrow is easier.", "Wie anstrengend. Ich hoffe, morgen wird es leichter.", "Quelle galère. J'espère que demain sera plus facile.")],
        ["doorvragen", "¿Qué tipo de trabajo haces?", m("Wat voor werk doe je?", "What kind of work do you do?", "Was für eine Arbeit machst du?", "Quel genre de travail tu fais ?")]
      ] }
    ] },
  { kind: "vertelt", es: "Tengo un examen mañana.", m: m("Ik heb morgen een tentamen.", "I have an exam tomorrow.", "Ich habe morgen eine Prüfung.", "J'ai un examen demain."),
    styles: [
      ["steun", "¡Mucha suerte! Seguro que va bien.", m("Veel succes! Het komt vast goed.", "Good luck! I'm sure it'll go well.", "Viel Erfolg! Das wird sicher gut.", "Bonne chance ! Ça va sûrement bien se passer.")],
      ["vragen", "¿De qué es el examen?", m("Over wat gaat het tentamen?", "What is the exam about?", "Worum geht es bei der Prüfung?", "Sur quoi porte l'examen ?")],
      ["grappig", "¡Pobre! Yo odio los exámenes.", m("Arme jij! Ik haat tentamens.", "Poor you! I hate exams.", "Du Arme! Ich hasse Prüfungen.", "Pauvre toi ! Je déteste les examens.")],
      ["praktisch", "¿A qué hora es?", m("Hoe laat is het?", "What time is it?", "Um wie viel Uhr ist sie?", "À quelle heure ?")]
    ],
    vervolg: [
      { es: "Estoy un poco nervioso.", m: m("Ik ben een beetje zenuwachtig.", "I'm a bit nervous.", "Ich bin ein bisschen nervös.", "Je suis un peu nerveux."), styles: [
        ["steun", "Tranquilo, has estudiado mucho.", m("Rustig, je hebt hard gestudeerd.", "Calm down, you've studied a lot.", "Ruhig, du hast viel gelernt.", "Calme-toi, tu as beaucoup étudié.")],
        ["advies", "Respira y ten confianza.", m("Adem in en vertrouw op jezelf.", "Breathe and have confidence.", "Atme durch und vertrau dir.", "Respire et aie confiance.")]
      ] }
    ] },
  { kind: "vertelt", es: "Fui al médico.", m: m("Ik ben naar de dokter geweest.", "I went to the doctor.", "Ich war beim Arzt.", "Je suis allé chez le médecin."),
    styles: [
      ["bezorgd", "¿Estás bien? ¿Qué te dijeron?", m("Gaat het goed? Wat hebben ze gezegd?", "Are you okay? What did they say?", "Geht es dir gut? Was haben sie gesagt?", "Ça va ? Qu'est-ce qu'ils t'ont dit ?")],
      ["meeleven", "Espero que no sea nada grave.", m("Ik hoop dat het niets ernstigs is.", "I hope it's nothing serious.", "Ich hoffe, es ist nichts Ernstes.", "J'espère que ce n'est rien de grave.")],
      ["vragen", "¿Por qué fuiste?", m("Waarom ging je?", "Why did you go?", "Warum bist du hingegangen?", "Pourquoi tu y es allé ?")]
    ],
    vervolg: [
      { es: "Estoy mejor, gracias.", m: m("Het gaat beter, bedankt.", "I'm better, thanks.", "Es geht mir besser, danke.", "Je vais mieux, merci."), styles: [
        ["blij", "¡Qué alivio! Me alegro.", m("Wat een opluchting! Fijn voor je.", "What a relief! I'm glad.", "Was für eine Erleichterung! Schön für dich.", "Quel soulagement ! Je suis content.")],
        ["doorvragen", "¿Y qué te recomendaron?", m("En wat hebben ze aanbevolen?", "And what did they recommend?", "Und was haben sie empfohlen?", "Et qu'est-ce qu'ils t'ont conseillé ?")]
      ] }
    ] },
  { kind: "vertelt", es: "Me voy de vacaciones la semana que viene.", m: m("Ik ga volgende week op vakantie.", "I'm going on holiday next week.", "Ich fahre nächste Woche in den Urlaub.", "Je pars en vacances la semaine prochaine."),
    styles: [
      ["blij", "¡Qué bien! ¿A dónde vas?", m("Wat leuk! Waar ga je naartoe?", "How nice! Where are you going?", "Wie schön! Wohin fährst du?", "Super ! Tu vas où ?")],
      ["jaloers", "¡Qué envidia! Yo también necesito vacaciones.", m("Wat benijdenswaardig! Ik heb ook vakantie nodig.", "How lucky! I need a holiday too.", "Wie beneidenswert! Ich brauche auch Urlaub.", "Quelle chance ! J'ai aussi besoin de vacances.")],
      ["vragen", "¿Cuánto tiempo vas a estar?", m("Hoe lang blijf je?", "How long will you stay?", "Wie lange bleibst du?", "Combien de temps tu restes ?")],
      ["grappig", "No te olvides de mí en la playa.", m("Vergeet me niet op het strand.", "Don't forget me on the beach.", "Vergiss mich am Strand nicht.", "N'oublie pas de me ramener une photo de la plage.")]
    ],
    vervolg: [
      { es: "Voy a Barcelona.", m: m("Ik ga naar Barcelona.", "I'm going to Barcelona.", "Ich fahre nach Barcelona.", "Je vais à Barcelone."), styles: [
        ["enthousiast", "¡Me encanta Barcelona! Come paella.", m("Ik hou van Barcelona! Eet paella.", "I love Barcelona! Eat paella.", "Ich liebe Barcelona! Iss Paella.", "J'adore Barcelone ! Mange de la paella.")],
        ["doorvragen", "¿Ya has estado allí?", m("Ben je daar al eens geweest?", "Have you been there before?", "Warst du schon mal dort?", "Tu y es déjà allé ?")]
      ] }
    ] }
];

// Startzinnen die je kunt doorbouwen (Spaanse startzin -> stam, betekenis, ontkenning)
var BUILD_STEMS = {
  "Creo que sí.": { stem: "Creo que", stemM: m("Ik denk dat", "I think that", "Ich glaube, dass", "Je crois que"), neg: false },
  "Creo que no.": { stem: "Creo que", stemM: m("Ik denk dat", "I think that", "Ich glaube, dass", "Je crois que"), neg: true },
  "Me parece bien.": { stem: "Me parece que", stemM: m("Ik vind dat", "I think that", "Ich finde, dass", "Il me semble que"), neg: false },
  "Me parece un poco raro.": { stem: "Me parece que", stemM: m("Ik vind dat", "I think that", "Ich finde, dass", "Il me semble que"), neg: false },
  "Bueno, pues...": { stem: "Bueno, pues", stemM: m("Nou, dan", "Well then", "Also dann", "Eh bien, alors"), neg: false },
  "A ver...": { stem: "A ver", stemM: m("Even kijken", "Let me see", "Mal sehen", "Voyons"), neg: false },
  "Espera, lo pienso.": { stem: "Espera, creo que", stemM: m("Wacht, ik denk dat", "Wait, I think that", "Warte, ich glaube, dass", "Attends, je crois que"), neg: false }
};
var BUILDABLE_CATS = ["Meningen geven", "Tijd winnen"];

// Verbindingswoorden voor de zinsbouwer
var CONN = [
  { es: "porque", m: m("want", "because", "weil", "parce que") },
  { es: "pero", m: m("maar", "but", "aber", "mais") },
  { es: "y", m: m("en", "and", "und", "et") },
  { es: "así que", m: m("dus", "so", "also", "donc") },
  { es: "aunque", m: m("hoewel", "although", "obwohl", "bien que") }
];

// Onderwerpen: i = index in de vervoegingen
var SUBJ = [
  { es: "yo", m: m("ik", "I", "ich", "je"), i: 0 },
  { es: "tú", m: m("jij", "you", "du", "tu"), i: 1 },
  { es: "él", m: m("hij", "he", "er", "il"), i: 2 },
  { es: "ella", m: m("zij", "she", "sie", "elle"), i: 2 },
  { es: "nosotros", m: m("wij", "we", "wir", "nous"), i: 3 },
  { es: "ellos", m: m("zij (mv.)", "they", "sie", "ils"), i: 4 }
];

// Zinsbouwer: werkwoorden met vormen en afmaakdelen
var VERBS = [
  { id: "ir", inf: "ir", m: m("gaan", "go", "gehen", "aller"), forms: ["voy", "vas", "va", "vamos", "van"],
    comps: [p("al cine", "naar de bioscoop", "to the cinema", "ins Kino", "au cinéma"), p("al trabajo", "naar het werk", "to work", "zur Arbeit", "au travail"), p("a la playa", "naar het strand", "to the beach", "an den Strand", "à la plage"), p("al parque", "naar het park", "to the park", "in den Park", "au parc")] },
  { id: "tener", inf: "tener", m: m("hebben", "have", "haben", "avoir"), forms: ["tengo", "tienes", "tiene", "tenemos", "tienen"],
    comps: [p("mucho trabajo", "veel werk", "a lot of work", "viel Arbeit", "beaucoup de travail"), p("hambre", "honger", "hungry", "Hunger", "faim"), p("tiempo libre", "vrije tijd", "free time", "Freizeit", "du temps libre"), p("un perro", "een hond", "a dog", "einen Hund", "un chien")] },
  { id: "querer", inf: "querer", m: m("willen", "want", "wollen", "vouloir"), forms: ["quiero", "quieres", "quiere", "queremos", "quieren"],
    comps: [p("aprender más español", "meer Spaans leren", "learn more Spanish", "mehr Spanisch lernen", "apprendre plus d'espagnol"), p("un café", "een koffie", "a coffee", "einen Kaffee", "un café"), p("descansar", "rusten", "rest", "ausruhen", "me reposer"), p("viajar", "reizen", "travel", "reisen", "voyager")] },
  { id: "estar", inf: "estar", m: m("zijn (toestand)", "be (state)", "sein (Zustand)", "être (état)"), forms: ["estoy", "estás", "está", "estamos", "están"],
    comps: [p("bien", "goed", "well", "gut", "bien"), p("en casa", "thuis", "at home", "zu Hause", "à la maison"), p("de vacaciones", "op vakantie", "on holiday", "im Urlaub", "en vacances"), p("en la ciudad", "in de stad", "in the city", "in der Stadt", "en ville")] },
  { id: "trabajar", inf: "trabajar", m: m("werken", "work", "arbeiten", "travailler"), forms: ["trabajo", "trabajas", "trabaja", "trabajamos", "trabajan"],
    comps: [p("mucho", "veel", "a lot", "viel", "beaucoup"), p("en una tienda", "in een winkel", "in a shop", "in einem Laden", "dans un magasin"), p("desde casa", "vanuit huis", "from home", "von zu Hause", "depuis chez moi"), p("en la ciudad", "in de stad", "in the city", "in der Stadt", "en ville")] },
  { id: "hacer", inf: "hacer", m: m("doen", "do", "machen", "faire"), forms: ["hago", "haces", "hace", "hacemos", "hacen"],
    comps: [p("deporte", "sport", "sport", "Sport", "du sport"), p("la cena", "het avondeten", "dinner", "das Abendessen", "le dîner"), p("la compra", "boodschappen", "the shopping", "den Einkauf", "les courses"), p("una pausa", "een pauze", "a break", "eine Pause", "une pause")] },
  { id: "comer", inf: "comer", m: m("eten", "eat", "essen", "manger"), forms: ["como", "comes", "come", "comemos", "comen"],
    comps: [p("pan", "brood", "bread", "Brot", "du pain"), p("fruta", "fruit", "fruit", "Obst", "des fruits"), p("tarde", "laat", "late", "spät", "tard"), p("en casa", "thuis", "at home", "zu Hause", "à la maison")] },
  { id: "ir_past", inf: "ir", past: true, m: m("gaan (verleden)", "went", "gehen (Vergangenheit)", "aller (passé)"), forms: ["fui", "fuiste", "fue", "fuimos", "fueron"],
    comps: [p("al cine", "naar de bioscoop", "to the cinema", "ins Kino", "au cinéma"), p("al mercado", "naar de markt", "to the market", "auf den Markt", "au marché"), p("a la playa", "naar het strand", "to the beach", "an den Strand", "à la plage"), p("con mis amigos", "met mijn vrienden", "with my friends", "mit meinen Freunden", "avec mes amis")] }
];

// Korte uitleg per werkwoord in de zinsbouwer
var VERB_HINT = {
  ir: m("Gaan naar een plek: voy (ik ga), vas (jij gaat), va (hij of zij gaat).", "Going to a place: voy (I go), vas (you go), va (he or she goes).", "Gehen zu einem Ort: voy (ich gehe), vas (du gehst), va (er/sie geht).", "Aller vers un endroit : voy (je vais), vas (tu vas), va (il/elle va)."),
  tener: m("Hebben: tengo (ik heb). Bij honger of tijd gebruik je tener.", "To have: tengo (I have). For hunger or time, use tener.", "Haben: tengo (ich habe). Bei Hunger oder Zeit benutzt man tener.", "Avoir : tengo (j'ai). Pour la faim ou le temps, on utilise tener."),
  querer: m("Willen: quiero (ik wil), quieres (jij wilt).", "To want: quiero (I want), quieres (you want).", "Wollen: quiero (ich will), quieres (du willst).", "Vouloir : quiero (je veux), quieres (tu veux)."),
  estar: m("Zijn, voor hoe iemand zich voelt of waar iemand is: estoy (ik ben).", "To be, for how someone feels or where someone is: estoy (I am).", "Sein, für Gefühle oder den Ort: estoy (ich bin).", "Être, pour l'état ou le lieu : estoy (je suis)."),
  trabajar: m("Werken: trabajo (ik werk), trabajas (jij werkt).", "To work: trabajo (I work), trabajas (you work).", "Arbeiten: trabajo (ich arbeite), trabajas (du arbeitest).", "Travailler : trabajo (je travaille), trabajas (tu travailles)."),
  hacer: m("Doen of maken: hago (ik doe). Hacer deporte betekent sport doen.", "To do or make: hago (I do). Hacer deporte means to do sport.", "Tun oder machen: hago (ich mache). Hacer deporte heißt Sport treiben.", "Faire : hago (je fais). Hacer deporte veut dire faire du sport."),
  comer: m("Eten: como (ik eet), comes (jij eet).", "To eat: como (I eat), comes (you eat).", "Essen: como (ich esse), comes (du isst).", "Manger : como (je mange), comes (tu manges)."),
  ir_past: m("Ging, een keer in het verleden: fui (ik ging), fuiste (jij ging).", "Went, once in the past: fui (I went), fuiste (you went).", "Ging, einmal in der Vergangenheit: fui (ich ging), fuiste (du gingst).", "Est allé, une fois dans le passé : fui (je suis allé), fuiste (tu es allé).")
};

// Analyse-zin: bekende vervoegingen (extra werkwoorden die alleen de analyse kent)
var ANA_EXTRA = [
  { inf: "ser", forms: ["soy", "eres", "es", "somos", "son"] },
  { inf: "hablar", forms: ["hablo", "hablas", "habla", "hablamos", "hablan"] },
  { inf: "estudiar", forms: ["estudio", "estudias", "estudia", "estudiamos", "estudian"] },
  { inf: "creer", forms: ["creo", "crees", "cree", "creemos", "creen"] }
];

// ---------- Grammatica ----------
var GRAMMAR = [
  { titel: "Ser vs. estar", regel: m("ser = wat iets is (vaste eigenschap, beroep, nationaliteit). estar = hoe iets is of waar iemand is (toestand, plek).", "ser = what something is (a lasting trait, job, nationality). estar = how something is or where someone is (state, place).", "ser = was etwas ist (feste Eigenschaft, Beruf, Nationalität). estar = wie etwas ist oder wo jemand ist (Zustand, Ort).", "ser = ce que quelque chose est (trait durable, métier, nationalité). estar = comment c'est ou où se trouve quelqu'un (état, lieu)."), voorbeeld: "Soy holandés. Estoy cansado.", waarom: m("Nederlander zijn is vast, dus ser. Moe zijn is tijdelijk, dus estar.", "Being Dutch is permanent, so ser. Being tired is temporary, so estar.", "Niederländer zu sein ist fest, also ser. Müde zu sein ist vorübergehend, also estar.", "Être néerlandais est permanent, donc ser. Être fatigué est temporaire, donc estar.") },
  { titel: "Creo que + indicatief", regel: m("Bij creo que gebruik je de gewone werkwoordsvorm: Creo que va a llover.", "With creo que you use the normal verb form: Creo que va a llover.", "Bei creo que benutzt du die normale Verbform: Creo que va a llover.", "Avec creo que, on utilise la forme verbale normale : Creo que va a llover."), voorbeeld: "Creo que tienes razón.", waarom: m("Bij ontkenning verandert dat: No creo que llueva (subjunctief).", "With a negative this changes: No creo que llueva (subjunctive).", "Bei Verneinung ändert sich das: No creo que llueva (Subjunktiv).", "À la négative, cela change : No creo que llueva (subjonctif).") },
  { titel: "Espero que + subjunctief", regel: m("Na espero que (ik hoop dat) en andere wensen gebruik je de subjunctief: sea, tenga, vaya.", "After espero que (I hope that) and other wishes you use the subjunctive: sea, tenga, vaya.", "Nach espero que (ich hoffe, dass) und anderen Wünschen benutzt du den Subjunktiv: sea, tenga, vaya.", "Après espero que (j'espère que) et d'autres souhaits, on utilise le subjonctif : sea, tenga, vaya."), voorbeeld: "Espero que mañana sea más fácil.", waarom: m("Je drukt een wens of hoop uit, geen vaststaand feit.", "You express a wish or hope, not a fixed fact.", "Du drückst einen Wunsch oder eine Hoffnung aus, keine feste Tatsache.", "Tu exprimes un souhait ou un espoir, pas un fait établi.") },
  { titel: "Me gusta / me gustan", regel: m("Het onderwerp van gustar is wat je leuk vindt. Enkelvoud: me gusta. Meervoud: me gustan.", "The subject of gustar is what you like. Singular: me gusta. Plural: me gustan.", "Das Subjekt von gustar ist das, was dir gefällt. Einzahl: me gusta. Mehrzahl: me gustan.", "Le sujet de gustar est ce qui te plaît. Singulier : me gusta. Pluriel : me gustan."), voorbeeld: "Me gusta el café. Me gustan las películas.", waarom: m("Letterlijk staat er: de koffie bevalt mij. Het werkwoord past zich aan het ding aan, niet aan jou.", "Literally: the coffee pleases me. The verb agrees with the thing, not with you.", "Wörtlich: der Kaffee gefällt mir. Das Verb richtet sich nach der Sache, nicht nach dir.", "Littéralement : le café me plaît. Le verbe s'accorde avec la chose, pas avec toi.") },
  { titel: "Pretérito vs. imperfecto", regel: m("Pretérito voor een afgerond moment (fui, comí). Imperfecto voor gewoonte, achtergrond of een beschrijving (iba, comía).", "Pretérito for a finished moment (fui, comí). Imperfecto for habits, background or description (iba, comía).", "Pretérito für einen abgeschlossenen Moment (fui, comí). Imperfecto für Gewohnheiten, Hintergrund oder Beschreibungen (iba, comía).", "Pretérito pour un moment achevé (fui, comí). Imperfecto pour les habitudes, le décor ou une description (iba, comía)."), voorbeeld: "Fui al cine ayer. Cuando era niño, iba al cine.", waarom: m("Eenmalig is pretérito; vroeger vaak of gewoonlijk is imperfecto.", "One-off is pretérito; often or usually in the past is imperfecto.", "Einmalig ist Pretérito; früher oft oder gewöhnlich ist Imperfecto.", "Une fois, c'est le pretérito ; souvent ou habituellement dans le passé, c'est l'imperfecto.") },
  { titel: "Por vs. para", regel: m("Por: reden, duur, doorgang of ruil. Para: doel, bestemming of richting.", "Por: reason, duration, passing through or exchange. Para: purpose, destination or direction.", "Por: Grund, Dauer, Durchgang oder Tausch. Para: Ziel, Bestimmung oder Richtung.", "Por : raison, durée, passage ou échange. Para : but, destination ou direction."), voorbeeld: "Gracias por tu ayuda. Es para ti.", waarom: m("Dank voor iets gebruik je por. Iets dat voor iemand bestemd is, is para.", "Thanks for something uses por. Something meant for someone is para.", "Danke für etwas benutzt man por. Etwas, das für jemanden bestimmt ist, ist para.", "Merci pour quelque chose se dit avec por. Ce qui est destiné à quelqu'un est para.") },
  { titel: "Rr en r", regel: m("Aan het begin van een woord en na n, l of s klinkt r getrild (rr). Tussen klinkers is het een korte tik.", "At the start of a word and after n, l or s, r is rolled (rr). Between vowels it is a short tap.", "Am Wortanfang und nach n, l oder s wird r gerollt (rr). Zwischen Vokalen ist es ein kurzer Tipp.", "Au début d'un mot et après n, l ou s, le r est roulé (rr). Entre voyelles, c'est une courte frappe."), voorbeeld: "pero (tik) / perro (getrild), Ramón (getrild)", waarom: m("Het verschil kan de betekenis veranderen, dus het is het waard om te oefenen.", "The difference can change the meaning, so it's worth practising.", "Der Unterschied kann die Bedeutung ändern, also lohnt sich das Üben.", "La différence peut changer le sens, donc ça vaut la peine de s'entraîner.") },
  { titel: "Tú vs. usted", regel: m("Tú is informeel (vrienden, familie). Usted is formeel (nieuwe kennissen, werk, ouderen).", "Tú is informal (friends, family). Usted is formal (new acquaintances, work, older people).", "Tú ist informell (Freunde, Familie). Usted ist förmlich (neue Bekannte, Arbeit, ältere Menschen).", "Tú est informel (amis, famille). Usted est formel (nouvelles connaissances, travail, personnes âgées)."), voorbeeld: "¿Qué quieres? / ¿Qué desea usted?", waarom: m("Bij twijfel gebruik je usted. Vrienden spreken elkaar meestal met tú aan.", "When in doubt use usted. Friends usually address each other with tú.", "Im Zweifel benutze usted. Freunde duzen sich meist mit tú.", "En cas de doute, utilise usted. Les amis se tutoient généralement avec tú.") },
  { titel: "Ir a + infinitief", regel: m("Voor de toekomst: ir a + infinitief.", "For the future: ir a + infinitive.", "Für die Zukunft: ir a + Infinitiv.", "Pour le futur : ir a + infinitif."), voorbeeld: "Voy a estudiar mañana.", waarom: m("Het komt overeen met gaan + werkwoord in het Nederlands.", "It matches 'gaan + verb' in Dutch.", "Es entspricht dem deutschen 'gehen + Verb'.", "Cela correspond à « aller + verbe » en néerlandais.") }
];

// ---------- Regels ----------
// Opties en vragen zijn meertalig of Spaans. juist = index van het goede antwoord.
var RULES = [
  { titel: m("1. Woorden op -o en -a", "1. Words ending in -o and -a", "1. Wörter auf -o und -a", "1. Mots en -o et -a"),
    uitleg: m("Woorden die eindigen op -o zijn meestal mannelijk. Woorden die eindigen op -a zijn meestal vrouwelijk. Het lidwoord past zich aan: el (mannelijk) of la (vrouwelijk).", "Words ending in -o are usually masculine. Words ending in -a are usually feminine. The article changes: el (masculine) or la (feminine).", "Wörter auf -o sind meist männlich. Wörter auf -a sind meist weiblich. Der Artikel ändert sich: el (männlich) oder la (weiblich).", "Les mots en -o sont souvent masculins, ceux en -a souvent féminins. L'article change : el (masculin) ou la (féminin)."),
    voorbeelden: [["el libro", m("het boek", "the book", "das Buch", "le livre")], ["la casa", m("het huis", "the house", "das Haus", "la maison")]],
    test: { vraag: m("Welk lidwoord hoort bij casa?", "Which article goes with casa?", "Welcher Artikel gehört zu casa?", "Quel article va avec casa ?"), opties: ["el", "la"], juist: 1 } },
  { titel: m("2. Meervoud: -s of -es", "2. Plural: -s or -es", "2. Mehrzahl: -s oder -es", "2. Pluriel : -s ou -es"),
    uitleg: m("Eindigt een woord op een klinker (a, e, i, o, u), dan voeg je -s toe. Eindigt het op een medeklinker, dan voeg je -es toe.", "If a word ends in a vowel (a, e, i, o, u), add -s. If it ends in a consonant, add -es.", "Endet ein Wort auf einen Vokal (a, e, i, o, u), fügst du -s hinzu. Endet es auf einen Konsonanten, fügst du -es hinzu.", "Si le mot finit par une voyelle (a, e, i, o, u), ajoute -s. S'il finit par une consonne, ajoute -es."),
    voorbeelden: [["libro → libros", m("boek → boeken", "book → books", "Buch → Bücher", "livre → livres")], ["examen → exámenes", m("tentamen → tentamens", "exam → exams", "Prüfung → Prüfungen", "examen → examens")]],
    test: { vraag: m("Wat is het meervoud van mujer (vrouw)?", "What is the plural of mujer (woman)?", "Was ist die Mehrzahl von mujer (Frau)?", "Quel est le pluriel de mujer (femme) ?"), opties: ["mujers", "mujeres"], juist: 1 } },
  { titel: m("3. De vraag: ¿ en ?", "3. The question: ¿ and ?", "3. Die Frage: ¿ und ?", "3. La question : ¿ et ?"),
    uitleg: m("Een vraag begint met een omgekeerd vraagteken (¿) en eindigt met een gewoon vraagteken (?). Vraagwoorden krijgen een accent.", "A question starts with an upside-down question mark (¿) and ends with a normal one (?). Question words take an accent.", "Eine Frage beginnt mit einem umgekehrten Fragezeichen (¿) und endet mit einem normalen (?). Fragewörter bekommen einen Akzent.", "Une question commence par un point d'interrogation renversé (¿) et finit par un normal (?). Les mots interrogatifs prennent un accent."),
    voorbeelden: [["¿Cómo estás?", m("Hoe gaat het?", "How are you?", "Wie geht es dir?", "Comment tu vas ?")], ["¿Dónde vives?", m("Waar woon je?", "Where do you live?", "Wo wohnst du?", "Où habites-tu ?")]],
    test: { vraag: m("Welke schrijfwijze is goed?", "Which spelling is correct?", "Welche Schreibweise ist richtig?", "Quelle écriture est correcte ?"), opties: ["que quieres?", "¿Qué quieres?"], juist: 1 } },
  { titel: m("4. Ontkennen: no voor het werkwoord", "4. Negating: no before the verb", "4. Verneinen: no vor dem Verb", "4. La négation : no devant le verbe"),
    uitleg: m("Je zet no voor het werkwoord. Zo maak je een zin negatief.", "You put no before the verb. That's how you make a sentence negative.", "Du setzt no vor das Verb. So verneinst du einen Satz.", "On met no devant le verbe. C'est ainsi qu'on fait une phrase négative."),
    voorbeelden: [["No tengo tiempo.", m("Ik heb geen tijd.", "I don't have time.", "Ich habe keine Zeit.", "Je n'ai pas le temps.")], ["No entiendo.", m("Ik begrijp het niet.", "I don't understand.", "Ich verstehe nicht.", "Je ne comprends pas.")]],
    test: { vraag: m("Waar zet je no?", "Where do you put no?", "Wo setzt du no hin?", "Où met-on no ?"), opties: [m("achter het werkwoord", "after the verb", "nach dem Verb", "après le verbe"), m("voor het werkwoord", "before the verb", "vor dem Verb", "devant le verbe")], juist: 1 } },
  { titel: m("5. Het werkwoord past zich aan de persoon aan", "5. The verb changes with the person", "5. Das Verb passt sich der Person an", "5. Le verbe s'adapte à la personne"),
    uitleg: m("yo = ik, tú = jij, él/ella = hij/zij, nosotros = wij, ellos/ellas = zij (meervoud). Elke persoon krijgt een eigen uitgang. Bij -ar zijn de uitgangen: o, as, a, amos, an.", "yo = I, tú = you, él/ella = he/she, nosotros = we, ellos/ellas = they. Each person gets its own ending. For -ar verbs the endings are: o, as, a, amos, an.", "yo = ich, tú = du, él/ella = er/sie, nosotros = wir, ellos/ellas = sie (Mehrzahl). Jede Person bekommt eine eigene Endung. Bei -ar sind die Endungen: o, as, a, amos, an.", "yo = je, tú = tu, él/ella = il/elle, nosotros = nous, ellos/ellas = ils/elles. Chaque personne a sa terminaison. Pour les verbes en -ar : o, as, a, amos, an."),
    voorbeelden: [["hablo", m("ik praat", "I speak", "ich spreche", "je parle")], ["hablas", m("jij praat", "you speak", "du sprichst", "tu parles")], ["habla", m("hij of zij praat", "he or she speaks", "er/sie spricht", "il/elle parle")]],
    test: { vraag: m("Hoe zeg je ik werk?", "How do you say I work?", "Wie sagt man ich arbeite?", "Comment dit-on je travaille ?"), opties: ["trabajas", "trabajo"], juist: 1 } },
  { titel: m("6. Werkwoorden op -er en -ir", "6. Verbs ending in -er and -ir", "6. Verben auf -er und -ir", "6. Verbes en -er et -ir"),
    uitleg: m("Ook bij -er en -ir verandert de uitgang per persoon. Bij -er: o, es, e, emos, en. Bij -ir: o, es, e, imos, en.", "With -er and -ir verbs the ending also changes per person. For -er: o, es, e, emos, en. For -ir: o, es, e, imos, en.", "Auch bei -er und -ir ändert sich die Endung je Person. Bei -er: o, es, e, emos, en. Bei -ir: o, es, e, imos, en.", "Avec -er et -ir, la terminaison change aussi selon la personne. Pour -er : o, es, e, emos, en. Pour -ir : o, es, e, imos, en."),
    voorbeelden: [["como", m("ik eet", "I eat", "ich esse", "je mange")], ["vives", m("jij woont", "you live", "du wohnst", "tu habites")]],
    test: { vraag: m("Hoe zeg je jij eet?", "How do you say you eat?", "Wie sagt man du isst?", "Comment dit-on tu manges ?"), opties: ["comes", "come"], juist: 0 } },
  { titel: m("7. Me gusta = het bevalt mij", "7. Me gusta = I like it", "7. Me gusta = es gefällt mir", "7. Me gusta = ça me plaît"),
    uitleg: m("Bij gustar is het ding dat je leuk vindt het onderwerp. Enkelvoud: me gusta. Meervoud: me gustan. Me betekent mij.", "With gustar the thing you like is the subject. Singular: me gusta. Plural: me gustan. Me means me.", "Bei gustar ist das, was dir gefällt, das Subjekt. Einzahl: me gusta. Mehrzahl: me gustan. Me heißt mir.", "Avec gustar, la chose qui te plaît est le sujet. Singulier : me gusta. Pluriel : me gustan. Me veut dire me."),
    voorbeelden: [["Me gusta el café.", m("Ik vind koffie lekker.", "I like coffee.", "Ich mag Kaffee.", "J'aime le café.")], ["Me gustan las películas.", m("Ik hou van films.", "I like films.", "Ich mag Filme.", "J'aime les films.")]],
    test: { vraag: m("Wat zeg je bij de films (meervoud)?", "What do you say about the films (plural)?", "Was sagst du über die Filme (Mehrzahl)?", "Que dis-tu pour les films (pluriel) ?"), opties: ["me gusta las películas", "me gustan las películas"], juist: 1 } },
  { titel: m("8. Ser of estar", "8. Ser or estar", "8. Ser oder estar", "8. Ser ou estar"),
    uitleg: m("Ser gebruik je voor wat iets of iemand is, zoals nationaliteit of beroep. Estar gebruik je voor hoe je je voelt en waar je bent.", "Ser is for what something or someone is, like nationality or job. Estar is for how you feel and where you are.", "Ser benutzt du für das, was etwas oder jemand ist, zum Beispiel Nationalität oder Beruf. Estar benutzt du für Gefühle und den Ort.", "Ser sert à dire ce que quelque chose ou quelqu'un est, comme la nationalité ou le métier. Estar sert à dire comment on se sent et où l'on est."),
    voorbeelden: [["Soy holandés.", m("Ik ben Nederlands.", "I'm Dutch.", "Ich bin Niederländer.", "Je suis néerlandais.")], ["Estoy cansado.", m("Ik ben moe.", "I'm tired.", "Ich bin müde.", "Je suis fatigué.")]],
    test: { vraag: m("Welk werkwoord hoort bij ik ben moe?", "Which verb goes with I'm tired?", "Welches Verb passt zu ich bin müde?", "Quel verbe va avec je suis fatigué ?"), opties: ["soy", "estoy"], juist: 1 } },
  { titel: m("9. Tú of usted", "9. Tú or usted", "9. Tú oder usted", "9. Tú ou usted"),
    uitleg: m("Tú is jij, voor vrienden en familie. Usted is u, voor mensen die je niet kent en in werk of formele situaties.", "Tú is you, for friends and family. Usted is the formal you, for people you don't know and in work or formal situations.", "Tú ist du, für Freunde und Familie. Usted ist Sie, für Fremde und in Arbeit oder förmlichen Situationen.", "Tú est tu, pour les amis et la famille. Usted est vous, pour les inconnus et les situations formelles."),
    voorbeelden: [["¿Qué quieres?", m("Wat wil jij?", "What do you want?", "Was willst du?", "Qu'est-ce que tu veux ?")], ["¿Qué desea usted?", m("Wat wilt u?", "What would you like?", "Was möchten Sie?", "Que désirez-vous ?")]],
    test: { vraag: m("Welke vorm gebruik je bij een onbekende in een winkel?", "Which form do you use with a stranger in a shop?", "Welche Form benutzt du bei einem Fremden im Laden?", "Quelle forme utilises-tu avec un inconnu dans un magasin ?"), opties: ["tú", "usted"], juist: 1 } },
  { titel: m("10. Verleden tijd: -é en -í", "10. Past tense: -é and -í", "10. Vergangenheit: -é und -í", "10. Passé : -é et -í"),
    uitleg: m("Voor iets dat je één keer in het verleden deed. Bij -ar krijgt de ik-vorm de uitgang -é. Bij -er en -ir krijgt de ik-vorm de uitgang -í. Fui betekent ik ging.", "For something you did once in the past. With -ar verbs the I-form ends in -é. With -er and -ir verbs the I-form ends in -í. Fui means I went.", "Für etwas, das du einmal in der Vergangenheit getan hast. Bei -ar endet die ich-Form auf -é. Bei -er und -ir endet die ich-Form auf -í. Fui heißt ich ging.", "Pour une action unique dans le passé. Avec -ar, la forme je finit en -é. Avec -er et -ir, elle finit en -í. Fui veut dire je suis allé."),
    voorbeelden: [["hablé", m("ik sprak", "I spoke", "ich sprach", "j'ai parlé")], ["comí", m("ik at", "I ate", "ich aß", "j'ai mangé")], ["fui al cine", m("ik ging naar de bioscoop", "I went to the cinema", "ich ging ins Kino", "je suis allé au cinéma")]],
    test: { vraag: m("Hoe zeg je ik at (één keer)?", "How do you say I ate (once)?", "Wie sagt man ich aß (einmal)?", "Comment dit-on j'ai mangé (une fois) ?"), opties: ["como", "comí"], juist: 1 } }
];
