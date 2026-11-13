# Gespreksgids Spaans

Een gratis, offline werkende app (PWA) om Spaans te gebruiken in gesprekken. Geen account, geen server, geen kosten.

## Mappen en bestanden

- `index.html`, `manifest.webmanifest`, `sw.js`
- `css/app.css`
- `js/i18n.js`, `js/content.js`, `js/dict.js`, `js/uitspraak.js`, `js/app.js`
- `icons/` (app-iconen)

## Publiceren op GitHub Pages (eenmalig)

1. Maak een gratis account op https://github.com (als je er nog geen hebt).
2. Klik rechtsboven op **+** en kies **New repository**.
3. Geef een naam, bijvoorbeeld `gespreksgids-spaans`. Kies **Public**. Klik op **Create repository**.
4. Klik op **uploading an existing file**. Sleep alle bestanden en mappen uit deze map erin (ook `css`, `js` en `icons`). Let op: upload de inhoud van de map, niet de map zelf.
5. Klik op **Commit changes**.
6. Ga naar **Settings** > **Pages**.
7. Bij **Build and deployment**, kies bij *Source* **Deploy from a branch**. Kies bij *Branch* **main** en map **/ (root)**. Klik op **Save**.
8. Wacht 1 tot 2 minuten. Ververs de pagina. Bovenaan staat nu je link, in de vorm `https://JOUWNAAM.github.io/gespreksgids-spaans/`.

Dit is de ene link die je met vrienden deelt.

## Publiceren op Netlify (alternatief)

1. Ga naar https://app.netlify.com/drop.
2. Log in of maak een gratis account.
3. Sleep de hele map `gespreksgids` in het vak.
4. Je krijgt meteen een link. Die kun je delen.

## Op je telefoon zetten (iPhone)

1. Open de link in **Safari**.
2. Tik op het deelicoon (vierkantje met pijl omhoog).
3. Kies **Zet op beginscherm**.

Vrienden kunnen dat ook doen. Zij kunnen de app gebruiken en op hun beginscherm zetten, maar niets aanpassen.

## Een nieuwe versie publiceren

1. Pas de bestanden aan op je computer.
2. Open `sw.js` en verhoog `CACHE_VERSION` (bijvoorbeeld van `gespreksgids-v1` naar `gespreksgids-v2`). Dit zorgt dat telefoons de nieuwe versie ophalen.
3. Ga op GitHub naar je repository. Klik op **Add file** > **Upload files** en sleep de gewijzigde bestanden erin. Bestaande bestanden worden vervangen.
4. Klik op **Commit changes**. Na 1 tot 2 minuten is de nieuwe versie live.

Bij Netlify: sleep de hele map opnieuw in https://app.netlify.com/drop, of gebruik je bestaande site en upload daar de nieuwe map.

## Let op

- De spraakherkenning (microfoon) hangt af van je browser. Op iPhone werkt die niet altijd. Het typvak op de pagina Gesprek werkt altijd.
- Oefeningen, begrepen zinnen en voortgang worden op je eigen toestel opgeslagen. Ze gaan verloren als je de gegevens van de site wist.
