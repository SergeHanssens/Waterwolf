# Numerieke RWS-stroming — verificatie 8 oktober 2026

Er bestaat een bruikbare openbare numerieke punt-API op de **actuele FEWS-dienst**. De eerdere WMS/GetFeatureInfo-beperking geldt niet voor deze afzonderlijke REST-API. Geen account of sleutel gevraagd. Browser-CORS ontbreekt: server/snapshot is nodig.

## Bevestigde API

Basis: `https://rwsos.rws.nl/matroos-open/rest/fewspiservice/v1/timeseries/grid`

Officiële schema: https://rwsos.rws.nl/matroos-open/test/fewspiservicerest/apidoc/delft-fews-webservices-rest-api-v1-oas3.json

Parameters `layers`, `x`, `y`, `bbox`, `startTime`, `endTime`, `documentFormat=PI_JSON`, `useDisplayUnits=false`. x/y/bbox zijn volgens dit officiële schema EPSG:3857. `layers` is de actuele, tijdgestempelde laag uit WMS GetCapabilities. Gecontroleerde laag: `-ijsselmeer_fm_harmonie--stroom--2026-10-08T12:00:00Z`.

Voorbeeld werkelijk HTTP200, JSON met afzonderlijke `velu` en `velv`, eenheid m/s, kwaliteitsvlag `0`, forecastDate 12:00 UTC:

- Aanvraagpositie 52.82 N, 5.214 E, geldigheid 18/19/20 UTC: velu -0.2, velv +0.1 m/s. Magnitude circa 0.435 kn.
- 52.75 N, 5.35 E: velu -0.1 op 18 UTC, 0 op 19/20 UTC; velv 0.
- 52.73 N, 5.30 E: -999, vlag9; **ontbrekend**, geen nulstroming.
- Sommige punten geven lege `timeSeries`; eveneens ontbrekend.

`useDisplayUnits=false` bleef in de geteste respons één decimaal leveren. Er is geen hogere precisie geclaimd. Header-lat/lon 53.073009/5.33196 was constant voor verschillende aanvragen: dit is een referentielocatie en **geen bewijs van geselecteerde celcoördinaten**. Snapshot bewaart de aanvraagcoördinaten expliciet.

## Nog niet bevestigd: geografische vectororiëntatie

De direct-interface noemt velu snelheid in x-richting, velv in y-richting. De legacycatalogus noemt RD voor dit model. Het actuele FEWS-antwoord bevat geen expliciet standard_name eastward/northward voor deze componenten. De magnitude is numeriek beschikbaar; een richting t.o.v. het modelrooster mag nog niet als ware geografische richting in de router worden gebruikt. `axesEastNorthVerified=false` blijft daarom staan. Geen kaartpixels gelezen of kleuren terugberekend.

## Legacy Matroos is niet de actuele bron

Officiële legacy-documentatie: https://noos.matroos.rws.nl/direct/get_map2series.php

Die ondersteunt ruimte-interpolatie, WGS84/RD, velu/velv en NetCDF. Maar de actuele legacycatalogus https://noos.matroos.rws.nl/maps/search/get_sources.php markeerde `ijsselmeer_fm_harmonie`, `ijsselmeer4_harmonie_f2w` en Markermeer-model als niet beschikbaar. Puntvragen voor huidige tijd leverden `ERROR: geen data beschikbaar in de gevraagde periode`. Dit is geen bewijs dat de actuele FEWS-dienst ontbreekt.

## Geleverde bestanden

- `current-field.js`: strikte parser per punt, alleen beide componenten vlag0, dezelfde run en m/s, -999 nooit nul. Tijd/run/bemonsteringsradius bewaakt. Onbekende dichtstbijzijnde cel leent niet zomaar een andere natte cel. Zonder geverifieerde assen geen router-vector.
- `scripts/update-current-field.mjs`: maximaal twee gelijktijdige vragen, 35 punten rond 52.70–52.82 N / 5.214–5.35 E, circa2km raster. Dynamische laatste run, geldige tijden tot12uur vooruit.
- `data/current-field.json`: werkelijk opgehaald; 35 punten, 8 met geldige numerieke waarden. Modelrun12UTC. Assen niet bevestigd.
- `current-field.test.mjs`: echte componenten/magnitude, missing/flags, onbekende cellen, tijd en asblokkering gecontroleerd.

Deze puntvragen ondersteunen onmiddellijk een numerieke magnitudeweergave. Volledig automatische koerscorrectie vereist nog geverifieerde vectororiëntatie én zorgvuldige omgang met de ontbrekende rastercellen.

## NetCDF aanvullende controle

`documentFormat=PI_NETCDF` op dezelfde FEWS-grid-API retourneert HTTP200 `application/x-netcdf` met bestandsnaam `velu_ijsselmeer_fm_externalforecasting_nonequidistant.nc`. Het is rechtstreeks HDF5/NetCDF4, **geen ZIP** in deze concrete respons. Zelfs één gevraagd tijdstip start/end18UTC produceert een groot volledig meshbestand; download na beperkte kopcontrole beëindigd.

Kopmetadata, bewaard als `data/current-netcdf-header.bin` (onvolledig bestand, uitsluitend onderzoeksmetadata): CF-1.6/UGRID-0.9, Mesh_face_x/y, velu/velv, grid_mapping `latitude_longitude`, WGS84 EPSG:4326, proj4 `+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs`. Dit corrigeert de legacy RD-aanname: de actuele FEWS export beschrijft WGS84. Er is in de bekeken kop geen expliciete eastward/northward standard_name voor velu/velv aangetroffen. De D-Flow FM technische manual bevestigt x/y-centrevelocities maar geeft in de gecontroleerde tekst geen expliciete geografische mapping. Daarom blijft automatische routerrichting geblokkeerd tot die laatste semantische bevestiging.

## Richting bevestigd op 8 oktober 2026
Officiële RWS-catalogus https://noos.matroos.rws.nl/maps/search/get_units.php, HTTP 200: VELU = Eastward water velocity, m/s (recid50); VELV = Northward water velocity, m/s (recid52). FEWS-export gebruikt velu/velv. Mapping u=oost, v=noord; richting naar atan2(u,v), snelheid hypot(u,v), conversie m/s naar knopen. Eerdere blokkade wegens onbevestigde assen is hiermee opgeheven. Ontbrekende/kwaliteitsafgekeurde modelcellen en oude modelruns blijven onbekend.
