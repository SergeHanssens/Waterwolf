# Validatie · 8 oktober 2026

## Automatische controles

30 tests slagen: geografische afstand/koers, stroomvectoren, windstilte, invoervalidatie, ontbrekende polar, verboden polygonen, ondiepte, onbekende diepte, overstagkosten en -tijd, stuurboord/bakboordzijde, geometrische boeironding, finishrichting, windafhankelijke polar, stroomgecompenseerde koers, tijdsaftelling en vaste dieptelocaties. JavaScript-syntax gecontroleerd.

De demonstratieroute voltooit op deze computer in circa 0,3 seconde binnen de engine-test. UI-berekening draait in een aparte worker. Dit bewijst geen globaal optimale tactiek.

## Browser

In de Codex-browser getest: demobaan geeft koers/route en volgende manoeuvre; kapiteinsicoon laadt; tabwissels werken; gewone zeil- en polarformulieren verschijnen; technische invoer is verborgen; ankerstart toont wachten op startsein; lege verplichte boei onderdrukt koersadvies; officieel racesjabloon bevat geen verzonnen startpositie. Geen JavaScript-fouten tijdens deze controles. Meldingsinstellingen, schermtest en heropenen met gewijzigde voorbereidingstijd zijn getest. De eerste versie en officiële boeidata zijn gepubliceerd op GitHub Pages; de automatische GitHub-tests slagen. Voorgestelde waarden en instelbare meldingskanalen zijn daarna toegevoegd.

De browser bleef ondanks de aangevraagde telefoonafmetingen op een desktopbreedte staan. Responsive stijlen zijn aanwezig; visuele controle op een echte telefoon is nog nodig. GPS, hoorbaarheid bij wind, vergrendeld scherm en fysieke zeilhandelingen zijn niet op het water getest. Offline shell en telefooninstallatie moeten naast de cachecontrole in de echte telefoonbrowser worden getest.

## Onafhankelijke review

Claude Code heeft app en engine gelezen en concrete gebreken gemeld. Stroomcompensatie, uitsluitend finale finishkruising, partiale boeironding, afzonderlijke COG/heading, GPS-/windouderdom, boei-indexering, dieptelocatie en meldingsaftelling zijn daarna verbeterd en waar relevant getest.

## Nog nodig voor gebruik in de echte race

Bevestigde baan en palaverwijzigingen; Waterwolf-polar en zeilgarderobe; beladen diepgang, kielspeling en manoeuvretijden. Actuele nautische editie per kaartcel en numerieke stroomvelden zijn nog niet volledig gekoppeld; historische bodemschatting blijft onzeker. Geometrische boeipassage is geen juridische wedstrijdvalidatie; daadwerkelijke passage moet door de bemanning worden bevestigd.

## Spraakbediening 0.3.0

38 automatische tests slagen, waaronder Nederlandse getallen, onbekende opdrachten, bevestiging, verval na dertig seconden en veranderde baancontext. In de browser is de invoerroute getest: “wind dertien knopen” wijzigt de wind; “volgende boei” vraagt bevestiging en verandert nog niets; “bevestig” activeert Finish. De fysieke microfoon, daadwerkelijke herkenning en hoorbaarheid zijn niet getest.

## Kaart en stemmen 0.4.0

42 automatische tests slagen. Browsercontrole: kaart standaard aan; zoom en kaartactievenster; annuleren; expliciete verwijdermogelijkheid bij boot; grote avatar; spreeksnelheid 0.5 en mannenvoorkeur bewaard na herladen. Toestel bood Microsoft Bart voor nl-BE: extra vrouwelijke/andere stemmen zijn niet op dit toestel bevestigd. Tweevingerzoom en fysieke stemkwaliteit blijven op telefoon te testen.

## Verplaatsen 0.4.1

Bestaande boot en wedstrijdpunten hebben een Verplaats-knop. Nieuwe positie verschijnt als voorstel met apart OK/Annuleer. Browsercontrole: verplaatsen van niet-actieve Boei 1 bewaart uitsluitend die boei na OK; annuleren na een ander voorstel behoudt vorige coördinaten.


## Officiële RWS-gegevens 0.5.0

Automatische tests uitgebreid met NAP-datums en eenheden, ontbrekende cellen, verouderde en toekomstige metingen, conservatieve bodemwaarden, meergrens, bronhashupdates en stromingsmodelrun/tijd. Browser toont verse RWS-stationswaterstanden, historische diepteschatting en twee geladen stromingslagen. Negatieve modeldiepte wordt als niet bevaarbaar aangeduid. Bronvoorbeelden: Enkhuizen -0.25 m NAP, Lemmer -0.23 m NAP en Enkhuizen Markermeer -0.31 m NAP op 8 oktober 2026; deze zijn tijdgebonden, geen vaste waarden. Officiële ENC-kaartdekking rond De Kreupel visueel bevestigd door brononderzoek. Scheduler en live productie moeten afzonderlijk worden gecontroleerd.

53 automatische tests slagen in 0.5.0. In de browser zijn drie officiële RWS-kaartbeelden geladen zonder JavaScript-fouten: ENC + IJsselmeer- en Markermeer-stroming. Nautische kaartbeelden rond Enkhuizen zijn ook visueel gecontroleerd.
