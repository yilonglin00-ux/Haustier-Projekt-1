# 🌿 Fabelgarten

Ein virtuelles Haustier-Spiel für den Browser — eine Mischung aus Tamagotchi
und Pokémon. Sammle, pflege und entwickle über **114 Kreaturen**, schicke sie
auf Expeditionen, brüte Eier aus und baue dein Zuhause aus.

**Keine Installation. Kein Server. Kein Konto. Keine Werbung. Keine
Echtgeldkäufe.** Das ganze Spiel ist eine einzige HTML-Datei, dein Fortschritt
bleibt in deinem Browser.

---

## Spielen

**Online spielen:** https://yilonglin00-ux.github.io/Haustier-Projekt-1/

Oder `dist/index.html` herunterladen und im Browser öffnen — fertig. Die Datei
funktioniert auch offline und per Doppelklick, ohne Webserver.

Zum Entwickeln:

```bash
npm run dev     # Entwicklungs-Server auf http://localhost:8123
npm run build   # baut dist/index.html neu
npm run check   # prüft den Modulgraphen, ohne zu bauen
```

Es gibt **keine Abhängigkeiten** — `npm install` ist nicht nötig, Node 18+ genügt.

---

## Das Spiel

### Anfang
Du wählst eines von drei Starter-Haustieren: **Flammkitz** (Feuer),
**Tropfotter** (Wasser) oder **Knospling** (Natur). Jedes hat eigene Werte,
eine eigene Geschichte und mehrere mögliche Entwicklungswege.

### Pflegen
Elf Aktionen halten dein Haustier bei Laune: füttern, tränken, streicheln,
spielen, trainieren, schlafen schicken, baden, spazieren gehen, Medizin geben,
Abenteuer starten und Fotos machen. Jede hat eine eigene Animation.

Dreizehn Werte verändern sich laufend — Gesundheit, Energie, Hunger, Durst,
Sauberkeit, Stimmung, Vertrauen, Glück, Zuneigung, Level, Erfahrung, Stärke,
Intelligenz und Geschwindigkeit.

> Haustiere sterben nicht. Wer lange weg war, findet sie hungrig vor — aber nie
> verloren. Höchstens zwölf Stunden Abwesenheit werden nachgerechnet.

### Entwickeln
Entwicklungen hängen **nicht nur vom Level** ab, sondern auch von Zuneigung,
Glück, Vertrauen, Pflegetagen, Attributen, Tageszeit, Persönlichkeit und
besonderen Gegenständen. Dieselbe Vorstufe kann sich dadurch unterschiedlich
entwickeln — bis hin zur **Megaform**.

### Sammeln
114 Arten in 54 Entwicklungslinien, über 12 Elemente und 6 Seltenheitsstufen:

| | Stufe | Besonderheit |
|---|---|---|
| ⚪ | Gewöhnlich | häufig, unkomplizierte Entwicklung |
| 🟢 | Ungewöhnlich | bessere Werte, besondere Farbschläge |
| 🔵 | Selten | eigene Silhouetten und Fähigkeiten |
| 🟣 | Episch | handgezeichnet, starke Werte, eigene Animationen |
| 🟡 | Legendär | sehr selten, einzigartige Linie |
| 🔴 | Mystisch | geheime Bedingungen zum Erhalt |

Dazu kommen Farbvarianten — die seltenste ist **🌟 Schimmernd** (etwa 1 : 128).

Das **Haustierbuch** zeigt alle Arten. Unentdeckte bleiben als Silhouette
sichtbar: Man weiß, dass da noch etwas ist, aber nicht was.

### Beschäftigung
- **Fünf Minispiele**: Reaktion, Memory, Hindernislauf, Sammelspiel, Quiz.
  Das Quiz stellt Fragen zu deiner eigenen Sammlung.
- **Acht Expeditionszonen** von der Heimatwiese bis zur Sternenruine. Sie laufen
  in Echtzeit weiter, auch bei geschlossenem Spiel.
- **Eier** in sieben Sorten. Sie schlüpfen nach Zeit **oder** durch Erfüllen
  einer kleinen Aufgabe — je nachdem, was zuerst fertig ist.
- **Tagesaufgaben**, die um Mitternacht wechseln, plus 49 Erfolge.
- **Zuhause ausbauen**: Schlafzimmer, Küche, Garten, Trainingsraum, Labor und
  Aquarium mit 18 Möbelstücken, die spürbare Vorteile bringen.

### Seltene Ereignisse
Ein goldenes Ei im Gras. Ein Wesen, das nur nachts vorbeischaut. Saisonale
Haustiere. Und vier Geheimnisse, die auf lange Treue warten.

---

## Speichern

Der Fortschritt wird automatisch im **Local Storage** deines Browsers
gespeichert. Unter *Einstellungen* kannst du außerdem:

- **Sicherung herunterladen** — der komplette Spielstand als `.json`-Datei
- **Sicherung laden** — Spielstand von einem anderen Gerät übernehmen
- **Zurücksetzen** — von vorn anfangen

Es werden keinerlei Daten an einen Server gesendet.

---

## Technik

```
build.js              Bundler ohne Abhängigkeiten → eine dist/index.html
serve.js              Entwicklungs-Server
tools/kontaktbogen.js zeichnet alle Kreaturen zur Sichtprüfung auf eine Seite
src/
  core/     Spielstand, Speichern, Spiel-Loop, Zufall, Ereignis-Bus
  data/     Arten, Gegenstände, Zonen, Räume, Aufgaben, Erfolge
  systems/  Spielregeln: Haustiere, Aktionen, Entwicklung, Eier, Wirtschaft …
  render/   Kreaturen-Darstellung (SVG), Effekte, Kleidung
  ui/       App-Hülle, Bildschirme, Minispiele, Bausteine
  audio/    Klänge und Musik, zur Laufzeit erzeugt
  styles/   Design-Tokens, Layout, Bausteine, Animationen
```

**Darstellung nach Seltenheit gestaffelt.** Gewöhnliche Kreaturen entstehen
prozedural aus einer Bauteil-Bibliothek, seltene bekommen Verläufe und
Signatur-Elemente, epische und höhere sind handgezeichnet. `petSprite.js` fragt
dafür zuerst die Kunst-Registry (`render/art/`) ab und fällt sonst auf den
Bauteil-Zeichner zurück — beide liefern denselben SVG-Aufbau, sodass
Animationen, Kleidung und Fotomodus überall gleich funktionieren.

**Keine externen Dateien.** Kreaturen sind SVG, Klänge werden mit der WebAudio-API
erzeugt, Symbole sind Emoji. Die gebaute Datei lädt nichts nach.

**Erweitern** ist bewusst einfach gehalten:

| Was | Wo |
|---|---|
| Neues Haustier | ein Objekt in `src/data/species.js` |
| Eigene Zeichnung dafür | Funktion schreiben, in `src/render/art/index.js` eintragen |
| Gegenstand, Zone, Raum, Möbel, Aufgabe, Erfolg | passende Tabelle in `src/data/` |
| Neue Aktion | Eintrag in `ACTIONS` in `src/systems/actions.js` |
| Neuer Bildschirm | Modul anlegen, `registerScreen()` aufrufen, in `main.js` importieren |

Alte Spielstände bleiben gültig: Beim Laden wird der gespeicherte Stand über
die aktuelle Standardstruktur gelegt, neue Felder erscheinen also automatisch.

---

## Barrierefreiheit

- Bedienbar mit Tastatur, Dialoge halten den Fokus
- Helles und dunkles Design, folgt auf Wunsch dem System
- Animationen abschaltbar (respektiert auch `prefers-reduced-motion`)
- Bedienelemente auf Touchgeräten mindestens 44 px hoch
- Funktioniert von 320 px Breite bis zum großen Bildschirm

---

## Lizenz

MIT
