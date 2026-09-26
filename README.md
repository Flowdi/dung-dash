# Dung Dash

Ein kleiner Canvas-Platformer: Sammle Fliegen, erreiche die Toiletten in der richtigen Reihenfolge und bringe den Kothaufen ans Ziel.

## Aktuelle Features

- Zeitmessung ab der ersten Spielerbewegung
- Fliegen-Score mit zeitlich begrenzter Combo bis ×4
- Bronze-, Silber- und Goldmedaillen
- persönliche Bestzeit, Highscore und Gesamtstatistik im lokalen Browserspeicher
- pausierbarer Spiellauf mit direktem Neustart und Rückkehr zur Levelauswahl
- responsive Tastatur- und Touchsteuerung
- sechs datengetriebene Level mit Auswahl und Freischaltung
- goldene Fliegen, Zeitfliegen, Sprungplattformen und warnend zerbrechende Plattformen, die wiederkehren
- vertikaler „Royal Flush“-Modus mit Kamerafahrt und derselben direkten Sprungsteuerung wie die normalen Level
- Rückkehr zur Levelauswahl nach jedem Lauf
- vollständig feste Plattformen mit Kollisionen an Ober-, Unter- und beiden Seiten
- eigene generierte Hintergründe, Plattformen und Toiletten für jedes Levelthema
- nahtlose, proportional skalierte Levelhintergründe mit kamerageführtem Bildausschnitt
- Karriereübersicht mit Gesamtstatistik und sieben dauerhaft gespeicherten Achievements
- drei individuelle, dauerhaft gespeicherte Sterne-Missionen pro Level
- zügig horizontal und vertikal fahrende Plattformen, die den Spieler mitnehmen und seitlich schieben
- taktische Zeitplattformen mit Warnphase sowie Förderbänder in beide Richtungen
- Wasserstrahlen, rotierende Toilettenbürsten und Rücksetzung zum letzten Checkpoint
- ausführliche Ergebnisübersicht mit Score-Aufschlüsselung, Missionsstatus und direktem nächsten Level
- kopierbare Laufzusammenfassung zum Teilen von Medaille, Score, Zeit und Missionen

## Spielen

`index.html` kann direkt im Browser geöffnet werden. Alternativ kann der Ordner über einen lokalen Webserver bereitgestellt werden.

- Pfeiltasten links/rechts oder A/D: bewegen
- Leertaste, Pfeiltaste hoch oder W: springen
- P oder Escape: pausieren/fortsetzen
- R: aktuelles Level sofort neu starten
- Vollbild: über den Button im HUD ein- und ausschalten
- Auf Geräten mit Touchscreen erscheinen Bildschirmtasten.

## Entwicklung

Die wartbaren ES-Module liegen unter `src/`. Für den direkten Start über `file://` wird daraus `game.bundle.js` erzeugt.

```sh
npm install
npm run build
npm test
```

`npm test` baut das Bundle, prüft die Syntax aller Module und führt die automatisierten Gameplay-Tests aus.

## Struktur

- `main.js` – Einstiegspunkt
- `src/game.js` – Spielzustände und Hauptschleife
- `src/entities.js` – Spieler und Levelobjekte
- `src/physics.js` – Kollisionen
- `src/input.js` – Tastatur- und Touchsteuerung
- `src/level.js` – Leveldaten
- `src/level-validation.js` – frühzeitige Prüfung des vollständigen Levelkatalogs
- `src/levels.js` – unabhängiger Levelkatalog
- `src/assets.js` – Sprite-Ladevorgang
- `src/rendering.js` – skalierte Hintergrundausschnitte ohne Bildwiederholung
- `assets/themes/` – generierte Levelhintergründe und transparente Plattform-/Toiletten-Atlanten
- `src/config.js` – zentrale Konstanten
- `src/score.js` – Timer, Combo, Score und Medaillen
- `src/missions.js` – Auswertung der levelbezogenen Herausforderungen
- `src/hazards.js` – Gefahren, Rückstoß und Checkpoint-Respawn
- `src/storage.js` – fehlertolerante lokale Rekordspeicherung
- `tests/` – Regressionstests
