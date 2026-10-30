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

Erinnerung zum Wochenstart: Jedes Handy schaltet sie unter „Mehr“ ein und legt sein Push-Abo unter
`haushalte/<code>/push/<geraet>` ab. `.github/workflows/wochenstart.yml` läuft jeden Abend, liest
Geburtsdatum (sonst ET) und Abos und schickt am ersten Tag jeder Lebenswoche ab 20 Uhr eine Nachricht
(einmal pro Tag, gemerkt in `push_stand`). Secrets: `FIREBASE_DB`, `HAUSHALT_CODE`, `VAPID_PUBLIC`, `VAPID_PRIVATE`.
Der öffentliche VAPID-Schlüssel steht auch in `index.html` - nur zusammen mit dem privaten neu erzeugen,
sonst müssen alle Handys die Erinnerung neu einschalten. Testnachricht: Actions → Wochenstart-Erinnerung → Run workflow.

Fragen (Chat): Das Handy fragt Google Gemini direkt (Gratis-Tarif, Schlüssel unter `daten/gemini`,
Verlauf unter `chat/<id>` als `{f,a,t0,ts}`). Die Wissensbasis liegt **nicht** in diesem Repo, sondern
in Firebase unter `haushalte/<code>-wissen` (`text`, `stand`), hochgeladen aus dem privaten Repo
`elternsein` mit `ratgeber/upload-app-wissen.sh`. Die App lädt sie nur neu, wenn sich `stand` ändert.
