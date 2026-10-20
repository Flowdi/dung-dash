# Dung Dash

Ein kleiner Canvas-Platformer: Sammle Fliegen, erreiche die Toiletten in der richtigen Reihenfolge und bringe den Kothaufen ans Ziel.

## Aktuelle Features

- Zeitmessung ab der ersten Spielerbewegung
- Fliegen-Score mit zeitlich begrenzter Combo bis ×4
- Bronze-, Silber- und Goldmedaillen
- persönliche Bestzeit, Highscore und Gesamtstatistik im lokalen Browserspeicher
- dauerhaft gespeicherte Gesamtspielzeit und Trefferstatistik
- Levelversuche sowie durchschnittlicher Score und durchschnittliche Treffer pro Lauf
- globale und levelbezogene persönliche Combo-Rekorde
- Zähler für fehlerfreie Läufe in Karriere und Levelrekorden
- lokale Historie der fünf letzten Läufe mit Score, Zeit und Trefferzahl
- direkter Level-Neustart aus jedem Eintrag der Laufhistorie
- separat löschbare Laufhistorie ohne Verlust von Rekorden oder Karrierefortschritt
- validierter Export und Import des lokalen Spielstands über die Zwischenablage
- dauerhaft gespeicherte Option zum Reduzieren nicht notwendiger Animationen
- optionaler, dauerhaft gespeicherter Hochkontrastmodus
- vergrößerbares HUD und größere Touch-Steuerung als gespeicherte Einstellung
- kompakte Rekordkarte für Medaille, Highscore, Bestzeit und Missionssterne je Level
- visueller Kampagnenfortschritt über alle abgeschlossenen Level
- intelligenter Fortsetzen-Button für das nächste Level oder offene Missionen
- kontextbezogene Empfehlung für das nächste sinnvolle Ziel jedes Levels
- Levelvorschau mit Routentyp, Größe, Fliegen, Checkpoints und Gefahren
- Aufschlüsselung und Erklärung normaler, goldener und zeitgebender Fliegen
- levelbezogene Übersicht aller vorkommenden Plattformmechaniken
- pausierbarer Spiellauf mit direktem Neustart und Rückkehr zur Levelauswahl
- Pausenansicht mit Zeit, Fliegen, Toiletten, Strecke und Treffern des aktuellen Laufs
- responsive Tastatur- und Touchsteuerung
- sechs datengetriebene Level mit Auswahl und Freischaltung
- goldene Fliegen, Zeitfliegen, Sprungplattformen und warnend zerbrechende Plattformen, die wiederkehren
- vertikaler „Royal Flush“-Modus mit Kamerafahrt und derselben direkten Sprungsteuerung wie die normalen Level
- Rückkehr zur Levelauswahl nach jedem Lauf
- vollständig feste Plattformen mit Kollisionen an Ober-, Unter- und beiden Seiten
- eigene generierte Hintergründe, Plattformen und Toiletten für jedes Levelthema
- nahtlose, proportional skalierte Levelhintergründe mit kamerageführtem Bildausschnitt
- Karriereübersicht mit Gesamtstatistik und zehn dauerhaft gespeicherten Achievements
- drei individuelle, dauerhaft gespeicherte Sterne-Missionen pro Level
- zügig horizontal und vertikal fahrende Plattformen, die den Spieler mitnehmen und seitlich schieben
- taktische Zeitplattformen mit Warnphase sowie Förderbänder in beide Richtungen
- Wasserstrahlen, rotierende Toilettenbürsten und Rücksetzung zum letzten Checkpoint
- ausführliche Ergebnisübersicht mit Score-Aufschlüsselung, Missionsstatus und direktem nächsten Level
- Ergebnisanalyse mit Sammelquote, bester Combo und Kennzeichnung fehlerfreier Läufe
- kopierbare Laufzusammenfassung zum Teilen von Medaille, Score, Zeit und Missionen
- direkter Ergebnisvergleich mit bisherigem Level-Highscore und Bestzeit
- Checkpoint-Auswertung mit Vergleich zu jeder gespeicherten persönlichen Zwischenzeit
- laufende Streckenanzeige für horizontale und vertikale Level
- sichtbarer Toiletten- und Checkpoint-Fortschritt während des Laufs

## Spielen

`index.html` kann direkt im Browser geöffnet werden. Alternativ kann der Ordner über einen lokalen Webserver bereitgestellt werden.

- Pfeiltasten links/rechts oder A/D: bewegen
- Leertaste, Pfeiltaste hoch oder W: springen
- P oder Escape: pausieren/fortsetzen
- R: aktuelles Level sofort neu starten
- C: zum letzten Checkpoint zurückkehren und einen Treffer verbuchen
- Vollbild: über den Button im HUD ein- und ausschalten
- F: Vollbildmodus direkt per Tastatur umschalten
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
