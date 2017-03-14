# Medientechnik WebApp Polymer

Diese WebApp bietet eine Plattform um den Ablauf der Medientechnik Praktika zu erleichtern.
Das Frontend basiert auf [Polymer](https://www.polymer-project.org/) und das Backend ist eine [Node.js](https://nodejs.org/) API.

## Kurze Beschreibung des Funktionsumfangs

Die Registrierung erfolgt über die LMU Campus-EMail-Adressen.
Die App erlaubt es den Studenten Gruppen zu bilden, sich für Prakita einzutragen und die wichtigsten Informationen über ihre Gruppe und die zu absolvierenden Praktikas schnell einzusehen. Auch Tutoren können sich für die Betreuung von Praktika eintragen und Kontakt mit wichtigen Informationen einsehen. Administratoren haben einen großen Umfang an Funktionen um Semester, Nutzer, Gruppen und Praktika verwalten und bearbeiten.

## Getting Started

Diese Anleitung umfasst alle nötigen Informationen um eine Kopie des Projekts auf deiner lokalen Maschine zur Entwicklung- und Testzwecken nutzen zu können. Für Informationen über das deployen auf einem Livesystem siehe den Punkt "Deployment".

### Voraussetzungen

Was du brauchst um das Projekt installieren zu können.


* Datenbank: [mongo.db](https://www.mongodb.com/download-center)
* Backend: [Node.js](https://nodejs.org/)
* Im Backend-Ordner: `npm install`


### Installation

Schritt-für-Schritt Anleitung zur Installation

* npm-Install im `\backend\` Ordner

```
npm install
```

* npm-Install im `\frontend\` Ordner

```
npm install
```

* Bower install der bower-dependencies des Projekts im `\frontend\` Ordner

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
Frontend serven im `\frontend\` auf dem Port `8080`
```
polymer serve
```

## 
# Ich bin noch nicht weiter als bis hier
## 


## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc

