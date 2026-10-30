// Schickt am ersten Tag jeder Lebenswoche eine Push-Nachricht an alle Abos unter
// haushalte/<code>/push. Daten und Abos kommen aus derselben Firebase-DB wie die App.
import { readFileSync } from "node:fs";
import webpush from "web-push";

const { FIREBASE_DB, HAUSHALT_CODE, VAPID_PUBLIC, VAPID_PRIVATE } = process.env;
const TEST = process.env.TEST === "true";
if (!FIREBASE_DB || !HAUSHALT_CODE || !VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error("Secrets fehlen: FIREBASE_DB, HAUSHALT_CODE, VAPID_PUBLIC, VAPID_PRIVATE");
  process.exit(1);
}
const basis = FIREBASE_DB.replace(/\/$/, "") + "/haushalte/" + HAUSHALT_CODE;
const APP = "https://marcomeindorfer.github.io/babywochen/";
const holen = async p => { const r = await fetch(`${basis}/${p}.json`); if (!r.ok) throw new Error(`GET ${p}: ${r.status}`); return r.json(); };
const schreiben = (p, v, method = "PUT") => fetch(`${basis}/${p}.json`, { method, headers: { "Content-Type": "application/json" }, body: v === undefined ? undefined : JSON.stringify(v) });

// Heute und Uhrzeit in Berlin
const teile = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
  .formatToParts(new Date()).map(t => [t.type, t.value]));
const heute = `${teile.year}-${teile.month}-${teile.day}`, stunde = +teile.hour;
const tage = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d) / 864e5; };

// Wochenabschnitte, Sprünge und Standard-ET direkt aus der App lesen, damit nichts doppelt gepflegt wird
const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const daten = (await holen("daten")) || {};
// Ohne gespeicherten ET rechnet die App mit ihrem eingebauten - der Job nimmt denselben
const et = (daten.et && daten.et.v) || (html.match(/wert\("daten\/et"\)\|\|\{\}\)\.v\|\|"(\d{4}-\d\d-\d\d)"/) || [])[1];
const geburt = (daten.birth && daten.birth.v) || et;
if (!geburt) { console.log("Kein ET und kein Geburtsdatum gefunden."); process.exit(0); }
const alter = tage(heute) - tage(geburt), woche = Math.floor(alter / 7);

const BANDS = [...html.matchAll(/\{from:(\d+),to:(\d+),title:"([^"]+)"/g)].map(m => ({ from: +m[1], to: +m[2], title: m[3] }));
const LEAPS = [...html.matchAll(/\{n:(\d+),name:"([^"]+)",from:([\d.]+),to:([\d.]+)/g)].map(m => ({ n: +m[1], name: m[2], from: +m[3] }));
const MAXW = +(html.match(/MAXW=(\d+)/) || [0, 90])[1];

if (!TEST) {
  if (alter <= 0 || alter % 7 !== 0 || woche > MAXW) { console.log(`Heute (${heute}) beginnt keine neue Woche (Tag ${alter}).`); process.exit(0); }
  if (stunde < 20) { console.log(`Erst ${stunde} Uhr in Berlin, der spätere Lauf sendet.`); process.exit(0); }
  const stand = await holen("push_stand");
  if (stand && stand.datum === heute) { console.log("Heute schon gesendet."); process.exit(0); }
}

const w = Math.max(0, Math.min(MAXW, woche));
const band = BANDS.find(b => w >= b.from && w <= b.to);
const versatz = et ? (tage(geburt) - tage(et)) / 7 : 0;   // Sprünge zählen ab ET, Wochen ab Geburt
const sprung = LEAPS.find(L => L.from - versatz >= w && L.from - versatz < w + 1);
const nachricht = {
  title: TEST ? "Test: Erinnerung kommt an" : `Woche ${w} beginnt`,
  body: [band && band.title, sprung && `Diese Woche startet Sprung ${sprung.n}: ${sprung.name}.`, "Lest sie euch heute Abend zusammen durch."].filter(Boolean).join(" · "),
  url: `${APP}?woche=${w}`,
  tag: "wochenstart",
};

webpush.setVapidDetails(APP, VAPID_PUBLIC, VAPID_PRIVATE);
const abos = (await holen("push")) || {};
let ok = 0;
for (const [id, eintrag] of Object.entries(abos)) {
  if (!eintrag || !eintrag.sub) continue;
  try { await webpush.sendNotification(eintrag.sub, JSON.stringify(nachricht), { TTL: 6 * 3600, urgency: "high" }); ok++; console.log(`gesendet an ${id}`); }
  catch (e) {
    console.log(`Fehler bei ${id}: ${e.statusCode || ""} ${e.body || e.message}`);
    if (e.statusCode === 404 || e.statusCode === 410) { await schreiben(`push/${id}`, undefined, "DELETE"); console.log(`Abo ${id} ist abgelaufen und wurde entfernt.`); }
  }
}
console.log(`${ok} von ${Object.keys(abos).length} Geräten erreicht: ${nachricht.title} - ${nachricht.body}`);
if (!TEST && ok) await schreiben("push_stand", { datum: heute, woche: w, ts: Date.now() });
