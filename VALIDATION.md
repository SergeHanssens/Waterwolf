# Validatie · 8 oktober 2026

## Automatische controles

28 tests slagen: geografische afstand/koers, stroomvectoren, windstilte, invoervalidatie, ontbrekende polar, verboden polygonen, ondiepte, onbekende diepte, overstagkosten en -tijd, stuurboord/bakboordzijde, geometrische boeironding, finishrichting, windafhankelijke polar, stroomgecompenseerde koers, tijdsaftelling en vaste dieptelocaties. JavaScript-syntax gecontroleerd.

De demonstratieroute voltooit op deze computer in circa 0,3 seconde binnen de engine-test. UI-berekening draait in een aparte worker. Dit bewijst geen globaal optimale tactiek.

## Browser

In de Codex-browser getest: demobaan geeft koers/route en volgende manoeuvre; kapiteinsicoon laadt; tabwissels werken; gewone zeil- en polarformulieren verschijnen; technische invoer is verborgen; ankerstart toont wachten op startsein; lege verplichte boei onderdrukt koersadvies; officieel racesjabloon bevat geen verzonnen startpositie. Geen JavaScript-fouten tijdens deze controles.

De browser bleef ondanks de aangevraagde telefoonafmetingen op een desktopbreedte staan. Responsive stijlen zijn aanwezig; visuele controle op een echte telefoon is nog nodig. GPS, hoorbaarheid bij wind, vergrendeld scherm en fysieke zeilhandelingen zijn niet op het water getest. Offline shell en telefooninstallatie moeten naast de cachecontrole in de echte telefoonbrowser worden getest.

## Onafhankelijke review

Claude Code heeft app en engine gelezen en concrete gebreken gemeld. Stroomcompensatie, uitsluitend finale finishkruising, partiale boeironding, afzonderlijke COG/heading, GPS-/windouderdom, boei-indexering, dieptelocatie en meldingsaftelling zijn daarna verbeterd en waar relevant getest.

## Nog nodig voor gebruik in de echte race

Bevestigde baan en palaverwijzigingen; Waterwolf-polar en zeilgarderobe; beladen diepgang, kielspeling en manoeuvretijden. Betrouwbare nautische diepte-/obstakel-/stroomgegevens ontbreken als automatische feed. Geometrische boeipassage is geen juridische wedstrijdvalidatie; daadwerkelijke passage moet door de bemanning worden bevestigd.
