# 🐸 Grogger - Web Version

Ein klassisches Arcade-Spiel im Stil von Frogger, komplett in HTML5/JavaScript implementiert.

## 🎮 Spielen

**Live spielen:** Öffne einfach `index.html` in deinem Browser oder hoste es auf GitHub Pages!

### GitHub Pages Deployment

1. Erstelle ein neues Repository auf GitHub
2. Lade alle Dateien hoch (index.html, styles.css, game.js)
3. Gehe zu Repository Settings → Pages
4. Wähle "Deploy from a branch" und wähle "main" branch
5. Dein Spiel ist nun unter `https://deinusername.github.io/repository-name/` verfügbar!

## 🕹️ Steuerung

### Spieler 1
- **Pfeiltasten**: Bewegen (↑ ↓ ← →)

### Spieler 2
- **W, A, S, D**: Bewegen

### Allgemein
- **ESC**: Pause
- **Mausklick**: Menü-Navigation

## 🎯 Spielziel

- Bringe deinen Frosch sicher über die Straße und den Fluss nach Hause
- Vermeide Autos auf der Straße
- Springe auf Baumstämme und Schildkröten im Fluss (nicht ins Wasser fallen!)
- Erreiche alle 5 Ziele um das Level zu schaffen
- Im 2-Spieler-Modus: Jeder Spieler muss 5 Ziele erreichen

## 📊 Punktesystem

- **50 Punkte** für jedes erreichte Ziel
- **Zeitbonus** für schnelles Spielen (verbleibende Zeit × 2)
- **Extra Leben** bei 10.000 Punkten
- **10 Punkte** für jede Bewegung nach vorne

## 🎨 Features

✅ **Single & Multiplayer**: 1 oder 2 Spieler gleichzeitig  
✅ **Progressive Schwierigkeit**: 10+ Level mit steigender Geschwindigkeit  
✅ **High Score System**: Top 10 Scores werden lokal gespeichert  
✅ **Sound Effekte**: Web Audio API für Spielsounds  
✅ **Responsive Design**: Funktioniert auf verschiedenen Bildschirmgrößen  
✅ **Keine Dependencies**: Reines HTML5/CSS/JavaScript  
✅ **Offline-fähig**: Funktioniert ohne Internetverbindung  

## 🏗️ Technische Details

### Dateien
- `index.html` - Hauptseite mit Canvas und UI
- `styles.css` - Komplettes Styling mit Animationen
- `game.js` - Gesamte Spiellogik (873 Zeilen)

### Technologien
- **HTML5 Canvas** für Rendering
- **JavaScript ES6+** für Spiellogik
- **Web Audio API** für Sound
- **LocalStorage** für High Scores
- **CSS3** für Animationen und Styling

### Browser-Kompatibilität
- Chrome/Edge: ✅ Vollständig unterstützt
- Firefox: ✅ Vollständig unterstützt
- Safari: ✅ Vollständig unterstützt
- Mobile Browser: ⚠️ Eingeschränkt (Tastatur erforderlich)

## 🎮 Spielmechanik

### Lanes (Spielreihen)
1. **Zielbereich** (oben) - Hier müssen die Frösche hin
2. **Fluss** (5 Reihen) - Baumstämme und Schildkröten
3. **Sichere Zone** (Mitte) - Pause zum Durchatmen
4. **Straße** (5 Reihen) - Fahrende Autos
5. **Startbereich** (unten) - Hier beginnt jeder Frosch

### Objekte
- **Autos**: Verschiedene Farben und Größen, tödlich bei Berührung
- **Baumstämme**: Braune Plattformen zum Draufspringen
- **Schildkröten**: Grüne, animierte Plattformen
- **Ziele**: 5 (oder 10 im 2-Spieler-Modus) Slots zum Erreichen

## 🔧 Lokale Entwicklung

```bash
# Einfach die index.html öffnen
open index.html

# Oder mit einem lokalen Server (empfohlen)
python -m http.server 8000
# Dann öffne http://localhost:8000
```

## 📝 Lizenz

Dieses Projekt ist Open Source und frei verfügbar.

## 🎉 Credits

Inspiriert vom klassischen Frogger Arcade-Spiel (1981).  
Komplett neu implementiert in HTML5/JavaScript.

---

**Viel Spaß beim Spielen! 🐸**