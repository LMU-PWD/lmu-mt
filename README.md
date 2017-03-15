# Medientechnik WebApp Polymer

Diese WebApp bietet eine Plattform um den Ablauf der Medientechnik Praktika zu erleichtern.
Das Frontend basiert auf [Polymer](https://www.polymer-project.org/) und das Backend ist eine [Node.js](https://nodejs.org/) API.

## Kurze Beschreibung des Funktionsumfangs

Die Registrierung erfolgt über die LMU Campus-EMail-Adressen.
Die App erlaubt es den Studenten Gruppen zu bilden, sich für Prakita einzutragen und die wichtigsten Informationen über ihre Gruppe und die zu absolvierenden Praktikas schnell einzusehen. Auch Tutoren können sich für die Betreuung von Praktika eintragen und Kontakt mit wichtigen Informationen einsehen. Administratoren haben einen großen Umfang an Funktionen um Semester, Nutzer, Gruppen und Praktika verwalten und bearbeiten.

## Getting Started

Diese Anleitung umfasst alle nötigen Informationen um eine Kopie des Projekts auf deiner lokalen Maschine zur Entwicklung- und Testzwecken nutzen zu können. Für Informationen über das deployen auf einem Livesystem siehe den Punkt "Deployment".
* Das Backend befindet sich hier: [backend](https://gitlab.lrz.de/ru67xoz/mt-common-api.git)
* Und das Frontend hier: [frontend](https://gitlab.cip.ifi.lmu.de/altmannp/PWD_MT.git)

### Voraussetzungen

Was du brauchst um das Projekt installieren zu können.


* Datenbank: [mongo.db](https://www.mongodb.com/download-center)
* Backend: [Node.js](https://nodejs.org/)


### Installation

Schritt-für-Schritt Anleitung zur Installation

* npm-Install im `\backend\` Ordner

```
npm install
```

* npm-Install im `...\frontend\` Ordner

```
npm install
```

* Bower install der bower-dependencies des Projekts im `...\frontend\` Ordner

```
bower install
```

## Starten des Codes

### Backend starten
Mongo.db starten, die auf Verbindungen auf dem Port `27017` wartet
```
"[path to mongod.exe]"
```
Server starten in `\backend\server\` der auf den Port `3000` hört
```
node server.js
```

### Frontend starten
Frontend serven in `...\frontend\` auf dem Port `8080`
```
polymer serve
```

Jetzt ist die App im Browser deiner Wahl unter der url `localhost:8080` erreichbar

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Polymer](https://www.polymer-project.org/) - Frontend JavaScript Bibliothek
* [Mongo.db](https://www.mongodb.com/download-center) - Datenbank
* [Node.js](https://nodejs.org/) - Backend/API


## Autoren

* **Bettina Noglik**
* **Martin Schön**
* **Philipp Altmann**
* **Sarah Delgado Rodriguez**

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## Acknowledgments

* Dieses Projekt ist im Rahmen des Praktikums Webprogrammierung an der LMU durchgeführt von Juliane Franze und Tobias Seitz entstanden

