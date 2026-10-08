# Waterwolf: bronnen en architectuurkeuzes

Gecontroleerd op 8 oktober 2026. Dit document beschrijft bewijs en openstaande gegevens, geen operationele vaarinstructies.

## Schip

[Holland Sail](https://www.hollandsail.nl/schepen/37/waterwolf) publiceert: Olaf Busser, kitsgetuigde klipper, bouwjaar 1899, lengte 35,5 m, breedte 6,25 m, diepgang 1,40 m en doorvaarhoogte 29 m. De tabel noemt 400 m² zeiloppervlak; de beschrijving noemt tuigage tot 1000 m². Werkelijke wedstrijdzeilen, beladen diepgang, polair en manoeuvretijden moeten aan boord worden vastgesteld. Geen daarvan afleiden uit afmetingen.

## Klipperrace 2026

[Bepalingenpagina](https://klipperrace.nl/bepalingen): 10–11 oktober, palaver 08:00, gepland attentiesein 09:50. Bindend zijn uitsluitend de gekoppelde PDF en officiële wijzigingen; De bindende PDF V1.1 van 15-09-2026 is inmiddels succesvol opgehaald en gelezen. HTML is illustratief. Baan wordt tijdens palaver bepaald. Start is toegewezen ankerplaats of gewijzigde comitélijn. Bij ankerstart mogen zeilen pas na startsein omhoog. Finish loopt tussen groene Compagnieshavenlicht en rode Oostdamlicht. Zaterdag finishdeadline 19:00. VHF 88 voor comité, VHF 10 voor ruimte-overstagaanroepen. WhatsAppbord, palaver en VHF kunnen bindende wijzigingen brengen. Acht boeiposities bevestigd via de officiële RWS/PDOK-dataset van 04-10-2026, met bron per punt in JSON. Start/finishlichtcoördinaten en Kreupel-hindernisgeometrie blijven null. Gekozen baan en rondingszijde vereisen palaverbevestiging.

[Aankondiging](https://klipperrace.nl/aankondiging) bevat afwijkende terminologie over 09:50 (waarschuwingssein); bepalingen hebben voorrang, daarom geen automatische starttijd invullen.

## Vergelijkbare systemen

| Systeem | Bevestigde mogelijkheden | Les voor deze PWA |
|---|---|---|
| [SailGrib WR](https://sailgrib.com/en/apps/sailgrib-wr/aide/) | Isochronen, meerdere waypoints, polar, windlimieten, verboden gebieden en verschillende stromingsbronnen. Corrigeert drift en wind door stroming. | Optimalisatie vraagt gekalibreerde polar, tijdsafhankelijke velden en obstakels. |
| [Expedition](https://www.expeditionmarine.com/) | Meerdere routingalgoritmen, ensemblevergelijking, asymmetrische polars, laylines, startlijnfuncties, zeilkaart, NMEA en loganalyse. | Bouw meetkwaliteit, instrumentinvoer en kalibratie in; toon onzekerheid. |
| [PredictWind hulp](https://help.predictwind.com/en/articles/2884626-how-to-use-weather-routing-in-the-predictwind-app) | Boat polars, actuele/oceanische stroming, dieptevermijding, port/starboard rounding en boundaries. | Modelleer start/finish als lijn, boeien als verplichte ronding en ondiepte als beperking. Controle op navigatiekaart blijft nodig. |

## Open-Meteo en diepte

[Marine API](https://open-meteo.com/en/docs/marine-weather-api) levert golven, stromingssnelheid/-richting en zeeniveau. Stromingsrichting is waarheen het water stroomt; windrichting is waarvandaan. Stroming/getij raster circa 8 km: volgens leverancier ongeschikt voor kustnavigatie. Zeeniveau is globale gemiddelde zeespiegel, niet LAT of NAP; verder landinwaarts mogelijk volledig onbetrouwbaar. Geen waterdiepte/bathymetrievariabele. Daarom IJsselmeer/Wadden-stroming niet automatisch als betrouwbare meetwaarde gebruiken, null niet als nul presenteren en geen kielspeling berekenen met deze zeespiegeldatum. Verbind diepte pas met actuele waterstand, kaartdiepte met bekende verticale datum, beladen diepgang, marge en meetmoment. Geen gratis publieke API gevonden die deze combinatie hier compleet levert.

## Implementatiegrenzen

Advies moet bron, meettijd, onzekerheid en ontbrekende invoer tonen. Een demonstratiepolar of handmatige stroming is herkenbaar als zodanig. Exacte zeilwissels vereisen bevestigde zeilinventaris met wind-/hoekbereik en gemeten bemanningstijden. Meldingen in actieve PWA kunnen een manoeuvre voorbereiden; betrouwbare meldingen terwijl telefoon vergrendeld is vereisen aanvullende platform-/pushinrichting en praktijktest. Geen route als gecontroleerd bevaarbaar presenteren zonder kust-/obstakel- en dieptegegevens.

## Aanvullende broncontrole

[Officiële PDF](https://klipperrace.nl/public/media/2026/wedstrijdbepalingen_klipperrace_2026.pdf), V1.1 15-09-2026, bevestigt bovenstaande start- en finishregels. Zondag finishdeadline 16:00; klassevolgorde B, A, C met 15 minuten tussen starts.

[RWS/PDOK vaarwegmarkeringen](https://api.pdok.nl/rws/vaarwegmarkeringen-nederland/ogc/v1/collections?f=json) is CC0 en bijgewerkt 04-10-2026. Acht exacte namen, inclusief samengestelde ST 1-SB 2, aan wedstrijdbepalingen gekoppeld. Dit zijn bronposities, geen garantie dat de boei ter plaatse onverplaatst is.

[Vaart verslag 2004](https://www.vaart.nl/actueel/artikel/1000008712/_waterwolf__wint_driesteden_race_in_30_ste_klipperrace) bevestigt historische winst met Urk–Medemblik en beschrijft een veranderende wind; geen prestatiepolar of hedendaagse koersinstructie hieruit afgeleid. Facebook en Pindat konden via webtool niet worden gelezen.

## Publieke operationele stromingsvelden — aanvullend bevestigd

Op 8 oktober 2026 rechtstreeks gecontroleerd: de [officiële RWsOS Viewer](https://rwsos-dataservices-prod.avi.deltares.nl/rwsos-viewer/) verwijst naar [Matroos Open WMS](https://rwsos.rws.nl/matroos-open/wms?SERVICE=WMS&REQUEST=GetCapabilities). Capabilities bevatten expliciete IJsselmeer- en Markermeer-stromingsmodellen `ijsselmeer_fm_harmonie` en `markermeer_fm_harmonie`. Laatste gevonden rekenrun 12:00 UTC, uurlijkse geldigheid tot 10 oktober 12:00 UTC. GetMap voor beide wateren retourneerde echte PNG-kaarten. D-Flow FM modelverwachting, geen gemeten stroming. Expliciet TIME meegeven: standaardtijd is het einde van de voorspelling. Daarom dynamisch laatste run ontdekken en actuele geldigheid selecteren.

De kaart bevat gecombineerde `velu`/`velv`-parameters en stijlen `Stroomsnelheid.laag` en `Stroomsnelheid.normaal`. Ondanks queryable-vlag biedt deze WMS uitsluitend GetCapabilities/GetMap; GetFeatureInfo gaf InvalidRequest. Numerieke snelheid/richting blijft daarom onbekend in de router. Niet uit kaartkleuren afleiden. Dit corrigeert de eerdere conclusie dat geen openbaar operationeel binnenwaterstromingsmodel was bevestigd: een openbare modelkaart is nu wel bevestigd, een bruikbare numerieke vector-API nog niet.

[PredictWind huidige documentatie](https://help.predictwind.com/en/articles/9016502-predictcurrent-current-map) beschrijft getij-/oceanische modellen en eigen data. Geen expliciete inlanddekking voor deze afgesloten meren bevestigd; geen claim dat een zeemodel deze meren correct berekent. [KNMI maritiem](https://www.knmi.nl/nederland-nu/maritiem/coastal-waters) dekt IJsselmeer/Marken voor wind, maar levert daar geen stromingsvectoren.

## Geverifieerde waterstandenintegratie

`water-levels.js` vraagt de nieuwe RWS DDAPI20 over laatste zes uur op: WATHTE, OW, NAP en meting. Unit uit respons wordt strikt op cm/m gecontroleerd; kwaliteitscodes conform Waterinfo; gemiddelde of oude historische reeksen uitgesloten. Actuele metingen gevonden bij Krabbersgat IJsselmeer, Lemmer IJsselmeer en Krabbersgat Markermeer. Stationcodes Enkhuizen/Urk blijken historische reeksen; diverse modern klinkende cataloguscodes leveren geen recente waarden. Deze blijven expliciet ontbrekend, nooit nul.

Browser-CORS ontbreekt op DDAPI20; daarom snapshotroute via `scripts/update-water-levels.mjs` en JSON. Freshness volgt meettijd, niet downloadtijd. Boven 30 minuten verouderd. Naam, coördinaten en basin staan bij elke bron; een waterstand uit het ene meer mag geen diepteberekening in het andere meer voeden. Geverifieerde snapshot is een momentopname, automatische actualisering hangt af van de ingestelde taak en dienstbeschikbaarheid.

### Official ENC portrayal verification
The public Rijkswaterstaat Maritime Chart Service was visually checked on 8 October 2026. An EPSG:3857 GetMap with layers 1–9 and bbox `585000,6921500,595000,6931500` returned an actual chart image around Enkhuizen, its harbours and the Houtribdijk, including navigation symbols and channel lines. A second 10 km view near De Kreupel also showed chart features. Wider views can show boundaries or omit chart detail. The hatching is part of the service portrayal and should not be silently stripped.

Service: https://geo.rijkswaterstaat.nl/arcgis/rest/services/ENC/mcs_inland/MapServer/exts/MaritimeChartService/WMSServer
Official ENC distribution: https://www.vaarweginformatie.nl/frp/page/infra_enc
RWS explanation: https://www.rijkswaterstaat.nl/zakelijk/zakendoen-met-rijkswaterstaat/werkwijzen/werkwijze-in-gww/data-eisen-rijkswaterstaatcontracten/elektronische-vaarwegkaarten

Live portrayal is feasible immediately. Per-cell edition dates and exact ZIP download URLs have not been established; a successful request is not evidence of a newly surveyed depth or of the PWA being a certified navigation system. `nautical-chart.js` therefore records the check time and leaves `editionAt` null.
