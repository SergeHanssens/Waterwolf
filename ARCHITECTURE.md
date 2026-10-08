# Architectuur

## Modules

`app.js` beheert lokale profielen, race-editor, omgeving, GPS, weer, kaart en bemanningsmeldingen. `engine.js` is onafhankelijk van browser en UI. `sw.js` bewaart uitsluitend dezelfde-origin appbestanden; geen voorspellingen of externe kaarttegels als actuele data cachen. `data/` bewaart verifieerbare bronnen en een voorlopig racesjabloon.

Interne eenheden: WGS84 decimale graden, knopen, zeemijlen, seconden en meters. Windrichting is **van**, stromingsrichting is **naar**, ware noordrichting. Geen omzetting van MSL naar LAT/NAP zonder bekende verticale datum.

## Routeberekening

Bolgeometrie met gemiddelde aardstraal; voor lokale tactische benadering, niet hydrografische positiebepaling. Vaarsnelheid volgt lineaire interpolatie tussen ingevoerde polarpunten. De engine ondersteunt tevens interpolatie tussen windafhankelijke tabellen. De uurvoorspelling kan als tijdsafhankelijke windbron door de route-worker worden gebruikt. Koersvector + stroomvector geeft snelheid en koers over grond. Onder de kleinste ingevoerde windhoek is er geen bruikbare zeilsnelheid.

De begrensde beam search onderzoekt koers-/tijdstappen en behoudt kandidaten in geografische cellen. Overstag/gijp kost configureerbare tijd. Verboden polygonen worden met segmentkruising getest. Diepte wordt langs kandidaatsegmenten bemonsterd; onbekend is een waarschuwing of een harde blokkade met `requireKnownDepth`. Dit is geen volledige klassieke isochrone-optimalisatie en bewijst geen globaal optimum.

Boeirondingen worden uitgesplitst in verplichte boogpunten rond een uitsluitingscirkel. De richting van de afgelegde boog wordt gecontroleerd. Finishlijnen krijgen een benaderingspunt en een punt voorbij de lijn; daadwerkelijke kruising van het modelpad is verplicht. De startlijn is alleen geometrische invoer; startprocedure en geldige kruising moeten operationeel worden gecontroleerd. Zie engine-tests voor randgevallen.

## Meldingen

De route voorspelt de tijd tot de eerste manoeuvre. Binnen de ingestelde voorbereidingstijd volgt een gededupliceerde sessiemelding. GPS en omgevingsinvoer vernieuwen het plan. Zeilconfiguraties worden uitsluitend uit gebruikersregels gekozen; overlappende regels vragen kapiteinskeuze. Bij ankerstart houdt de interface hijsadvies tegen tot bevestiging van het startsein. Web Notifications en spraak zijn hulpmiddelen tijdens actief gebruik, geen achtergrond-alarmdienst.

## Volgende bouwstappen

1. Boordtest met gemeten polar, exacte zeilgarderobe, start-/manoeuvreprocedures en zeilwisseltijden.
2. Windafhankelijke 2D-polars, ruimtelijke en tijdsafhankelijke voorspellingen, modelvergelijking met expliciete onzekerheid.
3. Actuele nautische kaartlagen met vergunning, diepte/waterstand in consistente datum en obstakel-editor.
4. Validatie echte GPS-track voor boeizijde/finish en startlijn-bias/tijd-tot-lijn.
5. NMEA/Signal K via afzonderlijke optionele gateway; HTTPS serverless-proxy voor beschermde weerbronnen.
6. Kalibratie uit gecontroleerde boordmetingen: SOG alleen is onvoldoende zonder wind en stroom.

Claude Code voerde een onafhankelijke architectuurreview uit. Bevindingen over stroomcompensatie, finishrichting, boeironding, bronouderdom, dieptelocatie en meldingen zijn verwerkt. Review vervangt geen praktijktest op het water.
