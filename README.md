# Waterwolf · Shifted Make Race Tactician

Mobiele zeilbuddy voor wedstrijdscenario's, bemanningsvoorbereiding en het verzamelen van boordgegevens. Eerste proefversie, ontwikkeld voor de Enkhuizer Klipperrace van 10–11 oktober 2026.

## Starten

De openbare PWA staat op **https://sergehanssens.github.io/Waterwolf/**.

Open voor lokaal gebruik een terminal in deze map en voer `npm start` uit. Open daarna **http://localhost:4173**. Node.js 22 of hoger; geen externe pakketten nodig. Rechtstreeks dubbelklikken op index.html ondersteunt geen modules, GPS of offline installatie.

Op een telefoon: publiceer de bestanden op HTTPS, bijvoorbeeld GitHub Pages. Open de website in Chrome op Android en kies **Installeren / Toevoegen aan startscherm**. Op iPhone gebruik je Safari → Delen → Zet op beginscherm. Installeer terwijl er internet is; de app-shell werkt daarna offline. Kaarttegels en nieuwe voorspellingen hebben internet nodig.

## Aan boord instellen

1. Kies **Wedstrijd** en maak een race, of laad het Klipperrace-sjabloon. Vul WGS84-coördinaten in decimale graden in: noord/oost positief. Een start- of finishlijn heeft twee uiteinden. Voeg boeien in vaarvolgorde toe met de verplichte zijde. Controleer de definitieve baan tijdens het palaver.
2. Kies **Instellingen** en controleer de beladen diepgang, kielspeling, manoeuvretijden, gemeten polar en zeilconfiguraties in. Op verzoek zijn voorlopige startwaarden ingevuld. Ze blijven als **VOORSTEL** gemarkeerd totdat de kapitein ze bevestigt; ze zijn geen gemeten Waterwolf-prestaties of bevestigde windlimieten. **Laad demo** gebruikt fictieve prestaties en een fictieve baan; die zijn geen Waterwolf-gegevens.
3. Voer wind en stroming in, of haal een Open-Meteo-modelvoorspelling op. GPS werkt na jouw toestemming. Handmatige waterdiepte geldt uitsluitend bij de meetpositie, niet voor de hele route.
4. Laat de cockpit geopend. Zet desgewenst geluid/meldingen aan en stel de voorbereidingstijden en meldingskanalen in. Voorgesteld: algemeen 120 s, overstag 90 s, gijpen 120 s, zeilwissel 180 s. Trillen, trilritme, toon, spraak, volume, scherm- en toestelmeldingen zijn aanpasbaar onder Instellingen. Gebruik **Bewaar meldingsinstellingen** en **Test een melding**. Fysieke trilsterkte en het mastervolume van de telefoon blijven toestelafhankelijk. Adviezen zijn gebaseerd op het ingevoerde scenario. Bevestig het startsein bij ankerstart voordat zeilen worden geadviseerd.
5. Bevestig het bereiken van een boei; automatische juridische rondingscontrole op de echte GPS-track ontbreekt. Exporteer het logboek voor latere analyse.

## Wat deze versie doet

- Lokale race- en scheepsprofielen, start/finish, tussenpunten, verplichte boeizijde.
- Een begrensde koerszoeker met polar, wind, stroomvector en manoeuvreverlies.
- Geometrische boeirondingen en finishlijnkruising in het model.
- Kaart met scheepspositie, scenario-route en wind-/stroomrichting; optionele OpenStreetMap-achtergrond.
- Voorspelling, GPS-log en voorbereidingsmeldingen tijdens actief gebruik.
- Installeerbare offline app-shell en JSON-export; geen account of serverdatabase.

## Grenzen van de eerste versie

De route is een benadering binnen de zoekgrenzen, geen bewezen wereldwijd snelste route. De huidige invoerpolar beschrijft één windregime; volledige windafhankelijke polars en ensembles zijn vervolgstappen. Bij Open-Meteo gebruikt de route de uurvoorspelling op de gekozen locatie. Ruimtelijke weervelden en meerdere modellen zijn nog niet gekoppeld. De engine ondersteunt ook windafhankelijke polartabellen, maar de eenvoudige editor gebruikt één windregime.

Er is **geen automatische betrouwbare diepte-, obstakel-, waterstand-, getij- of stromingsfeed** voor het wedstrijdwater gekoppeld. De engine kan aangeleverde dieptes en verboden polygonen verwerken, maar deze zijn nog niet via een kaarteditor in te tekenen. Onbekende stroom wordt als expliciet gemarkeerd nulstroomscenario berekend. Geen ontbrekende data als veilige doorgang interpreteren.

Startlijnkruising, ankerlichten, voorrangsregels, verkeer en palaverwijzigingen zijn niet automatisch gevalideerd. Boeironding is geometrisch, zonder certificering van wedstrijdgeldigheid. Route-alternatieven zijn beschikbaar in de engine, nog niet als complete racekeuzewizard. Kalibratie van de polar gebeurt handmatig; een GPS-export is geen automatisch geleerd model.

Webapps garanderen geen hoorbare meldingen of GPS bij schermvergrendeling, achtergrondgebruik of energiebesparing. Laat de app zichtbaar en test geluid, GPS en batterij aan boord. Zeilgrenzen en bemanningstijden moeten door de kapitein bevestigd zijn. De kapitein beslist; officiële kaarten, boordmiddelen en de actuele wedstrijdbepalingen blijven leidend.

## Gegevens en privacy

Race, profielen en track staan lokaal in de browser. Export bevat locatiegegevens: deel die bewust. Bij het ophalen van weer worden de ingevulde coördinaten naar Open-Meteo gestuurd. Online kaarttegels worden bij OpenStreetMap opgevraagd. De app gebruikt geen analytics en bevat geen API-sleutels. Het openbare project bevat geen persoonlijke GPS-track.

## Validatie en bronnen

`npm test` voert de reken- en begrenzingstests uit. Zie [architectuur](ARCHITECTURE.md), [brononderzoek](research.md) en [testverslag](VALIDATION.md). Waterwolf-basismaten zijn gecontroleerd bij [Holland Sail](https://www.hollandsail.nl/schepen/37/waterwolf). De officiële [Klipperrace-bepalingen](https://klipperrace.nl/bepalingen) en wijzigingen zijn leidend; de bindende PDF V1.1 is gelezen. Acht RWS-boeiposities zijn beschikbaar; definitieve baan, rondingszijde, startpositie en finishlichtcoördinaten vragen bevestiging aan boord.

MIT License · Copyright © 2026 Serge Hanssens.

## Spraakbediening

Druk op **Start luisteren** en geef je browser microfoontoegang. Voorbeelden: “wat is de koers”, “lees de volgende actie”, “wind twaalf knopen”, “windrichting tweehonderdzeventig”, “volgende boei” en “welke zeilen”. De app spreekt het antwoord en de uitgevoerde wijziging uit. Baan-, positie-, start- en zeilwijzigingen vragen “bevestig” binnen dertig seconden; “annuleer” wist de opdracht. Zeilopdrachten registreren de gekozen configuratie; de bemanning voert de handeling uit.

Spraakherkenning gebruikt de mogelijkheden van de telefoonbrowser en kan online worden verwerkt door diens spraakdienst. Het is een begrensde Nederlandse opdrachtenset. Zonder beschikbare herkenning kun je dezelfde opdrachten typen. Geluidsvolume en gesproken bemanningsmeldingen stel je in onder **Instellingen**. Test microfoon, verstaanbaarheid, batterij en meldingen op je eigen telefoon vóór vertrek; achtergrondwerking is niet gegarandeerd.

## Kaart en stemmen 0.4.0

Online kaart standaard actief. Zoomknoppen, hele-baanweergave, slepen, wielzoom en tweevingerzoom beschikbaar. Kaartklik opent een keuzevenster; een bestaande boot of boei biedt een expliciete verwijderknop. Start/finish blijven verplichte punten: verwijderen wist hun coördinaten. Klik op het kapiteinsicoon voor de grote avatar.

Instellingen bevatten spreeksnelheid, nl-BE/nl-NL, man/vrouw-voorkeur en de werkelijk beschikbare toestelstemmen. Vier verschillende stemmen zijn niet op ieder toestel aanwezig. De app toont ontbrekende stemmen; installeer eventuele extra stemmen via de toestelinstellingen.

Onderzoek naar actuele gegevens: RWS biedt de [bodemkaart IJsselmeergebied 2022](https://downloads.rijkswaterstaatdata.nl/bodemhoogte_ijsselmeergebied/), met bodemhoogte tegenover NAP. Integratie vraagt combinatie met lokale actuele waterstand via [WaterWebservices](https://rijkswaterstaatdata.nl/waterdata/). Deze koppeling is nog niet geïmplementeerd. De gecontroleerde RWS-catalogus bevat geen gekoppelde stromingsstations in het onderzochte IJsselmeer/Markermeergebied. Een [Deltares-model](https://www.deltares.nl/expertise/publicaties/ontwikkeling-zesde-generatie-3d-ijsselmeer-model-modelbouw-validatie) bestaat, maar een openbare operationele stromingsfeed is niet bevestigd.
