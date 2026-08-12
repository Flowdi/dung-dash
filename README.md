# Dung Dash

Ein kleiner Canvas-Platformer: Sammle Fliegen, erreiche die Toiletten in der richtigen Reihenfolge und bringe den Kothaufen ans Ziel.

## Spielen

`index.html` kann direkt im Browser geöffnet werden. Alternativ kann der Ordner über einen lokalen Webserver bereitgestellt werden.

- Pfeiltasten links/rechts: bewegen
- Leertaste oder Pfeiltaste hoch: springen
- P oder Escape: pausieren/fortsetzen
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
- `src/assets.js` – Sprite-Ladevorgang
- `src/config.js` – zentrale Konstanten
- `tests/` – Regressionstests
