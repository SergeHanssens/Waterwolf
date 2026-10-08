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
