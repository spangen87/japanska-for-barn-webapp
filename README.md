# Japanska för barn

En webbapp där barn (8–10 år) lär sig läsa hiragana och katakana. Appen är skriven på svenska och har ljud, miniquiz, övningar, ord med bilder, streak och badges.

## Kom igång

Appen är statisk och har inga beroenden.

```bash
npm start   # startar en lokal server på http://localhost:5173
npm test    # kör alla tester (Nodes inbyggda testrunner)
```

För ljudet används webbläsarens talsyntes, som kräver en japansk röst på enheten.

## Filer

| Fil | Innehåll |
|---|---|
| `src/curriculum.js` | Kursplanen: teckengrupper och ordgrupper |
| `src/app-core.js` | Ren logik, till exempel repetition, streak och upplåsning |
| `src/main.js` | Gränssnittet och appens tillstånd (sparas i `localStorage`) |
| `test/` | Datatester för kursplanen, logiktester och klickflöden |

## Lägga till eller ändra ord

Ordgrupperna finns i `src/curriculum.js`:

```js
words(3, [
  ['すし', 'sushi', 'sushi', '🍣'],
  ...
])
```

- **Gruppnummer:** den första siffran anger efter vilken teckengrupp orden låses upp. Ordet får bara innehålla tecken som har lärts ut till och med den gruppen.
- **Romaji:** skrivs som kanan. おう skrivs `ou`, ー blir dubbel vokal, ん skrivs `n` och っ dubblar konsonanten.
- **Ord med långa vokaler** ska komma tidigast efter grupp 11.
- **Inga dubbletter:** ord, betydelse och emoji får förekomma högst en gång per alfabet.
- **Kategorier:** är ordet ett djur, en frukt, en färg eller liknande lägger du till dess betydelse i `CATEGORIES`. Då visas inte kategorin (till exempel "djur") som ett felaktigt svarsalternativ.

Kör `npm test` efter ändringen. Datatesterna i `test/curriculum.test.js` säger till om något bryter mot reglerna.
