# 🚀 GitHub Pages Deployment Anleitung

## Schnellstart

### Option 1: Neues Repository erstellen

1. **Repository auf GitHub erstellen**
   - Gehe zu https://github.com/new
   - Repository Name: `grogger-game` (oder beliebiger Name)
   - Wähle "Public"
   - Klicke "Create repository"

2. **Dateien hochladen**
   ```bash
   cd /Users/helmutspeichermann/Documents/grogger
   git init
   git add index.html styles.css game.js README_WEB.md .gitignore
   git commit -m "Initial commit: Grogger web game"
   git branch -M main
   git remote add origin https://github.com/DEIN-USERNAME/grogger-game.git
   git push -u origin main
   ```

3. **GitHub Pages aktivieren**
   - Gehe zu deinem Repository auf GitHub
   - Klicke auf "Settings" (Einstellungen)
   - Scrolle zu "Pages" im linken Menü
   - Unter "Source" wähle "Deploy from a branch"
   - Wähle Branch "main" und Ordner "/ (root)"
   - Klicke "Save"

4. **Fertig!**
   - Nach 1-2 Minuten ist dein Spiel live unter:
   - `https://DEIN-USERNAME.github.io/grogger-game/`

### Option 2: Drag & Drop Upload

1. Erstelle ein neues Repository auf GitHub
2. Gehe zum Repository
3. Klicke "uploading an existing file"
4. Ziehe diese Dateien in den Browser:
   - `index.html`
   - `styles.css`
   - `game.js`
   - `README_WEB.md`
5. Klicke "Commit changes"
6. Aktiviere GitHub Pages wie in Option 1, Schritt 3

## 📁 Benötigte Dateien für GitHub Pages

Nur diese Dateien werden benötigt:
- ✅ `index.html` - Hauptseite
- ✅ `styles.css` - Styling
- ✅ `game.js` - Spiellogik
- ✅ `README_WEB.md` - Dokumentation
- ✅ `.gitignore` - Git-Konfiguration

Die Java-Version und andere Dateien werden NICHT benötigt!

## 🔧 Lokales Testen vor Deployment

```bash
# Mit Python 3
python3 -m http.server 8000

# Mit Python 2
python -m SimpleHTTPServer 8000

# Mit Node.js (npx)
npx http-server

# Mit PHP
php -S localhost:8000
```

Dann öffne: http://localhost:8000

## 🌐 Custom Domain (Optional)

1. Kaufe eine Domain (z.B. bei Namecheap, GoDaddy)
2. Erstelle eine Datei `CNAME` im Repository:
   ```
   www.deine-domain.de
   ```
3. Konfiguriere DNS bei deinem Domain-Provider:
   ```
   Type: CNAME
   Name: www
   Value: DEIN-USERNAME.github.io
   ```

## 🐛 Troubleshooting

### Seite zeigt 404
- Warte 2-3 Minuten nach dem Aktivieren von GitHub Pages
- Stelle sicher, dass `index.html` im Root-Verzeichnis liegt
- Prüfe, ob der Branch "main" ausgewählt ist

### Spiel lädt nicht
- Öffne Browser-Konsole (F12)
- Prüfe auf JavaScript-Fehler
- Stelle sicher, dass alle 3 Dateien hochgeladen wurden

### Sounds funktionieren nicht
- Manche Browser blockieren Auto-Play von Sounds
- Klicke einmal auf die Seite, dann sollten Sounds funktionieren

## 📊 Analytics (Optional)

Füge Google Analytics hinzu, indem du vor `</head>` in `index.html` einfügst:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔄 Updates deployen

```bash
# Änderungen machen
git add .
git commit -m "Update: Beschreibung der Änderung"
git push

# GitHub Pages aktualisiert automatisch nach 1-2 Minuten
```

## ✅ Checkliste vor Deployment

- [ ] Alle 3 Hauptdateien vorhanden (HTML, CSS, JS)
- [ ] Lokal getestet im Browser
- [ ] README_WEB.md aktualisiert
- [ ] .gitignore konfiguriert
- [ ] Repository ist Public (für kostenlose GitHub Pages)
- [ ] Keine sensiblen Daten im Code

## 🎉 Nach dem Deployment

Teile dein Spiel:
- Twitter/X: "Schaut euch mein Grogger-Spiel an! 🐸 [URL]"
- Reddit: r/webdev, r/gamedev
- Discord-Communities
- LinkedIn

---

**Viel Erfolg mit deinem Deployment! 🚀**