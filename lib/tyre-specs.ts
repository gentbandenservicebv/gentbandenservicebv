// OEM / Manufacturer Homologation Markings
export const OE_MARKINGS = [
  { code: "", label: "Geen / Standaard (Universeel)" },
  { code: "*", label: "* — BMW / MINI Original" },
  { code: "MO", label: "MO — Mercedes-Benz Original" },
  { code: "MO1", label: "MO1 — Mercedes-AMG" },
  { code: "MO-E", label: "MO-E — Mercedes-Benz Extended" },
  { code: "AO", label: "AO — Audi Original" },
  { code: "AO1", label: "AO1 — Audi Original (versterkt)" },
  { code: "RO1", label: "RO1 — Audi Sport / RS / Quattro" },
  { code: "RO2", label: "RO2 — Audi Sport" },
  { code: "VO", label: "VO — Volkswagen Original" },
  { code: "N0", label: "N0 — Porsche goedgekeurd" },
  { code: "N1", label: "N1 — Porsche goedgekeurd" },
  { code: "N2", label: "N2 — Porsche goedgekeurd" },
  { code: "J", label: "J — Jaguar Original" },
  { code: "LR", label: "LR — Land Rover Original" },
  { code: "VOL", label: "VOL — Volvo Original" },
  { code: "FO", label: "FO — Ford Original" },
  { code: "AR", label: "AR — Alfa Romeo Original" },
  { code: "T0", label: "T0 — Tesla Original" },
  { code: "T1", label: "T1 — Tesla Original" },
  { code: "MC", label: "MC — McLaren Original" },
  { code: "K1", label: "K1 / K2 — Ferrari Original" },
  { code: "MGT", label: "MGT — Maserati Original" },
  { code: "AM", label: "AM / AM8 / AM9 — Aston Martin" },
  { code: "L", label: "L — Lamborghini Original" },
  { code: "B", label: "B — Bentley Original" },
];

// Vehicle type / tyre class
export const TYRE_CLASSES = [
  { code: "", label: "Standaard (personenwagen)" },
  { code: "SUV", label: "SUV / 4x4 / Crossover" },
  { code: "C", label: "C — Commercieel / Bestelwagen (lichte vracht)" },
  { code: "CP", label: "CP — Camper / Motorhome (Camping Pneu)" },
  { code: "LT", label: "LT — Light Truck" },
  { code: "UHP", label: "UHP — Ultra High Performance" },
  { code: "AT", label: "AT — All-Terrain / Off-road" },
  { code: "MT", label: "MT — Mud-Terrain (zwaar terrein)" },
];

// Ply rating (PR) — number of load-carrying plies in the carcass
export const PLY_RATINGS = [
  { code: "", label: "Niet opgegeven" },
  { code: "4PR", label: "4PR — 4-laags" },
  { code: "6PR", label: "6PR — 6-laags" },
  { code: "8PR", label: "8PR — 8-laags (bestelwagen / lichte vracht)" },
  { code: "10PR", label: "10PR — 10-laags (zware bestelwagen)" },
  { code: "12PR", label: "12PR — 12-laags (lichte vrachtwagen)" },
  { code: "14PR", label: "14PR — 14-laags" },
  { code: "16PR", label: "16PR — 16-laags (vrachtwagen)" },
];

// Load range letter (alternative to PR for North-American / newer notation)
export const LOAD_RANGES = [
  { code: "", label: "Niet opgegeven" },
  { code: "B", label: "B — Lichte belasting" },
  { code: "C", label: "C — Standaard bestelwagen (≈ 6PR)" },
  { code: "D", label: "D — Zwaar bestelwagen (≈ 8PR)" },
  { code: "E", label: "E — Extra zwaar (≈ 10PR)" },
  { code: "F", label: "F — Ultrazwaar (≈ 12PR)" },
];

// Casing / structure type markings
export const STRUCTURE_TYPES = [
  { code: "", label: "Niet opgegeven" },
  { code: "SL", label: "SL — Standard Load (standaard)" },
  { code: "S1", label: "S1 — Special structure type 1" },
  { code: "S2", label: "S2 — Special structure type 2" },
  { code: "S3", label: "S3 — Special structure type 3" },
  { code: "RF", label: "RF — Reinforced / versterkt" },
  { code: "TL", label: "TL — Tubeless (spaakvelg)" },
  { code: "TT", label: "TT — Tube Type (met binnenband)" },
  { code: "RBL", label: "RBL — Raised Black Letters" },
  { code: "OWL", label: "OWL — Outline White Letters" },
  { code: "BSW", label: "BSW — Black Side Wall" },
  { code: "WSW", label: "WSW — White Side Wall" },
];

// Comprehensive dictionary of tyre specification explanations and tooltips
export const SPEC_TOOLTIPS: Record<string, string> = {
  // Common Features / Pills
  "DOT": "DOT-code: geeft het officiële fabricagejaar en de week van de band aan.",
  "XL": "Extra Load (XL) / Reinforced: versterkte bandconstructie met een hogere draagkracht en bandenspanning voor zwaardere belasting.",
  "HL": "High Load (HL): ultra-versterkte bandcapaciteit, speciaal ontworpen voor zware elektrische en hybride voertuigen.",
  "Runflat": "Run-flat noodloopband: met versterkte wangen kunt u bij drukverlies nog ca. 80 km aan max. 80 km/u veilig doorrijden.",
  "RFT": "Run-flat noodloopband: met versterkte wangen kunt u bij drukverlies nog ca. 80 km aan max. 80 km/u veilig doorrijden.",
  "Velgbescherming (FSL)": "Velgbeschermingsrand (FSL/MFS/FR): een rubberen stootrand die uw lichtmetalen velgen beschermt tegen stoeprandschade.",
  "Velgbescherming": "Velgbeschermingsrand (FSL/MFS/FR): een rubberen stootrand die uw lichtmetalen velgen beschermt tegen stoeprandschade.",
  "FSL": "Velgbeschermingsrand (FSL/MFS/FR): een rubberen stootrand die uw lichtmetalen velgen beschermt tegen stoeprandschade.",
  "3PMSF": "Three-Peak Mountain Snow Flake (3PMSF): officieel getest en gecertificeerd voor zware winterse omstandigheden en sneeuw.",
  "3PMSF 🏔️": "Three-Peak Mountain Snow Flake (3PMSF): officieel gecertificeerd voor zware winterse omstandigheden en sneeuw.",
  "M+S": "Mud & Snow (M+S): profielontwerp met verbeterde tractie op modderige en besneeuwde wegen.",
  "M+S ❄️": "Mud & Snow (M+S): profielontwerp met verbeterde tractie op modderige en besneeuwde wegen.",
  "🧊 Noordse band": "Nordic friction (ISO 19447): ultra-zacht rubbercompound voor extreme grip op ijs en vastgereden sneeuw.",
  "Nordic": "Nordic friction (ISO 19447): ultra-zacht rubbercompound voor extreme grip op ijs en vastgereden sneeuw.",
  "⚡ EV / EVR": "Electric Vehicle Ready: geoptimaliseerd voor het hoge koppel, extra voertuiggewicht en stille interieur van elektrische auto's.",
  "EV": "Electric Vehicle Ready: geoptimaliseerd voor het hoge koppel, zwaardere gewicht en stillere cabine van elektrische auto's.",
  "🛡️ Seal": "Self-sealing technologie: kleeflaag aan de binnenzijde dicht loopvlaklekken tot 5 mm direct en automatisch af.",
  "Seal": "Self-sealing technologie: kleeflaag aan de binnenzijde dicht loopvlaklekken tot 5 mm direct en automatisch af.",
  "🔇 Acoustic": "Acoustic / Silent: ingebouwd polyurethaanschuim absorbeert rolgeluid in het interieur tot wel 3 à 5 dB.",
  "Acoustic": "Acoustic / Silent: ingebouwd polyurethaanschuim absorbeert rolgeluid in het interieur tot wel 3 à 5 dB.",
  "Demo": "Demoband: nieuw gedemonteerd van een nieuwe wagen bij de dealer (max. 0-50 km gereden, staat gelijk aan nieuw).",
  "Tubeless": "Tubeless (TL): moderne band zonder binnenband, luchtdicht afgesloten op de velg.",
  "TL": "Tubeless (TL): band zonder binnenband, standaard voor hedendaagse velgen.",
  "TT": "Tube Type (TT): vereist een afzonderlijke binnenband.",
  "TT (Binnenband)": "Tube Type (TT): band die een afzonderlijke binnenband vereist.",
  "Binnenband": "Tube Type (TT): band die een afzonderlijke binnenband vereist.",

  // Ply Ratings (PR)
  "4PR": "4PR (4-laags karkas): standaard lichte personenwagenconstructie.",
  "6PR": "6PR (6-laags karkas): versterkt karkas voor compacte bedrijfswagens.",
  "8PR": "8PR (8-laags karkas): robuust versterkt karkas voor bestelwagens en lichte vrachtwagens (C-klasse).",
  "10PR": "10PR (10-laags karkas): zware karkasconstructie voor zware bestelwagens en hoge aslasten.",
  "12PR": "12PR (12-laags karkas): extreem versterkt karkas voor zware bedrijfsvoertuigen.",
  "14PR": "14PR (14-laags karkas): zware utilitaire karkaslagen voor maximale asbelasting.",
  "16PR": "16PR (16-laags karkas): industriële karkassterkte voor vracht- en zwaartransport.",

  // Structure types
  "SL": "Standard Load (SL): standaard draagkrachtconstructie voor personenwagens.",
  "S1": "S1 structuur: speciale akoestische en rolweerstand optimalisatie (o.a. Michelin/Continental originele constructie).",
  "S2": "S2 structuur: tweede generatie geoptimaliseerde karkasopbouw.",
  "S3": "S3 structuur: derde generatie geoptimaliseerde karkasopbouw.",
  "RF": "Reinforced (RF): versterkte wang- en gordelstructuur.",
  "RBL": "Raised Black Letters: verhoogde zwarte belettering op de zijwand.",
  "OWL": "Outline White Letters: witte omlijnde letters op de zijwand.",
  "BSW": "Black Side Wall: klassieke egaal zwarte zijwand.",
  "WSW": "White Side Wall: klassieke witte zijwand (white wall).",

  // Load Ranges
  "Range B": "Load Range B: lichte belasting (overeenkomstig met 4PR).",
  "Range C": "Load Range C: standaard bedrijfswagenbelasting (overeenkomstig met 6PR).",
  "Range D": "Load Range D: zware bedrijfswagenbelasting (overeenkomstig met 8PR).",
  "Range E": "Load Range E: extra zware bedrijfswagenbelasting (overeenkomstig met 10PR).",
  "Range F": "Load Range F: ultra-zware bedrijfswagenbelasting (overeenkomstig met 12PR).",

  // Tyre Classes
  "SUV": "SUV / 4x4: versterkte constructie geschikt voor hogere bodemvrijheid en zwaardere SUV's.",
  "C": "C-Klasse (Commercial): versterkte bestelwagenband met extra karkaslagen voor zware belading.",
  "CP": "Camping Pneu (CP): speciaal ontworpen voor campers tegen langdurige stilstand en hoge aslasten.",
  "LT": "Light Truck: lichte vrachtwagenband voor intensief utilitair gebruik.",
  "UHP": "Ultra High Performance: sportband voor hoge snelheden, strakke stuurprecisie en maximale bochtengrip.",
  "AT": "All-Terrain (AT): gebalanceerd profiel voor 50% wegdek en 50% onverhard terrein.",
  "MT": "Mud-Terrain (MT): grof terreinprofiel met diepe noppen voor modder, rotsen en zand.",

  // OEM Homologaties
  "*": "Origineel BMW / MINI: specifiek ontwikkeld en afgestemd op BMW / MINI onderstellen.",
  "MO": "Mercedes-Benz Original: officiële homologatie voor Mercedes-Benz personenwagens.",
  "MO1": "Mercedes-AMG: High-Performance afstelling voor sportieve AMG modellen.",
  "MO-E": "Mercedes-Benz Extended: Mercedes noodloopeigenschappen (Run-flat).",
  "AO": "Audi Original: officiële fabriekshomologatie voor Audi wagens.",
  "AO1": "Audi Original versterkt: afgestemd op Quattro en zwaardere Audi modellen.",
  "RO1": "Audi Sport: speciale race- en bochtentuning voor Audi RS en Quattro modellen.",
  "RO2": "Audi Sport: homologatie voor supersportwagens zoals de Audi R8.",
  "VO": "Volkswagen Original: goedgekeurd fabriekskeurmerk voor Volkswagen.",
  "N0": "Porsche goedgekeurd: N0 specificatie voor Porsche sportchassis en gewichtsverdeling.",
  "N1": "Porsche goedgekeurd: N1 herziene afstelling voor Porsche sportwagens.",
  "N2": "Porsche goedgekeurd: N2 doorontwikkelde Porsche homologatie.",
  "J": "Jaguar Original: goedgekeurd voor het rijgedrag van Jaguar modellen.",
  "LR": "Land Rover Original: afgestemd op 4x4 en tractiecontrole van Land Rover / Range Rover.",
  "VOL": "Volvo Original: fabriekskeurmerk gericht op comfort en veiligheid van Volvo.",
  "FO": "Ford Original: goedgekeurd voor Ford voertuigen.",
  "AR": "Alfa Romeo Original: sportieve afstelling voor Alfa Romeo modellen.",
  "T0": "Tesla Original: speciaal laag rolgeluid en hoge efficiëntie voor Tesla modellen.",
  "T1": "Tesla Original: vernieuwde generatie Tesla specificatie.",
  "MC": "McLaren Original: racebaan- en wegspecificatie voor McLaren supercars.",
  "K1": "Ferrari Original: fabrieksafstelling voor Ferrari.",
  "K2": "Ferrari Original: tweede generatie Ferrari homologatie.",
  "MGT": "Maserati Original: officiële fabrieksafstelling voor Maserati.",
  "AM": "Aston Martin Original: fabrieksspecificatie voor Aston Martin sportwagens.",
  "L": "Lamborghini Original: afgestemd op de extreme prestaties van Lamborghini.",
  "B": "Bentley Original: gericht op ultiem comfort en hoge topsnelheden voor Bentley.",

  // Technical Specs Grid labels
  "Breedte": "De breedte van het loopvlak van de band in millimeters (van flank tot flank).",
  "Aspect ratio": "De profielhoogte als percentage van de breedte (bijv. 55 = 55% van de breedte).",
  "Velgdiameter": "De diameter van de velg in inches waarop de band gemonteerd wordt.",
  "Seizoen": "Het weertype waarvoor de rubbersamenstelling en het profiel zijn geoptimaliseerd.",
  "Conditie": "Nieuwe banden of professioneel gecontroleerde tweedehands banden met profielgarantie.",
  "Last/snelheidsindex": "De lastindex bepaalt het maximaal draagvermogen per band; de snelheidsletter bepaalt de maximumsnelheid.",
  "Profieldiepte": "De gemeten diepte van de hoofdgroeven van het loopvlak in millimeters.",
  "DOT-jaar": "Het officiële productiejaar van de band volgens de DOT-markering op de bandflank.",
  "Run-flat": "Noodloopband met zelfdragende wangen die tot 80 km kunnen doorrijden bij drukverlies.",
  "Versterkt (XL)": "Extra versterkte karkasopbouw voor hogere laadcapaciteit en stabiliteit.",
  "Hoge draagkracht (HL)": "HL-aanduiding voor extra zware belasting op hedendaagse elektrische en hybride auto's.",
  "3PMSF Certificering": "Officieel Alpine-symbool (berg met sneeuwvlok), wettelijk verplicht als winterband in o.a. Duitsland en Frankrijk.",
  "M+S Markering": "Mud & Snow markering voor grip in modderige en winterse omstandigheden.",
  "Noordse ijsgrip": "Speciaal zacht ijscompound voor Scandinavische en extreme vrieskou-omstandigheden (ISO 19447).",
  "Zelfdichtend": "Zelfklevende binnenlaag dicht automatisch gaatjes tot 5 mm zonder drukverlies.",
  "Geluidsdemping": "Schuiminzet aan de binnenzijde van het loopvlak absorbeert resonanties en interieurgeluid.",
  "EV-geschikt": "Speciale rubbersamenstelling voor hoog koppel, stil afrollen en minimaal energieverbruik van EV's.",
  "Type conditie": "Demoband: gedemonteerd van een nieuwe wagen bij aflevering, als nieuw met 0-50 km.",
  "OEM Homologatie": "Originele eerste montage specificatie op maat gemaakt voor specifieke automerken.",
  "Bandklasse / Type": "Klasse-indeling zoals personenwagen, bestelwagen (C), camper (CP) of SUV.",
  "Ply rating (PR)": "Het aantal karkaslagen dat de stevigheid en het draagvermogen van de band bepaalt.",
  "Load Range": "Internationale classificatieletter voor het draagkrachtbereik van bedrijfswagenbanden.",
  "Constructietype": "Specifieke constructiemarkering of typecode van de bandenfabrikant.",
  "Constructie": "Tubeless (TL): moderne band zonder binnenband, standaard voor hedendaagse velgen.",
  "Brandstofefficiëntie": "Europees bandenlabel voor rolweerstand: klasse A is het zuinigst, E het minst zuinig.",
  "Grip op nat wegdek": "Europees bandenlabel voor remafstand op nat wegdek: klasse A remt het snelst, E het traagst.",
  "Geluidsniveau": "Extern afrolgeluid van de band gemeten in decibel (dB) volgens EU-norm.",
};

export function getSpecTooltip(keyOrCode?: string | null): string | undefined {
  if (!keyOrCode) return undefined;
  const trimmed = keyOrCode.trim();
  if (SPEC_TOOLTIPS[trimmed]) return SPEC_TOOLTIPS[trimmed];

  const upper = trimmed.toUpperCase();
  if (SPEC_TOOLTIPS[upper]) return SPEC_TOOLTIPS[upper];

  if (upper.startsWith("RANGE ")) {
    const letter = upper.replace("RANGE ", "").trim();
    if (SPEC_TOOLTIPS[`Range ${letter}`]) return SPEC_TOOLTIPS[`Range ${letter}`];
  }
  if (upper.endsWith("PR")) {
    if (SPEC_TOOLTIPS[upper]) return SPEC_TOOLTIPS[upper];
  }
  if (upper.startsWith("DOT")) {
    return SPEC_TOOLTIPS["DOT"];
  }
  if (upper.startsWith("EU")) {
    return "EU Bandenlabel: toont de officiële Europese scores voor brandstofverbruik en remweg op nat wegdek.";
  }
  if (upper.startsWith("PROFIEL")) {
    return SPEC_TOOLTIPS["Profieldiepte"];
  }

  // Check OE markings
  const oe = OE_MARKINGS.find((m) => m.code.toUpperCase() === upper);
  if (oe && oe.code) {
    return `OEM Homologatie: ${oe.label}`;
  }

  // Check Tyre classes
  const tc = TYRE_CLASSES.find((c) => c.code.toUpperCase() === upper);
  if (tc && tc.code) {
    return `Bandklasse: ${tc.label}`;
  }

  return undefined;
}

