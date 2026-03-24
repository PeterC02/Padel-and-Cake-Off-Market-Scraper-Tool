import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const L = window.L;

// ─── i18n TRANSLATIONS ─────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    appTitle: '🏸 Padel Scout',
    appSubtitle: 'OFF-MARKET LAND TOOL',
    searchTab: '🔍 Search',
    pipelineTab: '📊 Pipeline',
    resourcesTab: '📚 Info',
    searchLocation: 'Search any location',
    enterPostcode_UK: 'Enter UK postcode (e.g. GU1 4QA)',
    enterPostcode_DE: 'Enter German postal code (e.g. 80331)',
    enterPostcode_HU: 'Enter Hungarian postal code (e.g. 1051)',
    go: 'Go',
    clickMapHint: 'Or click anywhere on the map to set search centre',
    quickJump: 'Quick jump',
    searchRadius: 'Search radius',
    siteTypes: 'Site types to search',
    searchArea: 'Search this area',
    centre: 'Centre',
    sitesFound: 'sites found',
    showDismissed: 'Show dismissed',
    byScore: 'By Score',
    byType: 'By Type',
    all: 'All',
    pipelineFunnel: 'Pipeline funnel',
    exportCSV: '📥 Export Pipeline to CSV',
    noSavedSites: 'No saved sites yet. Search and save sites to build your pipeline.',
    status: 'Status',
    notes: 'Notes',
    notesPlaceholder: 'Owner name, phone, observations, next actions...',
    remove: '🗑️ Remove',
    savedToPipeline: '✓ Saved to Pipeline',
    saveToPipeline: '💾 Save to Pipeline',
    searchCentre: 'Search Centre',
    radius: 'Radius',
    bookingPlatforms: 'Booking Platforms',
    showExistingPadelClubs: 'Show existing Padel clubs',
    showingExistingClubs: 'Displaying existing padel facilities for competitive analysis',
    hidingExistingClubs: 'Hidden - only showing potential new locations',
    postcodeNotFound_UK: 'Postcode not found. Try another UK postcode.',
    postcodeNotFound_DE: 'Postal code not found. Try another German postal code.',
    postcodeNotFound_HU: 'Postal code not found. Try another Hungarian postal code.',
    postcodeFailed: 'Failed to lookup postal code. Check your connection.',
    startingSearch: 'Starting search...',
    searching: 'Searching',
    satellite: '📡 Satellite',
    streetView: '🚶 Street View',
    osm: '🗺️ OSM',
    landRegistry: '📋 Land Registry',
    idealForCourts: '✅ ideal for 3 courts',
    mayBeSmall: '⚠️ may be small',
    workable: '👍 workable',
    veryLarge: '⚠️ very large',
    scoreLegend: 'Score Guide',
    scoreExcellent: 'Excellent — Prime location, ready for development. Act fast!',
    scoreGood: 'Good — Strong investment opportunity. Schedule site visit.',
    scoreFair: 'Fair — Viable with some challenges. Due diligence required.',
    scorePoor: 'Low — High risk or major obstacles. Consider alternatives.',
    scoreBreakdownTitle: 'Investment Score Breakdown (100 points)',
    scoreSize: 'Size (40pts) — 600–2500m² fits 3-4 courts perfectly',
    scoreSiteType: 'Site Type (25pts) — Disused land & car parks convert easily',
    scoreSurface: 'Surface (15pts) — Hard surfaces need minimal preparation',
    scoreAccess: 'Access (15pts) — Customer access & parking drive revenue',
    scoreInfra: 'Infrastructure (10pts) — Lighting extends playing hours',
    scoreLocation: 'Location (10pts) — Commercial zones attract more players',
    selectCountry: 'Country',
    language: 'Language',
    // Site types
    tennisCourts: 'Tennis Courts',
    surfaceCarParks: 'Surface Car Parks',
    disusedLand: 'Disused/Abandoned Land',
    multiSportCourts: 'Multi-Sport Courts (MUGAs)',
    churches: 'Churches (car parks/grounds)',
    schools: 'Schools (grounds/courts)',
    padelClubs: '🏸 Existing Padel Clubs',
    // Resources
    brownfieldRegisters: 'Brownfield / development registers',
    playingPitchStrategies: 'Playing pitch strategies',
    planningPortals: 'Planning application portals',
    keyTools: 'Key tools',
    padelReference: 'Padel court quick reference',
    singleCourt: 'Single court:',
    threeCourts: '3 courts (ideal):',
    sweetSpot: 'Sweet spot:',
    surface: 'Surface:',
    height: 'Height:',
    access: 'Access:',
    planning: 'Planning:',
    singleCourtDesc: '20m × 10m (200m²) + run-off = ~300m²',
    threeCourtsDesc: '60m × 10m or 40m × 20m = 600–800m²',
    sweetSpotDesc: '600–2,500m² sites',
    surfaceDesc: 'Asphalt/concrete base preferred',
    heightDesc: 'Min 8m clearance',
    accessDesc: 'Vehicle access + customer parking',
    planningDesc_UK: 'Usually D2 (assembly & leisure) use class',
    planningDesc_DE: 'Usually Sondergebiet (SO) or Gemeinbedarf zoning',
    planningDesc_HU: 'Usually Különleges terület (K) or Sport (Sp) zoning',
    // Statuses
    new: 'new',
    satelliteChecked: 'satellite checked',
    ownerFound: 'owner found',
    contacted: 'contacted',
    replied: 'replied',
    viewing: 'viewing',
    negotiating: 'negotiating',
    secured: 'secured',
    dead: 'dead',
  },
  de: {
    appTitle: '🏸 Padel Scout',
    appSubtitle: 'OFF-MARKET GRUNDSTÜCKSSUCHE',
    searchTab: '🔍 Suche',
    pipelineTab: '📊 Pipeline',
    resourcesTab: '📚 Info',
    searchLocation: 'Standort suchen',
    enterPostcode_UK: 'UK-Postleitzahl eingeben (z.B. GU1 4QA)',
    enterPostcode_DE: 'Deutsche PLZ eingeben (z.B. 80331)',
    enterPostcode_HU: 'Ungarische PLZ eingeben (z.B. 1051)',
    go: 'Los',
    clickMapHint: 'Oder klicken Sie auf die Karte, um das Suchzentrum festzulegen',
    quickJump: 'Schnellauswahl',
    searchRadius: 'Suchradius',
    siteTypes: 'Zu suchende Standorttypen',
    searchArea: 'Dieses Gebiet durchsuchen',
    centre: 'Zentrum',
    sitesFound: 'Standorte gefunden',
    showDismissed: 'Ausgeblendete anzeigen',
    byScore: 'Nach Bewertung',
    byType: 'Nach Typ',
    all: 'Alle',
    pipelineFunnel: 'Pipeline-Übersicht',
    exportCSV: '📥 Pipeline als CSV exportieren',
    noSavedSites: 'Noch keine gespeicherten Standorte. Suchen und speichern Sie Standorte, um Ihre Pipeline aufzubauen.',
    status: 'Status',
    notes: 'Notizen',
    notesPlaceholder: 'Eigentümer, Telefon, Beobachtungen, nächste Schritte...',
    remove: '🗑️ Entfernen',
    savedToPipeline: '✓ In Pipeline gespeichert',
    saveToPipeline: '💾 In Pipeline speichern',
    searchCentre: 'Suchzentrum',
    radius: 'Radius',
    bookingPlatforms: 'Buchungsplattformen',
    showExistingPadelClubs: 'Bestehende Padel-Clubs anzeigen',
    showingExistingClubs: 'Bestehende Padel-Anlagen für Wettbewerbsanalyse werden angezeigt',
    hidingExistingClubs: 'Ausgeblendet - nur potenzielle neue Standorte werden gezeigt',
    postcodeNotFound_UK: 'Postleitzahl nicht gefunden. Versuchen Sie eine andere UK-PLZ.',
    postcodeNotFound_DE: 'Postleitzahl nicht gefunden. Versuchen Sie eine andere deutsche PLZ.',
    postcodeNotFound_HU: 'Postleitzahl nicht gefunden. Versuchen Sie eine andere ungarische PLZ.',
    postcodeFailed: 'PLZ-Suche fehlgeschlagen. Prüfen Sie Ihre Verbindung.',
    startingSearch: 'Suche wird gestartet...',
    searching: 'Suche',
    satellite: '📡 Satellit',
    streetView: '🚶 Straßenansicht',
    osm: '🗺️ OSM',
    landRegistry: '📋 Grundbuch',
    idealForCourts: '✅ ideal für 3 Plätze',
    mayBeSmall: '⚠️ möglicherweise zu klein',
    workable: '👍 nutzbar',
    veryLarge: '⚠️ sehr groß',
    scoreLegend: 'Bewertungsleitfaden',
    scoreExcellent: 'Ausgezeichnet — Premiumstandort, entwicklungsreif. Schnell handeln!',
    scoreGood: 'Gut — Starke Investitionsmöglichkeit. Besichtigung terminieren.',
    scoreFair: 'Mittelmäßig — Machbar mit Herausforderungen. Due diligence nötig.',
    scorePoor: 'Niedrig — Hohes Risiko oder große Hindernisse. Altern prüfen.',
    scoreBreakdownTitle: 'Investitionsbewertung (100 Punkte)',
    scoreSize: 'Größe (40pts) — 600–2500m² passen perfekt für 3-4 Plätze',
    scoreSiteType: 'Standorttyp (25pts) — Brachflächen & Parkplätze leicht umwandelbar',
    scoreSurface: 'Oberfläche (15pts) — Hartflächen benötigen minimale Vorbereitung',
    scoreAccess: 'Zugang (15pts) — Kundenparkplätze & Zugang sichern Umsatz',
    scoreInfra: 'Infrastruktur (10pts) — Beleuchtung verlängert Spielzeiten',
    scoreLocation: 'Lage (10pts) — Gewerbegebiete ziehen mehr Spieler an',
    selectCountry: 'Land',
    language: 'Sprache',
    tennisCourts: 'Tennisplätze',
    surfaceCarParks: 'Oberflächenparkplätze',
    disusedLand: 'Stillgelegte/Aufgegebene Flächen',
    multiSportCourts: 'Multisportplätze (MUGAs)',
    churches: 'Kirchen (Parkplätze/Grundstücke)',
    schools: 'Schulen (Höfe/Sportplätze)',
    padelClubs: '🏸 Bestehende Padel-Clubs',
    brownfieldRegisters: 'Brachflächen- / Entwicklungsregister',
    playingPitchStrategies: 'Sportplatzstrategien',
    planningPortals: 'Baugenehmigungsportale',
    keyTools: 'Wichtige Werkzeuge',
    padelReference: 'Padel-Platz Kurzreferenz',
    singleCourt: 'Einzelplatz:',
    threeCourts: '3 Plätze (ideal):',
    sweetSpot: 'Optimale Größe:',
    surface: 'Oberfläche:',
    height: 'Höhe:',
    access: 'Zugang:',
    planning: 'Bauplanung:',
    singleCourtDesc: '20m × 10m (200m²) + Auslauf = ~300m²',
    threeCourtsDesc: '60m × 10m oder 40m × 20m = 600–800m²',
    sweetSpotDesc: '600–2.500m² Grundstücke',
    surfaceDesc: 'Asphalt-/Betonbasis bevorzugt',
    heightDesc: 'Min. 8m lichte Höhe',
    accessDesc: 'Fahrzeugzugang + Kundenparkplätze',
    planningDesc_UK: 'Normalerweise D2 (Versammlungs- & Freizeitnutzung)',
    planningDesc_DE: 'Normalerweise Sondergebiet (SO) oder Gemeinbedarfsfläche',
    planningDesc_HU: 'Normalerweise Különleges terület (K) oder Sport (Sp)',
    new: 'neu',
    satelliteChecked: 'Satellit geprüft',
    ownerFound: 'Eigentümer gefunden',
    contacted: 'kontaktiert',
    replied: 'geantwortet',
    viewing: 'Besichtigung',
    negotiating: 'Verhandlung',
    secured: 'gesichert',
    dead: 'tot',
  },
  hu: {
    appTitle: '🏸 Padel Scout',
    appSubtitle: 'OFF-MARKET TELEKKERESÖ ESZKÖZ',
    searchTab: '🔍 Keresés',
    pipelineTab: '📊 Pipeline',
    resourcesTab: '📚 Infó',
    searchLocation: 'Helyszín keresése',
    enterPostcode_UK: 'Adjon meg UK irányítószámot (pl. GU1 4QA)',
    enterPostcode_DE: 'Adjon meg német irányítószámot (pl. 80331)',
    enterPostcode_HU: 'Adjon meg magyar irányítószámot (pl. 1051)',
    go: 'Mehet',
    clickMapHint: 'Vagy kattintson a térképre a keresési központ beállításához',
    quickJump: 'Gyors ugrás',
    searchRadius: 'Keresési sugár',
    siteTypes: 'Keresendő helyszíntípusok',
    searchArea: 'Keresés ezen a területen',
    centre: 'Központ',
    sitesFound: 'helyszín található',
    showDismissed: 'Elvetettek mutatása',
    byScore: 'Pontszám szerint',
    byType: 'Típus szerint',
    all: 'Összes',
    pipelineFunnel: 'Pipeline áttekintés',
    exportCSV: '📥 Pipeline exportálása CSV-be',
    noSavedSites: 'Még nincsenek mentett helyszínek. Keressen és mentsen helyszíneket a pipeline felépítéséhez.',
    status: 'Állapot',
    notes: 'Jegyzetek',
    notesPlaceholder: 'Tulajdonos neve, telefon, megfigyelések, következő lépések...',
    remove: '🗑️ Eltávolítás',
    savedToPipeline: '✓ Mentve a pipeline-ba',
    saveToPipeline: '💾 Mentés a pipeline-ba',
    searchCentre: 'Keresési központ',
    radius: 'Sugár',
    bookingPlatforms: 'Foglalási platformok',
    showExistingPadelClubs: 'Létező Padel klubok mutatása',
    showingExistingClubs: 'Létező padel létesítmények megjelenítése versenyelemzéshez',
    hidingExistingClubs: 'Rejtve - csak potenciális új helyszínek láthatók',
    postcodeNotFound_UK: 'Irányítószám nem található. Próbáljon másik UK irányítószámot.',
    postcodeNotFound_DE: 'Irányítószám nem található. Próbáljon másik német irányítószámot.',
    postcodeNotFound_HU: 'Irányítószám nem található. Próbáljon másik magyar irányítószámot.',
    postcodeFailed: 'Irányítószám keresése sikertelen. Ellenőrizze a kapcsolatot.',
    startingSearch: 'Keresés indítása...',
    searching: 'Keresés',
    satellite: '📡 Műhold',
    streetView: '🚶 Utcakép',
    osm: '🗺️ OSM',
    landRegistry: '📋 Földhivatal',
    idealForCourts: '✅ ideális 3 pályához',
    mayBeSmall: '⚠️ lehet, hogy kicsi',
    workable: '👍 használható',
    veryLarge: '⚠️ nagyon nagy',
    scoreLegend: 'Pontozási útmutató',
    scoreExcellent: 'Kiváló — Prémium helyszín, fejlesztésre kész. Siessen!',
    scoreGood: 'Jó — Erős befektetési lehetőség. Időpontot egyeztetni!',
    scoreFair: 'Közepes — Megvalósítható kihívásokkal. Due diligence szükséges.',
    scorePoor: 'Alacsony — Magas kockázat vagy nagy akadályok. Alternatívák vizsgálata.',
    scoreBreakdownTitle: 'Befektetési értékelés (100 pont)',
    scoreSize: 'Méret (40pts) — 600–2500m² tökéletes 3-4 pályához',
    scoreSiteType: 'Helyszín (25pts) — Barnamezős területek könnyen átalakíthatók',
    scoreSurface: 'Felszín (15pts) — Kemény felületek minimális előkészítést igényelnek',
    scoreAccess: 'Megközelítés (15pts) — Parkolás & hozzáférés növeli a bevételt',
    scoreInfra: 'Infrastruktúra (10pts) — Világítás meghosszabbítja a játékidőt',
    scoreLocation: 'Elhelyezkedés (10pts) — Kereskedelmi övezetek vonzzák a játékosokat',
    selectCountry: 'Ország',
    language: 'Nyelv',
    tennisCourts: 'Teniszpályák',
    surfaceCarParks: 'Felszíni parkolók',
    disusedLand: 'Elhagyott/Használaton kívüli terület',
    multiSportCourts: 'Multisport pályák (MUGA-k)',
    churches: 'Templomok (parkolók/telkek)',
    schools: 'Iskolák (udvarok/pályák)',
    padelClubs: '🏸 Létező Padel klubok',
    brownfieldRegisters: 'Barnamezős / fejlesztési nyilvántartások',
    playingPitchStrategies: 'Sportpálya stratégiák',
    planningPortals: 'Építési engedélyezési portálok',
    keyTools: 'Fontos eszközök',
    padelReference: 'Padel pálya gyors referencia',
    singleCourt: 'Egy pálya:',
    threeCourts: '3 pálya (ideális):',
    sweetSpot: 'Optimális méret:',
    surface: 'Felület:',
    height: 'Magasság:',
    access: 'Megközelítés:',
    planning: 'Építészeti tervezés:',
    singleCourtDesc: '20m × 10m (200m²) + kifutó = ~300m²',
    threeCourtsDesc: '60m × 10m vagy 40m × 20m = 600–800m²',
    sweetSpotDesc: '600–2.500m² telkek',
    surfaceDesc: 'Aszfalt/beton alap előnyben',
    heightDesc: 'Min. 8m szabad magasság',
    accessDesc: 'Járművel megközelíthető + ügyfélparkoló',
    planningDesc_UK: 'Általában D2 (gyülekezési & szabadidő) besorolás',
    planningDesc_DE: 'Általában Sondergebiet (SO) vagy Gemeinbedarf övezet',
    planningDesc_HU: 'Általában Különleges terület (K) vagy Sport (Sp) övezet',
    new: 'új',
    satelliteChecked: 'műhold ellenőrzött',
    ownerFound: 'tulajdonos megtalálva',
    contacted: 'megkeresve',
    replied: 'válaszolt',
    viewing: 'megtekintés',
    negotiating: 'tárgyalás',
    secured: 'biztosított',
    dead: 'halott',
  },
};

// ─── COUNTRY CONFIGURATIONS ─────────────────────────────────────────────────────
const COUNTRY_CONFIGS = {
  UK: {
    id: 'UK',
    flag: '🇬🇧',
    name: 'United Kingdom',
    center: { lat: 51.411, lng: -0.834 },
    zoom: 13,
    quickLocations: [
      { name: 'Wokingham', lat: 51.411, lng: -0.834 },
      { name: 'Richmond', lat: 51.461, lng: -0.303 },
      { name: 'Guildford', lat: 51.236, lng: -0.571 },
      { name: 'Bracknell', lat: 51.416, lng: -0.749 },
      { name: 'Woking', lat: 51.316, lng: -0.556 },
      { name: 'London', lat: 51.507, lng: -0.128 },
      { name: 'Manchester', lat: 53.483, lng: -2.244 },
      { name: 'Birmingham', lat: 52.486, lng: -1.890 },
      { name: 'Leeds', lat: 53.801, lng: -1.549 },
      { name: 'Bristol', lat: 51.455, lng: -2.588 },
    ],
    geocodeUrl: (query) => `https://api.postcodes.io/postcodes/${encodeURIComponent(query.trim())}`,
    parseGeocode: (data) => {
      if (data.status === 200 && data.result) {
        return { lat: data.result.latitude, lng: data.result.longitude };
      }
      return null;
    },
    landRegistryUrl: (lat, lng) => `https://eservices.landregistry.gov.uk/wps/portal/Property_Search?lat=${lat}&lng=${lng}`,
    landRegistryLabel: (t) => t.landRegistry,
    resources: (t) => ({
      brownfield: [
        { label: 'Wokingham Brownfield Register', url: 'https://www.wokingham.gov.uk/planning-policy/planning-policy-information/brownfield-land-register' },
        { label: 'Richmond Brownfield Register', url: 'https://www.richmond.gov.uk/services/planning/planning_policy/brownfield_land_register' },
        { label: 'Guildford Brownfield Register', url: 'https://www.guildford.gov.uk/brownfieldregister' },
        { label: 'Bracknell Forest Brownfield Register', url: 'https://www.bracknell-forest.gov.uk/planning-and-building-control/planning/brownfield-land-register' },
        { label: 'Woking Brownfield Register', url: 'https://www.woking.gov.uk/planning-and-building-control/planning-policy/brownfield-register' },
      ],
      pitchStrategies: [
        { label: 'Wokingham Playing Pitch Strategy', url: 'https://www.wokingham.gov.uk/planning-policy/planning-policy-information/playing-pitch-strategy' },
        { label: 'Richmond Playing Pitch Strategy', url: 'https://www.richmond.gov.uk/services/leisure_and_culture/sports_and_fitness/playing_pitch_strategy' },
        { label: 'Guildford Playing Pitch Strategy', url: 'https://www.guildford.gov.uk/playingpitchstrategy' },
      ],
      planningPortals: [
        { label: 'Wokingham Planning Portal', url: 'https://planning.wokingham.gov.uk/FastWeb/welcome.asp' },
        { label: 'Richmond Planning Portal', url: 'https://www2.richmond.gov.uk/PlanData2/Planning_Search.aspx' },
        { label: 'Guildford Planning Portal', url: 'https://www.guildford.gov.uk/planning/search' },
        { label: 'Bracknell Forest Planning Portal', url: 'https://planapp.bracknell-forest.gov.uk/online-applications/' },
        { label: 'Woking Planning Portal', url: 'https://caps.woking.gov.uk/online-applications/' },
      ],
      tools: [
        { label: '🏠 HM Land Registry — Property Search', url: 'https://eservices.landregistry.gov.uk/wps/portal/Property_Search' },
        { label: '📊 Active Places Power — Sport England', url: 'https://www.activeplacespower.com/' },
        { label: '🎾 LTA Court Finder', url: 'https://www.lta.org.uk/play/ways-to-play/find-a-court/' },
        { label: '🌍 Google Earth Pro (free)', url: 'https://www.google.com/earth/versions/#earth-pro' },
        { label: '🗺️ MAGIC Map — Environmental designations', url: 'https://magic.defra.gov.uk/MagicMap.aspx' },
        { label: '💷 Council Tax Band Lookup', url: 'https://www.tax.service.gov.uk/check-council-tax-band/search' },
      ],
    }),
  },
  DE: {
    id: 'DE',
    flag: '🇩🇪',
    name: 'Deutschland',
    center: { lat: 52.520, lng: 13.405 },
    zoom: 11,
    quickLocations: [
      { name: 'Berlin', lat: 52.520, lng: 13.405 },
      { name: 'München', lat: 48.137, lng: 11.576 },
      { name: 'Hamburg', lat: 53.551, lng: 9.994 },
      { name: 'Köln', lat: 50.938, lng: 6.960 },
      { name: 'Frankfurt', lat: 50.110, lng: 8.682 },
      { name: 'Stuttgart', lat: 48.775, lng: 9.183 },
      { name: 'Düsseldorf', lat: 51.228, lng: 6.774 },
      { name: 'Leipzig', lat: 51.340, lng: 12.375 },
      { name: 'Dortmund', lat: 51.514, lng: 7.468 },
      { name: 'Nürnberg', lat: 49.452, lng: 11.077 },
    ],
    geocodeUrl: (query) => `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query.trim())}&country=Germany&format=json&limit=1`,
    parseGeocode: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    },
    landRegistryUrl: (lat, lng) => `https://www.grundbuch.de/`,
    landRegistryLabel: (t) => t.landRegistry,
    resources: (t) => ({
      brownfield: [
        { label: 'Bundesinstitut für Bau-, Stadt- und Raumforschung (BBSR)', url: 'https://www.bbsr.bund.de/' },
        { label: 'Berlin Geoportal — Flächennutzung', url: 'https://fbinter.stadt-berlin.de/fb/index.jsp' },
        { label: 'Bayern Geoportal', url: 'https://geoportal.bayern.de/' },
        { label: 'NRW Geoportal', url: 'https://www.geoportal.nrw/' },
        { label: 'Brachflächenrecycling — Umweltbundesamt', url: 'https://www.umweltbundesamt.de/themen/boden-landwirtschaft/flaechensparen-boeden-landschaften-erhalten/brachflaechen' },
      ],
      pitchStrategies: [
        { label: 'Deutscher Tennis Bund (DTB)', url: 'https://www.dtb-tennis.de/' },
        { label: 'Deutscher Padel Verband', url: 'https://www.padelverband.de/' },
        { label: 'DOSB Sportstättenstatistik', url: 'https://www.dosb.de/' },
      ],
      planningPortals: [
        { label: 'Berlin — Bauaufsicht Online', url: 'https://www.berlin.de/ba-mitte/politik-und-verwaltung/aemter/stadtentwicklungsamt/bauaufsicht/' },
        { label: 'München — Lokalbaukommission', url: 'https://www.muenchen.de/rathaus/Stadtverwaltung/Referat-fuer-Stadtplanung-und-Bauordnung/Lokalbaukommission.html' },
        { label: 'Hamburg — Bauportal', url: 'https://www.hamburg.de/bsw/bauportal/' },
        { label: 'Frankfurt — Bauaufsicht', url: 'https://frankfurt.de/service-und-rathaus/verwaltung/aemter-und-institutionen/bauaufsicht' },
        { label: 'NRW — BauPortal.NRW', url: 'https://www.bauportal.nrw/' },
      ],
      tools: [
        { label: '🏠 Grundbuch Online', url: 'https://www.grundbuch.de/' },
        { label: '📊 BKG Geoportal — Bundesamt für Kartographie', url: 'https://www.bkg.bund.de/' },
        { label: '🎾 Padel Courts Deutschland', url: 'https://www.padelcourts.de/' },
        { label: '🌍 Google Earth Pro (kostenlos)', url: 'https://www.google.com/earth/versions/#earth-pro' },
        { label: '🗺️ BayernAtlas', url: 'https://geoportal.bayern.de/bayernatlas/' },
        { label: '💶 Boris — Bodenrichtwerte', url: 'https://www.boris.nrw.de/' },
      ],
    }),
  },
  HU: {
    id: 'HU',
    flag: '🇭🇺',
    name: 'Magyarország',
    center: { lat: 47.497, lng: 19.040 },
    zoom: 12,
    quickLocations: [
      { name: 'Budapest', lat: 47.497, lng: 19.040 },
      { name: 'Debrecen', lat: 47.531, lng: 21.626 },
      { name: 'Szeged', lat: 46.253, lng: 20.148 },
      { name: 'Miskolc', lat: 48.103, lng: 20.778 },
      { name: 'Pécs', lat: 46.073, lng: 18.233 },
      { name: 'Győr', lat: 47.687, lng: 17.634 },
      { name: 'Nyíregyháza', lat: 47.955, lng: 21.717 },
      { name: 'Kecskemét', lat: 46.906, lng: 19.691 },
      { name: 'Székesfehérvár', lat: 47.186, lng: 18.422 },
      { name: 'Szombathely', lat: 47.231, lng: 16.622 },
    ],
    geocodeUrl: (query) => `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query.trim())}&country=Hungary&format=json&limit=1`,
    parseGeocode: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    },
    landRegistryUrl: (lat, lng) => `https://www.foldhivatal.hu/`,
    landRegistryLabel: (t) => t.landRegistry,
    resources: (t) => ({
      brownfield: [
        { label: 'Lechner Tudásközpont — Területi tervezés', url: 'https://lfrfrftechner.hu/' },
        { label: 'Budapest Főváros Kormányhivatala — Építésügy', url: 'https://www.kormanyhivatal.hu/hu/budapest' },
        { label: 'e-Közmű — Közmű nyilvántartás', url: 'https://e-kozmu.hu/' },
        { label: 'Országos Területrendezési Terv', url: 'https://www.oeny.hu/' },
        { label: 'Nemzeti Fejlesztési Terv', url: 'https://www.palyazat.gov.hu/' },
      ],
      pitchStrategies: [
        { label: 'Magyar Padel Szövetség', url: 'https://www.magyarpadel.hu/' },
        { label: 'Magyar Tenisz Szövetség', url: 'https://www.huntennis.hu/' },
        { label: 'Magyar Olimpiai Bizottság — Sportlétesítmények', url: 'https://www.mob.hu/' },
      ],
      planningPortals: [
        { label: 'Budapest — Építésügyi Portál', url: 'https://epito.bm.hu/' },
        { label: 'e-Építés — Elektronikus építési napló', url: 'https://www.e-epites.hu/' },
        { label: 'Lechner Tudásközpont — Településrendezés', url: 'https://www.oeny.hu/' },
        { label: 'Debrecen — Önkormányzat', url: 'https://www.debrecen.hu/' },
        { label: 'Szeged — Városüzemeltetés', url: 'https://www.szeged.hu/' },
      ],
      tools: [
        { label: '🏠 Földhivatal Online — Tulajdoni lap', url: 'https://www.foldhivatal.hu/' },
        { label: '📊 Központi Statisztikai Hivatal', url: 'https://www.ksh.hu/' },
        { label: '🎾 Magyar Padel', url: 'https://www.magyarpadel.hu/' },
        { label: '🌍 Google Earth Pro (ingyenes)', url: 'https://www.google.com/earth/versions/#earth-pro' },
        { label: '🗺️ Lechner Térkép', url: 'https://terkep.budapest.hu/' },
        { label: '💰 Ingatlan.com — Telkek', url: 'https://www.ingatlan.com/' },
      ],
    }),
  },
};

const SITE_TYPES = [
  {
    id: 'tennis',
    labelKey: 'tennisCourts',
    emoji: '🎾',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["leisure"="pitch"]["sport"="tennis"](around:${r},${lat},${lng});relation["leisure"="pitch"]["sport"="tennis"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 0,
  },
  {
    id: 'car_park',
    labelKey: 'surfaceCarParks',
    emoji: '🅿️',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["amenity"="parking"]["parking"="surface"](around:${r},${lat},${lng});way["amenity"="parking"]["parking"!="multi-storey"]["parking"!="underground"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 0,
  },
  {
    id: 'disused',
    labelKey: 'disusedLand',
    emoji: '🏚️',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["disused:leisure"](around:${r},${lat},${lng});way["disused:amenity"](around:${r},${lat},${lng});way["abandoned:leisure"](around:${r},${lat},${lng});way["abandoned:amenity"](around:${r},${lat},${lng});way["landuse"="brownfield"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 0,
  },
  {
    id: 'muga',
    labelKey: 'multiSportCourts',
    emoji: '🏐',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["leisure"="pitch"]["sport"="multi"](around:${r},${lat},${lng});way["leisure"="pitch"]["sport"~"basketball|netball|volleyball"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 0,
  },
  {
    id: 'church',
    labelKey: 'churches',
    emoji: '⛪',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 0,
  },
  {
    id: 'school',
    labelKey: 'schools',
    emoji: '🏫',
    query: (lat, lng, r) =>
      `[out:json][timeout:30];(way["amenity"="school"](around:${r},${lat},${lng}););out center body;`,
    baseScore: 0,
  },
  {
    id: 'padel_club',
    labelKey: 'padelClubs',
    emoji: '🏸',
    // Padel clubs are sparse — always search a wide area (min 15km)
    query: (lat, lng, r) => {
      const padelRadius = Math.max(r, 15000);
      return `[out:json][timeout:30];(way["sport"="padel"](around:${padelRadius},${lat},${lng});node["sport"="padel"](around:${padelRadius},${lat},${lng});relation["sport"="padel"](around:${padelRadius},${lat},${lng}););out center body;`;
    },
    baseScore: 0,
  },
];

// Status keys for translation lookup
const STATUS_KEYS = {
  'new': 'new',
  'satellite checked': 'satelliteChecked',
  'owner found': 'ownerFound',
  'contacted': 'contacted',
  'replied': 'replied',
  'viewing': 'viewing',
  'negotiating': 'negotiating',
  'secured': 'secured',
  'dead': 'dead',
};

// Helper to get translated label for a site type
function getSiteTypeLabel(siteType, t) {
  return t[siteType.labelKey] || siteType.labelKey;
}

// Helper to get translated status
function getStatusLabel(status, t) {
  const key = STATUS_KEYS[status];
  return key ? (t[key] || status) : status;
}

const STATUSES = [
  'new',
  'satellite checked',
  'owner found',
  'contacted',
  'replied',
  'viewing',
  'negotiating',
  'secured',
  'dead',
];

const STATUS_COLORS = {
  new: '#3b82f6',
  'satellite checked': '#8b5cf6',
  'owner found': '#f59e0b',
  contacted: '#f97316',
  replied: '#10b981',
  viewing: '#06b6d4',
  negotiating: '#ec4899',
  secured: '#22c55e',
  dead: '#6b7280',
};

function scoreSite(element, siteType) {
  let score = 0;
  const tags = element.tags || {};
  const reasons = [];
  let approxArea = null;

  // Specialized scoring for existing padel clubs (competitive analysis)
  if (siteType.id === 'padel_club') {
    const courtCount = tags._courtCount || 1;
    
    // Base: existing club is a proven viable location
    score = 40;
    reasons.push('40 Existing club (proven location)');
    
    // Court count is the strongest signal of demand
    if (courtCount >= 6) {
      score += 25;
      reasons.push(`25 Major facility (${courtCount} courts)`);
    } else if (courtCount >= 4) {
      score += 20;
      reasons.push(`20 Large club (${courtCount} courts)`);
    } else if (courtCount >= 2) {
      score += 12;
      reasons.push(`12 Multi-court club (${courtCount} courts)`);
    } else {
      score += 5;
      reasons.push('5 Single court');
    }
    
    // Facility quality
    if (tags.leisure === 'sports_centre') {
      score += 8;
      reasons.push('8 Professional sports centre');
    }
    
    // Floodlighting = extended hours = more revenue
    if (tags.lit === 'yes' || tags.floodlit === 'yes' || tags.lighting === 'yes') {
      score += 7;
      reasons.push('7 Floodlit (extended hours)');
    }
    
    // Has a website = established business
    if (tags.website || tags['contact:website']) {
      score += 5;
      reasons.push('5 Established business (has website)');
    }
    
    // Customer access confirmed
    if (tags.access === 'customers' || tags.access === 'public') {
      score += 3;
      reasons.push('3 Public/customer access');
    }
    
    approxArea = courtCount * 200;
    
    return { score: Math.max(0, Math.min(100, score)), reasons, approxArea };
  }
  
  // SCORING FOR POTENTIAL DEVELOPMENT SITES
  // All sites start at 0 and earn points based on development potential
  
  // 1. SIZE AND AREA (40 points max) - Most critical factor
  if (element.bounds) {
    const latDiff = Math.abs(element.bounds.maxlat - element.bounds.minlat);
    const lngDiff = Math.abs(element.bounds.maxlon - element.bounds.minlon);
    approxArea = Math.round(latDiff * 111000 * (lngDiff * 111000 * Math.cos((element.center?.lat || 51.4) * Math.PI / 180)));
    
    if (approxArea >= 600 && approxArea <= 2500) {
      score += 40;
      reasons.push('40 Ideal size: 600-2500m² (3-4 courts)');
    } else if (approxArea >= 400 && approxArea <= 4000) {
      score += 30;
      reasons.push('30 Good size: 400-4000m² (2-5 courts)');
    } else if (approxArea >= 300 && approxArea <= 6000) {
      score += 20;
      reasons.push('20 Usable size: 300-6000m²');
    } else if (approxArea > 10000) {
      score -= 10;
      reasons.push('-10 Too large (>10,000m²)');
    } else if (approxArea < 300) {
      score -= 20;
      reasons.push('-20 Too small (<300m²)');
    }
  }

  // 2. SITE TYPE SUITABILITY (25 points max)
  if (siteType.id === 'disused') {
    score += 25;
    reasons.push('25 Disused land (ready for redevelopment)');
  } else if (siteType.id === 'car_park') {
    score += 20;
    reasons.push('20 Surface car park (flat, clear)');
  } else if (siteType.id === 'tennis') {
    score += 18;
    reasons.push('18 Tennis court (similar sports use)');
  } else if (siteType.id === 'muga') {
    score += 15;
    reasons.push('15 Multi-sport court (sports facility)');
  } else if (siteType.id === 'school') {
    score += 10;
    reasons.push('10 School grounds (community use)');
  } else if (siteType.id === 'church') {
    score += 8;
    reasons.push('8 Church grounds (community access)');
  }

  // 3. SURFACE QUALITY (15 points max)
  const surface = (tags.surface || '').toLowerCase();
  if (surface.includes('asphalt') || surface.includes('concrete') || surface.includes('tarmac')) {
    score += 15;
    reasons.push('15 Hard surface (ready for courts)');
  } else if (surface.includes('artificial') || surface.includes('turf')) {
    score += 12;
    reasons.push('12 Artificial surface (sports-ready)');
  } else if (surface.includes('gravel') || surface.includes('compacted')) {
    score += 8;
    reasons.push('8 Compacted surface (needs preparation)');
  } else if (surface.includes('grass') || surface.includes('soil')) {
    score += 5;
    reasons.push('5 Soft surface (needs groundwork)');
  }

  // 4. ACCESS AND INFRASTRUCTURE (15 points max)
  const access = (tags.access || '').toLowerCase();
  if (access === 'public' || access === 'customers') {
    score += 10;
    reasons.push('10 Public access');
  } else if (access === 'private') {
    score -= 5;
    reasons.push('-5 Private access (permission needed)');
  } else if (access === 'no') {
    score -= 15;
    reasons.push('-15 No access');
  }

  // Parking availability
  if (tags.parking || tags.amenity === 'parking') {
    score += 5;
    reasons.push('5 Parking available');
  }

  // 5. EXISTING INFRASTRUCTURE (10 points max)
  // Lighting (extends playing hours, increases revenue)
  if (tags.lit === 'yes' || tags.floodlit === 'yes' || tags.lighting === 'yes') {
    score += 8;
    reasons.push('8 Existing lighting');
  }

  // Buildings/structures (can be repurposed)
  if (tags.building || tags.amenity === 'building') {
    score += 5;
    reasons.push('5 Existing structures');
  }

  // 6. LOCATION FACTORS (10 points max)
  // Near existing sports facilities (sports cluster effect)
  // Note: This would require additional spatial queries, simplified for now
  
  // Urban vs rural (based on landuse)
  if (tags.landuse === 'commercial' || tags.landuse === 'industrial' || tags.landuse === 'retail') {
    score += 5;
    reasons.push('5 Commercial/industrial zone');
  } else if (tags.landuse === 'residential') {
    score += 3;
    reasons.push('3 Residential area');
  }

  return { score: Math.max(0, Math.min(100, score)), reasons, approxArea };
}

function getScoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  if (score >= 40) return '#ea580c';
  return '#dc2626';
}

function getStorageItem(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

function createMarkerIcon(score, emoji) {
  const color = getScoreColor(score);
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:white;
      border-radius:50%;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:bold;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      cursor:pointer;
    ">${score}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function createSavedMarkerIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#7c3aed;
      color:white;
      border-radius:50%;
      width:28px;height:28px;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;
      border:2px solid #fbbf24;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      cursor:pointer;
    ">★</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export default function PadelScout() {
  const [country, setCountry] = useState('UK');
  const [language, setLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState('search');
  const [selectedTypes, setSelectedTypes] = useState(['tennis', 'car_park', 'disused', 'muga', 'padel_club']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedSites, setSavedSites] = useState([]);
  const [expandedSite, setExpandedSite] = useState(null);
  const [searchProgress, setSearchProgress] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [minScore, setMinScore] = useState(0);
  const [postcode, setPostcode] = useState('');
  const [searchCenter, setSearchCenter] = useState({ lat: 51.411, lng: -0.834 });
  const [searchRadius, setSearchRadius] = useState(3000);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highlightedSite, setHighlightedSite] = useState(null);
  const [sidebarView, setSidebarView] = useState('controls');
  const [dismissedSites, setDismissedSites] = useState(new Set());
  const [showExistingPadelClubs, setShowExistingPadelClubs] = useState(true);
  const [showScoreGuide, setShowScoreGuide] = useState(false);

  // Translation and country config helpers
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const countryConfig = COUNTRY_CONFIGS[country];
  const quickLocations = countryConfig.quickLocations;

  // Switch country handler — fly map to new country center and reset results
  const switchCountry = useCallback((newCountry) => {
    const cfg = COUNTRY_CONFIGS[newCountry];
    setCountry(newCountry);
    setSearchCenter({ lat: cfg.center.lat, lng: cfg.center.lng });
    setResults([]);
    setDismissedSites(new Set());
    setPostcode('');
    const map = mapInstanceRef.current;
    if (map) map.flyTo([cfg.center.lat, cfg.center.lng], cfg.zoom, { duration: 1.2 });
  }, []);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const savedMarkersLayerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const centerMarkerRef = useRef(null);

  // Load saved sites from localStorage on mount
  useEffect(() => {
    const saved = getStorageItem('padel-scout-sites');
    if (saved) setSavedSites(saved);
  }, []);

  // Persist saved sites to localStorage
  useEffect(() => {
    setStorageItem('padel-scout-sites', savedSites);
  }, [savedSites]);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [searchCenter.lat, searchCenter.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri', maxZoom: 19 }
    );

    const baseMaps = { 'Street Map': map._layers[Object.keys(map._layers)[0]], 'Satellite': satellite };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    savedMarkersLayerRef.current = L.layerGroup().addTo(map);

    // Click on map to set search center
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setSearchCenter({ lat, lng });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update radius circle and center marker when searchCenter or searchRadius changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current);
    if (centerMarkerRef.current) map.removeLayer(centerMarkerRef.current);

    radiusCircleRef.current = L.circle([searchCenter.lat, searchCenter.lng], {
      radius: searchRadius,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '8 4',
    }).addTo(map);

    centerMarkerRef.current = L.marker([searchCenter.lat, searchCenter.lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width:16px;height:16px;
          background:#3b82f6;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(59,130,246,0.5);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    }).addTo(map);

    centerMarkerRef.current.bindPopup(
      `<div style="font-size:12px;text-align:center;">
        <strong>${t.searchCentre}</strong><br/>
        ${searchCenter.lat.toFixed(5)}, ${searchCenter.lng.toFixed(5)}<br/>
        <em>${t.radius}: ${(searchRadius / 1000).toFixed(1)}km</em>
      </div>`
    );
  }, [searchCenter, searchRadius, t]);

  // Update result markers on map
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const filtered = results.filter((r) => r.score >= minScore);
    const sorted = [...filtered];
    if (sortBy === 'score') sorted.sort((a, b) => b.score - a.score);
    else if (sortBy === 'type') sorted.sort((a, b) => getSiteTypeLabel(a.siteType, t).localeCompare(getSiteTypeLabel(b.siteType, t)));

    sorted.forEach((site) => {
      const isSaved = savedSites.some((s) => s.id === site.id);
      const siteCountryCfg = COUNTRY_CONFIGS[site.country || country] || countryConfig;
      const marker = L.marker([site.lat, site.lng], {
        icon: createMarkerIcon(site.score, site.siteType.emoji),
      });

      // Enhanced popup for padel clubs
      const siteCountryId = site.country || country;
      const popupHtml = site.siteType.id === 'padel_club' ? `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:260px;max-width:320px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:18px;">${site.siteType.emoji}</span>
            <strong style="font-size:13px;flex:1;">${site.name}</strong>
            <span style="background:${getScoreColor(site.score)};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;">${site.score}/100</span>
          </div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px;">${getSiteTypeLabel(site.siteType, t)} &middot; ${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</div>
          ${site.courtCount ? `<div style="font-size:12px;font-weight:600;color:#7c3aed;margin-bottom:6px;background:#f3e8ff;padding:4px 8px;border-radius:4px;display:inline-block;">🏸 ${site.courtCount} ${site.courtCount === 1 ? 'court' : 'courts'}</div>` : ''}
          ${site.reasons && site.reasons.length > 0 ? `<div style="font-size:9px;color:#94a3b8;margin-bottom:6px;">${site.reasons.join(' · ')}</div>` : ''}
          
          <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:4px;">${t.bookingPlatforms}:</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            ${(() => {
              const clubName = encodeURIComponent(site.name);
              const bookingLinks = [];
              bookingLinks.push(`<a href="https://playtomic.io/search?q=${clubName}" target="_blank" style="font-size:10px;color:#3b82f6;text-decoration:none;">📱 Playtomic</a>`);
              if (siteCountryId === 'UK') {
                bookingLinks.push(`<a href="https://matchi.net/search?q=${clubName}" target="_blank" style="font-size:10px;color:#3b82f6;text-decoration:none;">� Matchi</a>`);
              } else if (siteCountryId === 'DE') {
                bookingLinks.push(`<a href="https://www.padelfy.com/" target="_blank" style="font-size:10px;color:#3b82f6;text-decoration:none;">🇩🇪 Padelfy</a>`);
              } else if (siteCountryId === 'HU') {
                bookingLinks.push(`<a href="https://www.magyarpadel.hu/" target="_blank" style="font-size:10px;color:#3b82f6;text-decoration:none;">🇭🇺 Magyar Padel</a>`);
              }
              return bookingLinks.join('');
            })()}
          </div>
          
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <a href="https://www.google.com/maps/search/padel/@${site.lat},${site.lng},15z" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">📍 Google Maps</a>
            <a href="https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.satellite}</a>
            <a href="https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.streetView}</a>
          </div>
          <button onclick="window.__padelSaveSite__('${site.id}')" style="
            width:100%;padding:6px;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;
            background:${isSaved ? '#d1d5db' : '#22c55e'};color:white;
          " ${isSaved ? 'disabled' : ''}>${isSaved ? t.savedToPipeline : t.saveToPipeline}</button>
        </div>
      ` : `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:240px;max-width:300px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:18px;">${site.siteType.emoji}</span>
            <strong style="font-size:13px;flex:1;">${site.name}</strong>
            <span style="background:${getScoreColor(site.score)};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;">${site.score}/100</span>
          </div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">${getSiteTypeLabel(site.siteType, t)} &middot; ${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</div>
          ${Object.keys(site.tags).length > 0 ? `<div style="font-size:10px;color:#9ca3af;margin-bottom:6px;">${Object.entries(site.tags).filter(([k]) => !k.startsWith('addr:') && !k.startsWith('source') && !k.startsWith('_') && k !== 'type').slice(0, 5).map(([k, v]) => `${k}=${v}`).join(' &middot; ')}</div>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <a href="https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.satellite}</a>
            <a href="https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.streetView}</a>
            <a href="https://www.openstreetmap.org/${site.osmType}/${site.osmId}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.osm}</a>
            <a href="${siteCountryCfg.landRegistryUrl(site.lat, site.lng)}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.landRegistry}</a>
          </div>
          ${site.approxArea ? `<div style="font-size:10px;color:#64748b;margin-bottom:6px;">📐 ~${site.approxArea.toLocaleString()}m² ${site.approxArea >= 600 && site.approxArea <= 2500 ? t.idealForCourts : site.approxArea < 600 ? t.mayBeSmall : site.approxArea <= 4000 ? t.workable : t.veryLarge}</div>` : ''}
          ${site.reasons && site.reasons.length > 0 ? `<div style="font-size:9px;color:#94a3b8;margin-bottom:6px;">${site.reasons.join(' · ')}</div>` : ''}
          <button onclick="window.__padelSaveSite__('${site.id}')" style="
            width:100%;padding:6px;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;
            background:${isSaved ? '#d1d5db' : '#22c55e'};color:white;
          " ${isSaved ? 'disabled' : ''}>${isSaved ? t.savedToPipeline : t.saveToPipeline}</button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 320 });

      marker.on('mouseover', () => setHighlightedSite(site.id));
      marker.on('mouseout', () => setHighlightedSite(null));

      layer.addLayer(marker);
    });
  }, [results, minScore, sortBy, savedSites, t, country, countryConfig]);

  // Update saved site markers on pipeline tab
  useEffect(() => {
    const layer = savedMarkersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (activeTab !== 'pipeline') return;

    savedSites.forEach((site) => {
      const siteCountryCfg = COUNTRY_CONFIGS[site.country || country] || countryConfig;
      const marker = L.marker([site.lat, site.lng], {
        icon: createSavedMarkerIcon(),
      });
      marker.bindPopup(
        `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:200px;">
          <strong>${site.siteTypeEmoji || ''} ${site.name}</strong><br/>
          <span style="font-size:11px;color:${STATUS_COLORS[site.status]};font-weight:600;text-transform:uppercase;">${getStatusLabel(site.status, t)}</span><br/>
          <div style="font-size:11px;color:#6b7280;margin:4px 0;">${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <a href="https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.satellite}</a>
            <a href="https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.streetView}</a>
            <a href="https://www.openstreetmap.org/${site.osmType}/${site.osmId}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.osm}</a>
            <a href="${siteCountryCfg.landRegistryUrl(site.lat, site.lng)}" target="_blank" style="font-size:11px;color:#3b82f6;text-decoration:none;">${t.landRegistry}</a>
          </div>
        </div>`
      );
      layer.addLayer(marker);
    });
  }, [savedSites, activeTab, t, country, countryConfig]);

  // Expose save function to popup buttons
  useEffect(() => {
    window.__padelSaveSite__ = (siteId) => {
      const site = results.find((r) => r.id === siteId);
      if (site) saveSite(site);
    };
    return () => { delete window.__padelSaveSite__; };
  }, [results, savedSites]);

  const flyTo = useCallback((lat, lng, zoom) => {
    const map = mapInstanceRef.current;
    if (map) map.flyTo([lat, lng], zoom || 14, { duration: 1 });
    setSearchCenter({ lat, lng });
  }, []);

  const lookupPostcode = useCallback(async () => {
    if (!postcode.trim()) return;
    setError(null);
    try {
      const url = countryConfig.geocodeUrl(postcode);
      const fetchOpts = {};
      // Nominatim requires a User-Agent header
      if (url.includes('nominatim')) {
        fetchOpts.headers = { 'User-Agent': 'PadelScout/1.0' };
      }
      const res = await fetch(url, fetchOpts);
      const data = await res.json();
      const result = countryConfig.parseGeocode(data);
      if (result) {
        flyTo(result.lat, result.lng, 14);
      } else {
        const errorKey = `postcodeNotFound_${country}`;
        setError(t[errorKey] || t.postcodeNotFound_UK);
      }
    } catch {
      setError(t.postcodeFailed);
    }
  }, [postcode, flyTo, countryConfig, country, t]);

  const searchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchProgress(t.startingSearch);
    setSidebarView('results');

    const { lat, lng } = searchCenter;
    const radius = searchRadius;

    const allResults = [];
    const typesToSearch = SITE_TYPES.filter((st) => 
      selectedTypes.includes(st.id) && 
      (st.id !== 'padel_club' || showExistingPadelClubs)
    );

    for (let i = 0; i < typesToSearch.length; i++) {
      const siteType = typesToSearch[i];
      const label = getSiteTypeLabel(siteType, t);
      setSearchProgress(`${t.searching} ${label} (${i + 1}/${typesToSearch.length})...`);

      try {
        const query = siteType.query(lat, lng, radius);
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch ${label}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const elements = data.elements || [];
        
        // DEBUG: Log padel club results
        if (siteType.id === 'padel_club') {
          console.log(`🏸 Padel clubs query returned ${elements.length} elements`);
          console.log('Sample elements:', elements.slice(0, 3));
        }

        // TEMPORARY DEBUG: Show ALL padel courts individually (no clustering)
        if (siteType.id === 'padel_club') {
          console.log(`🏸 SIMPLE MODE: Processing ${elements.length} padel elements WITHOUT clustering`);
          
          elements.forEach((el, idx) => {
            const elLat = el.center?.lat || el.lat;
            const elLng = el.center?.lon || el.lon;
            if (!elLat || !elLng) {
              console.log(`🏸 Skipping element ${idx} - no coordinates`);
              return;
            }

            const name = el.tags?.name || el.tags?.operator || `Padel Court ${idx + 1}`;
            const { score, reasons, approxArea } = scoreSite(el, siteType);
            
            const result = {
              id: `${el.type}-${el.id}`,
              osmId: el.id,
              osmType: el.type,
              lat: elLat,
              lng: elLng,
              tags: el.tags || {},
              siteType: siteType,
              score,
              reasons,
              approxArea: 200,
              country: country,
              courtCount: 1,
              name: name,
            };
            
            console.log(`🏸 Adding padel court ${idx + 1}/${elements.length}: ${name} at (${elLat}, ${elLng}) score=${score}`);
            allResults.push(result);
          });
          
          console.log(`🏸 TOTAL ADDED: ${elements.length} padel courts to allResults`);
        } else {
          elements.forEach((el) => {
            const elLat = el.center?.lat || el.lat;
            const elLng = el.center?.lon || el.lon;
            if (!elLat || !elLng) return;

            const { score, reasons, approxArea } = scoreSite(el, siteType);
            allResults.push({
              id: `${el.type}-${el.id}`,
              osmId: el.id,
              osmType: el.type,
              lat: elLat,
              lng: elLng,
              tags: el.tags || {},
              siteType: siteType,
              score,
              reasons,
              approxArea,
              country: country,
              name:
                el.tags?.name ||
                el.tags?.['disused:name'] ||
                `${label} near ${elLat.toFixed(4)}, ${elLng.toFixed(4)}`,
            });
          });
        }

        // Rate limiting - be nice to Overpass
        if (i < typesToSearch.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch (err) {
        console.warn(`Error searching ${label}:`, err);
      }
    }

    // DEBUG: Log final results
    console.log(`🏸 Final results: ${allResults.length} total, ${allResults.filter(r => r.siteType.id === 'padel_club').length} padel clubs`);
    allResults.filter(r => r.siteType.id === 'padel_club').forEach(r => {
      console.log(`  - ${r.name} (${r.lat}, ${r.lng}) score=${r.score}`);
    });

    setResults(allResults);
    setSearchProgress('');
    setLoading(false);
  }, [searchCenter, searchRadius, selectedTypes, showExistingPadelClubs, t, country]);

  const saveSite = useCallback(
    (site) => {
      if (savedSites.find((s) => s.id === site.id)) return;
      const newSite = {
        ...site,
        status: 'new',
        notes: '',
        savedAt: new Date().toISOString(),
        siteTypeId: site.siteType.id,
        siteTypeLabelKey: site.siteType.labelKey,
        siteTypeEmoji: site.siteType.emoji,
        country: site.country || country,
      };
      setSavedSites((prev) => [...prev, newSite]);
    },
    [savedSites, country]
  );

  const updateSiteStatus = useCallback((siteId, status) => {
    setSavedSites((prev) => prev.map((s) => (s.id === siteId ? { ...s, status } : s)));
  }, []);

  const updateSiteNotes = useCallback((siteId, notes) => {
    setSavedSites((prev) => prev.map((s) => (s.id === siteId ? { ...s, notes } : s)));
  }, []);

  const removeSite = useCallback((siteId) => {
    setSavedSites((prev) => prev.filter((s) => s.id !== siteId));
  }, []);

  const filteredResults = useMemo(() => {
    let filtered = results.filter((r) => r.score >= minScore && !dismissedSites.has(r.id));
    if (sortBy === 'score') filtered.sort((a, b) => b.score - a.score);
    else if (sortBy === 'type') filtered.sort((a, b) => getSiteTypeLabel(a.siteType, t).localeCompare(getSiteTypeLabel(b.siteType, t)));
    return filtered;
  }, [results, sortBy, minScore, dismissedSites, t]);

  const typeCounts = useMemo(() => {
    const counts = {};
    filteredResults.forEach((r) => {
      counts[r.siteType.id] = (counts[r.siteType.id] || 0) + 1;
    });
    return counts;
  }, [filteredResults]);

  const exportPipelineCSV = useCallback(() => {
    if (savedSites.length === 0) return;
    const headers = ['Name','Type','Country','Score','Status','Lat','Lng','Area (m²)','Notes','Satellite','Street View','OSM','Land Registry','Saved At'];
    const rows = savedSites.map((s) => {
      const siteCountryCfg = COUNTRY_CONFIGS[s.country || country] || countryConfig;
      return [
        s.name,
        t[s.siteTypeLabelKey] || s.siteTypeLabelKey || s.siteTypeLabel || '',
        s.country || country,
        s.score,
        s.status,
        s.lat,
        s.lng,
        s.approxArea || '',
        (s.notes || '').replace(/[\n\r,]/g, ' '),
        `https://www.google.com/maps/@${s.lat},${s.lng},200m/data=!3m1!1e3`,
        `https://www.google.com/maps?layer=c&cbll=${s.lat},${s.lng}`,
        `https://www.openstreetmap.org/${s.osmType}/${s.osmId}`,
        siteCountryCfg.landRegistryUrl(s.lat, s.lng),
        s.savedAt || '',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padel-pipeline-${country}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [savedSites, country, countryConfig, t]);

  const pipelineGroups = useMemo(() => {
    const groups = {};
    STATUSES.forEach((s) => (groups[s] = []));
    savedSites.forEach((site) => {
      if (groups[site.status]) groups[site.status].push(site);
    });
    return groups;
  }, [savedSites]);

  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  };

  const btnStyle = {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    fontFamily: font,
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', fontFamily: font, color: '#1f2937' }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? '380px' : '0px',
          minWidth: sidebarOpen ? '380px' : '0px',
          height: '100%',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s, min-width 0.2s',
        }}
      >
        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{countryConfig.flag} {t.appTitle}</h1>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>{t.appSubtitle}</span>
          </div>
          {/* Country & Language selectors */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{t.selectCountry}:</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {Object.values(COUNTRY_CONFIGS).map((cfg) => (
                  <button
                    key={cfg.id}
                    onClick={() => switchCountry(cfg.id)}
                    style={{
                      ...btnStyle,
                      padding: '3px 8px',
                      fontSize: '12px',
                      background: country === cfg.id ? '#3b82f6' : '#e2e8f0',
                      color: country === cfg.id ? 'white' : '#475569',
                      borderRadius: '4px',
                    }}
                  >
                    {cfg.flag} {cfg.id}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{t.language}:</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[
                  { code: 'en', label: 'EN' },
                  { code: 'de', label: 'DE' },
                  { code: 'hu', label: 'HU' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      ...btnStyle,
                      padding: '3px 6px',
                      fontSize: '10px',
                      background: language === lang.code ? '#1e293b' : '#f1f5f9',
                      color: language === lang.code ? 'white' : '#475569',
                      borderRadius: '4px',
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          {[
            { id: 'search', label: t.searchTab, count: null },
            { id: 'pipeline', label: t.pipelineTab, count: savedSites.length },
            { id: 'resources', label: t.resourcesTab, count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                fontFamily: font,
              }}
            >
              {tab.label}{tab.count !== null ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* Sidebar content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {activeTab === 'search' && (
            <>
              {/* Postcode search */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.searchLocation}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder={t[`enterPostcode_${country}`] || t.enterPostcode_UK}
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookupPostcode()}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '13px',
                      fontFamily: font,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={lookupPostcode}
                    style={{ ...btnStyle, background: '#3b82f6', color: 'white', padding: '8px 14px', fontSize: '13px' }}
                  >
                    {t.go}
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                  {t.clickMapHint}
                </div>
              </div>

              {/* Quick locations */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.quickJump}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickLocations.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => flyTo(loc.lat, loc.lng, 14)}
                      style={{
                        ...btnStyle,
                        background: Math.abs(searchCenter.lat - loc.lat) < 0.01 && Math.abs(searchCenter.lng - loc.lng) < 0.01
                          ? '#3b82f6' : '#e2e8f0',
                        color: Math.abs(searchCenter.lat - loc.lat) < 0.01 && Math.abs(searchCenter.lng - loc.lng) < 0.01
                          ? 'white' : '#475569',
                        padding: '4px 8px',
                        fontSize: '11px',
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t.searchRadius}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    {(searchRadius / 1000).toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={15000}
                  step={500}
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                  <span>0.5km</span><span>15km</span>
                </div>
              </div>

              {/* Site types */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.siteTypes}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {SITE_TYPES.map((type) => (
                    <label
                      key={type.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: selectedTypes.includes(type.id) ? '#eff6ff' : 'transparent',
                        fontSize: '12px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.id)}
                        onChange={() =>
                          setSelectedTypes((prev) =>
                            prev.includes(type.id) ? prev.filter((v) => v !== type.id) : [...prev, type.id]
                          )
                        }
                        style={{ accentColor: '#3b82f6' }}
                      />
                      <span>{type.emoji}</span>
                      <span style={{ flex: 1 }}>{getSiteTypeLabel(type, t)}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>base: {type.baseScore}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Existing Padel Clubs Toggle */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                    🏸 {t.showExistingPadelClubs}
                  </div>
                  <button
                    onClick={() => setShowExistingPadelClubs(!showExistingPadelClubs)}
                    style={{
                      ...btnStyle,
                      padding: '4px 12px',
                      fontSize: '11px',
                      background: showExistingPadelClubs ? '#22c55e' : '#e5e7eb',
                      color: showExistingPadelClubs ? 'white' : '#6b7280',
                      borderRadius: '12px',
                      fontWeight: '500',
                    }}
                  >
                    {showExistingPadelClubs ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                  {showExistingPadelClubs ? t.showingExistingClubs : t.hidingExistingClubs}
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={searchSites}
                disabled={loading || selectedTypes.length === 0}
                style={{
                  ...btnStyle,
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  borderRadius: '8px',
                }}
              >
                {loading ? `⏳ ${searchProgress}` : `🔍 ${t.searchArea} (${(searchRadius / 1000).toFixed(1)}km)`}
              </button>

              {/* Coordinates display */}
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                {t.centre}: {searchCenter.lat.toFixed(5)}, {searchCenter.lng.toFixed(5)}
              </div>

              {error && (
                <div style={{ ...cardStyle, background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626', fontSize: '12px' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Results */}
              {(sidebarView === 'results' || results.length > 0) && (
                <>
                  {results.length > 0 && (
                    <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                        {filteredResults.length} {t.sitesFound}
                      </span>
                      {dismissedSites.size > 0 && (
                        <button
                          onClick={() => setDismissedSites(new Set())}
                          style={{ ...btnStyle, background: '#fef3c7', color: '#92400e', fontSize: '10px', padding: '2px 8px' }}
                        >
                          {t.showDismissed} ({dismissedSites.size})
                        </button>
                      )}
                    </div>
                    {Object.keys(typeCounts).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {SITE_TYPES.filter(st => typeCounts[st.id]).map(st => (
                          <span key={st.id} style={{ fontSize: '10px', background: '#f1f5f9', padding: '1px 6px', borderRadius: '8px', color: '#475569' }}>
                            {st.emoji} {typeCounts[st.id]}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '11px', fontFamily: font }}
                        >
                          <option value="score">{t.byScore}</option>
                          <option value="type">{t.byType}</option>
                        </select>
                        <select
                          value={minScore}
                          onChange={(e) => setMinScore(parseInt(e.target.value))}
                          style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '11px', fontFamily: font }}
                        >
                          <option value={0}>{t.all}</option>
                          <option value={40}>40+</option>
                          <option value={60}>60+</option>
                          <option value={80}>80+</option>
                        </select>
                      </div>
                    </div>
                    </>
                  )}

                  {filteredResults.map((site) => {
                    const isSaved = savedSites.some((s) => s.id === site.id);
                    const isHighlighted = highlightedSite === site.id;
                    return (
                      <div
                        key={site.id}
                        style={{
                          ...cardStyle,
                          borderColor: isHighlighted ? '#3b82f6' : '#e5e7eb',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                        onClick={() => {
                          const map = mapInstanceRef.current;
                          if (map) map.flyTo([site.lat, site.lng], 17, { duration: 0.5 });
                        }}
                        onMouseEnter={() => setHighlightedSite(site.id)}
                        onMouseLeave={() => setHighlightedSite(null)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '14px' }}>{site.siteType.emoji}</span>
                              <span style={{ fontWeight: '600', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name}</span>
                              <span style={{
                                display: 'inline-block', padding: '1px 6px', borderRadius: '10px',
                                backgroundColor: getScoreColor(site.score), color: 'white', fontSize: '10px', fontWeight: 'bold', flexShrink: 0,
                              }}>{site.score}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>
                              {getSiteTypeLabel(site.siteType, t)} &middot; {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                              {site.approxArea ? ` · ~${site.approxArea.toLocaleString()}m²` : ''}
                            </div>
                            {site.reasons && site.reasons.length > 0 && (
                              <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px' }}>
                                {site.reasons.join(' · ')}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <a href={`https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📡 Sat</a>
                              <a href={`https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🚶 SV</a>
                              <a href={`https://www.openstreetmap.org/${site.osmType}/${site.osmId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🗺️ OSM</a>
                              <a href={(COUNTRY_CONFIGS[site.country || country] || countryConfig).landRegistryUrl(site.lat, site.lng)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📋 LR</a>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0, marginLeft: '6px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); saveSite(site); }}
                              disabled={isSaved}
                              style={{
                                ...btnStyle,
                                background: isSaved ? '#d1d5db' : '#22c55e',
                                color: 'white',
                                fontSize: '10px',
                                padding: '4px 8px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isSaved ? '✓' : '💾'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDismissedSites(prev => new Set([...prev, site.id])); }}
                              title="Dismiss this result"
                              style={{
                                ...btnStyle,
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                fontSize: '10px',
                                padding: '4px 8px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {activeTab === 'pipeline' && (
            <>
              {/* Pipeline summary */}
              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.pipelineFunnel}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {STATUSES.map((status) => (
                    <div
                      key={status}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: STATUS_COLORS[status] + '18',
                        border: `1px solid ${STATUS_COLORS[status]}30`,
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ fontWeight: '700', color: STATUS_COLORS[status] }}>
                        {pipelineGroups[status].length}
                      </span>{' '}
                      <span style={{ color: '#64748b' }}>{getStatusLabel(status, t)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {savedSites.length > 0 && (
                <button
                  onClick={exportPipelineCSV}
                  style={{ ...btnStyle, width: '100%', background: '#1e293b', color: 'white', padding: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '8px', borderRadius: '6px' }}
                >
                  {t.exportCSV}
                </button>
              )}

              {savedSites.length === 0 && (
                <div style={{ ...cardStyle, textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  {t.noSavedSites}
                </div>
              )}

              {STATUSES.map(
                (status) =>
                  pipelineGroups[status].length > 0 && (
                    <div key={status}>
                      <div style={{
                        fontSize: '11px', fontWeight: '700', color: STATUS_COLORS[status],
                        margin: '12px 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {getStatusLabel(status, t)} ({pipelineGroups[status].length})
                      </div>
                      {pipelineGroups[status].map((site) => {
                        const siteCountryCfg = COUNTRY_CONFIGS[site.country || country] || countryConfig;
                        return (
                        <div key={site.id} style={cardStyle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div
                              style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                              onClick={() => {
                                const map = mapInstanceRef.current;
                                if (map) map.flyTo([site.lat, site.lng], 17, { duration: 0.5 });
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '14px' }}>{site.siteTypeEmoji}</span>
                                <span style={{ fontWeight: '600', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name}</span>
                                <span style={{
                                  display: 'inline-block', padding: '1px 6px', borderRadius: '10px',
                                  backgroundColor: getScoreColor(site.score), color: 'white', fontSize: '10px', fontWeight: 'bold', flexShrink: 0,
                                }}>{site.score}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '3px' }}>
                                {t[site.siteTypeLabelKey] || site.siteTypeLabelKey || site.siteTypeLabel || ''} &middot; {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <a href={`https://www.google.com/maps/@${site.lat},${site.lng},200m/data=!3m1!1e3`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📡 Sat</a>
                                <a href={`https://www.google.com/maps?layer=c&cbll=${site.lat},${site.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🚶 SV</a>
                                <a href={`https://www.openstreetmap.org/${site.osmType}/${site.osmId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>🗺️ OSM</a>
                                <a href={siteCountryCfg.landRegistryUrl(site.lat, site.lng)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>📋 LR</a>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedSite(expandedSite === site.id ? null : site.id)}
                              style={{ ...btnStyle, background: '#f1f5f9', color: '#475569', padding: '4px 8px', fontSize: '11px', flexShrink: 0, marginLeft: '6px' }}
                            >
                              {expandedSite === site.id ? '▲' : '▼'}
                            </button>
                          </div>

                          {expandedSite === site.id && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                              <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '3px' }}>{t.status}</label>
                                <select
                                  value={site.status}
                                  onChange={(e) => updateSiteStatus(site.id, e.target.value)}
                                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', width: '100%', fontFamily: font }}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>{getStatusLabel(s, t)}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ marginBottom: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '3px' }}>{t.notes}</label>
                                <textarea
                                  value={site.notes}
                                  onChange={(e) => updateSiteNotes(site.id, e.target.value)}
                                  placeholder={t.notesPlaceholder}
                                  style={{
                                    width: '100%', minHeight: '60px', padding: '6px', borderRadius: '4px',
                                    border: '1px solid #d1d5db', fontSize: '12px', fontFamily: font, resize: 'vertical', boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => removeSite(site.id)}
                                style={{ ...btnStyle, background: '#fee2e2', color: '#dc2626', fontSize: '11px' }}
                              >
                                {t.remove}
                              </button>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )
              )}
            </>
          )}

          {activeTab === 'resources' && (
            <>
              {(() => {
                const res = countryConfig.resources(t);
                return (
                  <>
                    <div style={cardStyle}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.brownfieldRegisters}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {res.brownfield.map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>{r.label}</a>
                        ))}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.playingPitchStrategies}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {res.pitchStrategies.map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>{r.label}</a>
                        ))}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.planningPortals}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {res.planningPortals.map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>{r.label}</a>
                        ))}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.keyTools}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {res.tools.map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>{r.label}</a>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              <div style={cardStyle}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.padelReference}
                </div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>
                  <div><strong>{t.singleCourt}</strong> {t.singleCourtDesc}</div>
                  <div><strong>{t.threeCourts}</strong> {t.threeCourtsDesc}</div>
                  <div><strong>{t.sweetSpot}</strong> {t.sweetSpotDesc}</div>
                  <div><strong>{t.surface}</strong> {t.surfaceDesc}</div>
                  <div><strong>{t.height}</strong> {t.heightDesc}</div>
                  <div><strong>{t.access}</strong> {t.accessDesc}</div>
                  <div><strong>{t.planning}</strong> {t[`planningDesc_${country}`] || t.planningDesc_UK}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'absolute',
          left: sidebarOpen ? '380px' : '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          width: '24px',
          height: '48px',
          border: 'none',
          borderRadius: '0 6px 6px 0',
          background: 'white',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#64748b',
          transition: 'left 0.2s',
          fontFamily: font,
        }}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, height: '100%' }} />

      {/* Score legend overlay — expandable */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '12px',
        zIndex: 1000,
        background: 'white',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        fontSize: '11px',
        color: '#475569',
        maxWidth: '320px',
        cursor: 'default',
      }}>
        <div
          style={{ fontWeight: '700', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowScoreGuide(!showScoreGuide)}
        >
          <span>{t.scoreLegend} (0–100)</span>
          <span style={{ fontSize: '14px', lineHeight: 1 }}>{showScoreGuide ? '▾' : '▸'}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: showScoreGuide ? '8px' : 0 }}>
          {[
            { label: '80–100', color: '#16a34a', meaning: t.scoreExcellent },
            { label: '60–79', color: '#d97706', meaning: t.scoreGood },
            { label: '40–59', color: '#ea580c', meaning: t.scoreFair },
            { label: '0–39', color: '#dc2626', meaning: t.scorePoor },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontWeight: '600' }}>{s.label}</span>
            </div>
          ))}
        </div>
        {showScoreGuide && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', fontSize: '10px', lineHeight: '1.6', color: '#374151' }}>
            <div style={{ marginBottom: '6px' }}>
              {[
                { label: '80–100', color: '#16a34a', meaning: t.scoreExcellent },
                { label: '60–79', color: '#d97706', meaning: t.scoreGood },
                { label: '40–59', color: '#ea580c', meaning: t.scoreFair },
                { label: '0–39', color: '#dc2626', meaning: t.scorePoor },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span><strong>{s.label}:</strong> {s.meaning}</span>
                </div>
              ))}
            </div>
            <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}>{t.scoreBreakdownTitle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1px 8px', fontSize: '10px' }}>
              <span style={{ fontWeight: '600' }}>40 pts</span><span>{t.scoreSize}</span>
              <span style={{ fontWeight: '600' }}>25 pts</span><span>{t.scoreSiteType}</span>
              <span style={{ fontWeight: '600' }}>15 pts</span><span>{t.scoreSurface}</span>
              <span style={{ fontWeight: '600' }}>15 pts</span><span>{t.scoreAccess}</span>
              <span style={{ fontWeight: '600' }}>10 pts</span><span>{t.scoreInfra}</span>
              <span style={{ fontWeight: '600' }}>10 pts</span><span>{t.scoreLocation}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
