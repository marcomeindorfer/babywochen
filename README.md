# Babywochen-Kompass

Woche für Woche durch die ersten 20 Monate: was das Baby lernt, Spiele mit Mini-Anleitung,
was zu erwarten ist, was es braucht, Umgang, Gewohnheiten, dazu die Sprünge aus
„Oje, ich wachse!“ und ein gemeinsames Wochen-Tagebuch.

- App: `index.html` (eine Datei, reines JS), `manifest.json` + `sw.js` für die Installation auf dem Homescreen
- Adresse: https://marcomeindorfer.github.io/babywochen/
- Sync: Firebase Realtime Database über REST, gleiches Projekt und gleiche Regeln wie Brain und Küchenplan,
  eigener Code. Pfade: `haushalte/<code>/daten/{et,birth}` als `{v,ts}`, `haushalte/<code>/notizen/w<Woche>` als `{t,ts}`.
  Pro Eintrag gewinnt der jüngere Zeitstempel; geschrieben wird immer nur der einzelne Eintrag.
- Die Inhalte stammen aus den Quellen im privaten Repo `elternsein`. Keine ärztliche Beratung.

Update: `index.html` ändern, lokal testen, `VERSION` hochzählen, pushen. Bei Änderungen an `sw.js` den Cache-Namen hochzählen.
