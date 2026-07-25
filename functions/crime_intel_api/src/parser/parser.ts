import { ParsedQuery } from '../core/pipeline';

const DISTRICT_LIST = [
  { id: 1, name: 'Bengaluru City', aliases: ['bengaluru', 'bangalore', 'blr'] },
  { id: 2, name: 'Mysuru', aliases: ['mysuru', 'mysore', 'mys'] },
  { id: 3, name: 'Belagavi', aliases: ['belagavi', 'belgaum'] },
  { id: 4, name: 'Mangaluru City', aliases: ['mangaluru', 'mangalore', 'mlr'] },
  { id: 5, name: 'Hubballi-Dharwad', aliases: ['hubli', 'dharwad', 'hubballi'] },
  { id: 6, name: 'Udupi', aliases: ['udupi'] },
  { id: 7, name: 'Kodagu', aliases: ['kodagu', 'coorg'] },
  { id: 8, name: 'Mandya', aliases: ['mandya'] },
  { id: 9, name: 'Hassan', aliases: ['hassan'] },
  { id: 10, name: 'Shivamogga', aliases: ['shivamogga', 'shimoga'] },
];

const STATION_LIST = [
  { id: 1, name: 'Kalasipalya PS', aliases: ['kalasipalya', 'kalasipalyam'] },
  { id: 2, name: 'Jayanagar PS', aliases: ['jayanagar'] },
  { id: 3, name: 'Indiranagar PS', aliases: ['indiranagar'] },
  { id: 4, name: 'Devaraja PS', aliases: ['devaraja'] },
  { id: 5, name: 'Lashkar PS', aliases: ['lashkar'] },
  { id: 6, name: 'Khade Bazar PS', aliases: ['khade bazar', 'khadebazar'] },
  { id: 7, name: 'Kankanady PS', aliases: ['kankanady'] },
  { id: 8, name: 'Hubli Town PS', aliases: ['hubli town'] },
  { id: 9, name: 'Udupi Town PS', aliases: ['udupi town'] },
  { id: 10, name: 'Madikeri Town PS', aliases: ['madikeri'] },
];

const CRIME_HEAD_LIST = [
  { id: 1, name: 'Crimes Against Body', aliases: ['body', 'assault', 'murder', 'attempt to murder', 'kidnapping', 'homicide'] },
  { id: 2, name: 'Crimes Against Property', aliases: ['property', 'theft', 'breaking', 'robbery', 'snatching', 'stolen'] },
  { id: 3, name: 'Cybercrime', aliases: ['cyber', 'online', 'phishing', 'fraud', 'bank fraud', 'otp'] },
  { id: 4, name: 'Narcotics', aliases: ['narcotics', 'drugs', 'ganja', 'mdma', 'ndps'] },
  { id: 5, name: 'White Collar Crime', aliases: ['white collar', 'cheating', 'forgery', 'scam'] },
  { id: 6, name: 'Public Peace', aliases: ['peace', 'rioting', 'trespass', 'protest', 'clash'] },
];

export class DeterministicParser {
  parse(query: string): ParsedQuery | null {
    const text = query.toLowerCase();
    let intent = '';
    let confidence = 0.0;
    const entities: any = {};

    // 1. Intent Detection
    if (text.includes('how many') || text.includes('count') || text.includes('number of')) {
      intent = 'COUNT';
      confidence = 0.9;
    } else if (text.includes('compare') || text.includes('vs') || text.includes('difference between')) {
      intent = 'COMPARE';
      confidence = 0.95;
    } else if (text.includes('trend') || text.includes('over time') || text.includes('monthly') || text.includes('yearly')) {
      intent = 'TREND';
      confidence = 0.9;
    } else if (text.includes('hotspot') || text.includes('heatmap') || text.includes('cluster') || text.includes('density')) {
      intent = 'HOTSPOT';
      confidence = 0.95;
    } else if (text.includes('network') || text.includes('relationship') || text.includes('co-accused') || text.includes('connection')) {
      intent = 'NETWORK';
      confidence = 0.95;
    } else if (text.includes('timeline') || text.includes('progression') || text.includes('stage') || text.includes('track')) {
      intent = 'TIMELINE';
      confidence = 0.95;
    } else if (text.includes('predict') || text.includes('forecast') || text.includes('future') || text.includes('recidivism') || text.includes('duration')) {
      intent = 'PREDICTION';
      confidence = 0.95;
    } else if (text.includes('profile') || text.includes('behavior') || text.includes('offender history')) {
      intent = 'PROFILE';
      confidence = 0.9;
    } else if (text.includes('summarize') || text.includes('summary of') || text.includes('brief facts')) {
      intent = 'SUMMARY';
      confidence = 0.9;
    } else if (text.includes('list') || text.includes('show cases') || text.includes('find cases')) {
      intent = 'LIST';
      confidence = 0.85;
    } else if (text.includes('lookup') || text.includes('get case')) {
      intent = 'LOOKUP';
      confidence = 0.85;
    }

    if (!intent) {
      return null; // Fallback to embedding/LLM classifier
    }

    // 2. Entity Extraction
    // Extract Districts
    const matchedDistricts = DISTRICT_LIST.filter(d => 
      d.aliases.some(alias => text.includes(alias))
    );

    if (matchedDistricts.length > 0) {
      entities.district = matchedDistricts[0].name;
      entities.districtId = matchedDistricts[0].id;
      
      if (intent === 'COMPARE' && matchedDistricts.length > 1) {
        entities.compareWith = matchedDistricts[1].name;
        entities.compareWithId = matchedDistricts[1].id;
      }
    }

    // Extract Police Stations (Units)
    const matchedStations = STATION_LIST.filter(s => 
      s.aliases.some(alias => text.includes(alias))
    );
    if (matchedStations.length > 0) {
      entities.unit = matchedStations[0].name;
      entities.unitId = matchedStations[0].id;
      
      if (intent === 'COMPARE' && matchedStations.length > 1) {
        entities.compareWith = matchedStations[1].name;
        entities.compareWithId = matchedStations[1].id;
      }
    }

    // Extract Crime Heads
    const matchedCrimeHeads = CRIME_HEAD_LIST.filter(ch => 
      ch.aliases.some(alias => text.includes(alias))
    );
    if (matchedCrimeHeads.length > 0) {
      entities.crimeHead = matchedCrimeHeads[0].name;
      entities.crimeHeadId = matchedCrimeHeads[0].id;
    }

    // Extract Year
    const yearMatch = text.match(/\b(202\d)\b/);
    if (yearMatch) {
      entities.year = parseInt(yearMatch[1], 10);
    }

    // Extract Case Number / Crime Number (Matches patterns like YYYY00001 or 17-digit numbers)
    const caseNoMatch = text.match(/\b(\d{9,17})\b/);
    if (caseNoMatch) {
      entities.caseNo = caseNoMatch[1];
    } else {
      const shortCaseNoMatch = text.match(/\b(202\d{5,6})\b/);
      if (shortCaseNoMatch) {
        entities.caseNo = shortCaseNoMatch[1];
      }
    }

    // Extract Suspect / Accused Name
    // Pattern: "accused Rajesh Kumar" or "relation of Rajesh" or "accused named Rajesh"
    const nameMatch = text.match(/(?:accused|suspect|named|relation of|criminal|offender)\s+([a-zA-Z\s]+)(?:in|for|from|and|$)/);
    if (nameMatch) {
      entities.name = nameMatch[1].trim();
    } else {
      // General fallbacks if a proper name is typed, e.g. "network of Rajesh Kumar"
      const networkMatch = text.match(/(?:network of|connections of)\s+([a-zA-Z\s]+)/);
      if (networkMatch) {
        entities.name = networkMatch[1].trim();
      }
    }

    // If we have both an intent and some relevant entities, boost confidence
    if (intent && Object.keys(entities).length > 0) {
      confidence = Math.min(1.0, confidence + 0.1);
    }

    return {
      intent,
      entities,
      confidence,
      pipelineStage: 'deterministic'
    };
  }
}
