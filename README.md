# Medientechnik WebApp Polymer

Diese WebApp bietet eine Plattform um Ablauf und Organisation des Kurses Medientechnik an der Ludwig-Maximilians-Universität München zu erleichtern.

Die App besteht aus einem [Node.js](https://nodejs.org/)-Backend basierend auf dem [Loopback](http://loopback.io/)-Framework. Das Frontend wurde in [Polymer](https://www.polymer-project.org/) umgesetzt.

## Kurze Beschreibung des Funktionsumfangs

Die App erlaubt es den Studenten Gruppen zu bilden, sich für Prakita einzutragen und die wichtigsten Informationen über ihre Gruppe und die zu absolvierenden Praktikas schnell einzusehen.

Tutoren können sich für die Betreuung von Praktika eintragen, Kontakt mit ihren Studenten aufnehmen und Informationen zu ihren Kursen einsehen.

Administratoren haben einen großen Umfang an Funktionen um Semester, Nutzer, Gruppen und Praktika zu erstellen, verwalten und bearbeiten.

Die Registrierung für die Plattform erfolgt über die Campus-E-Mail-Adressen der LMU.

## Erste Schritte

Diese Anleitung umfasst alle nötigen Informationen um eine Kopie des Projekts auf deiner lokalen Maschine zur Entwicklung- und Testzwecken nutzen zu können.

### Voraussetzungen

Was du brauchst um das Projekt installieren zu können:

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/)
* [MongoDB](https://www.mongodb.com/download-center)
* [Polymer CLI](https://www.polymer-project.org/2.0/docs/tools/polymer-cli)

### Installation

##### Das Projekt klonen

```
git clone https://gitlab.cip.ifi.lmu.de/altmannp/PWD_MT.git
```

##### Installieren

Das Installskript lädt alle benötigten Komponenten für Backend und Frontend.

```
cd <<Projektverzeichnis>>
npm install
```

## Starten der Anwendung

#### Datenbank starten

##### Windows

```
"C:\path\to\mongod.exe" --dbpath \custom\db\path
```

##### Mac OS / Linux

```
mongod --dbpath /custom/db/path
```

Wenn du keine Änderungen an deiner Mongo-Konfiguration vorgenommen hast, sollte dies ausreichen. Stelle ansonsten sicher, dass MongoDB auf Port 27017 hört.

#### App starten

Im Projekt-Verzeichnis reicht ein einfaches

```
npm start
```

Und wir sind bereit!

* Das Frontend der App ist unter `localhost:3000` erreichbar
* Die Backend-API läuft unter `localhost:3000/api/`
* Unter `localhost:3000/explorer` steht ein Webinterface zum Durchstöbern des API-Modells zur Verfügung

## Testdaten

In der aktuellen Version wird die Datenbank beim Start mit Testdaten befüllt. Diese enthalten unter anderem Nutzer aller möglichen Nutzerrollen zu Testzwecken.

#### Zugangsdaten von Dummy-Nutzern

##### Admin

**E-Mail**: admin@mt.medien.ifi.lmu.de

**Passwort**: mtadmin

##### Tutor

**E-Mail**: kevin@campus.lmu.de

**Passwort**: test

##### Student

**E-Mail**: max.mustermann@campus.lmu.de

**Passwort**: test

##### Weitere User (Passwort jeweils "test")

- willischmidt@campus.lmu.de (Tutor)
- dakota@campus.lmu.de (Student)
- gianna@campus.lmu.de (Student)
- jacky@campus.lmu.de (Student)
- justin@campus.lmu.de (Student, noch nicht registriert, Passwort nicht vergeben)

## Hinweise für Entwickler

#### Bei laufender Anwendung das Frontend neu bauen

Loopback liefert unter `localhost:3000` einen statischen Build des Frontends aus. Um diesen nach Änderungen am Code zu erneuern, führe im App-Verzeichnis folgendes aus:

```
cd frontend
polymer build
```

#### Frontend dynamisch ausliefern

Alternativ können Änderungen am Frontend-Code mithilfe der Polymer CLI auch on the fly ohne Kompilieren ausgeliefert werden. Dazu einfach:

```
cd frontend
polymer serve
```

Unter `localhost:8080` wird dann der jeweils aktuelle Codestand ausgeliefert.

## Autoren

* **Philipp Altmann**
* **Sarah Delgado Rodriguez**
* **Bettina Noglik**
* **Martin Schön**

## Troubleshooting
* https://loopback.io/doc/en/lb2/Creating-database-tables-for-built-in-models.html muss augeführt werden, sonst geht z.B. MySQL als Connector nicht. 

## Anmerkungen

* Dieses Projekt ist im Rahmen des Praktikums Webprogrammierung an der Ludwig-Maximilians-Universität München entstanden. Es wurde betreut von Juliane Franze und [Tobias Seitz](https://twitter.com/TbsStz)
* [Zur Abschlusspräsentation auf Prezi](http://prezi.com/zdyz8h9v8px3/?utm_campaign=share&utm_medium=copy)
