import * as fs from 'fs';
import * as path from 'path';

const DISTRICTS = [
  { id: 1, name: 'Bengaluru City', lat: 12.9716, lng: 77.5946 },
  { id: 2, name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { id: 3, name: 'Belagavi', lat: 15.8497, lng: 74.4977 },
  { id: 4, name: 'Mangaluru City', lat: 12.9141, lng: 74.8560 },
  { id: 5, name: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.1240 },
  { id: 6, name: 'Udupi', lat: 13.3409, lng: 74.7421 },
  { id: 7, name: 'Kodagu', lat: 12.4244, lng: 75.7382 },
  { id: 8, name: 'Mandya', lat: 12.5218, lng: 76.8951 },
  { id: 9, name: 'Hassan', lat: 13.0072, lng: 76.1026 },
  { id: 10, name: 'Shivamogga', lat: 13.9299, lng: 75.5681 },
];

const POLICE_STATIONS = [
  { id: 1, name: 'Kalasipalya PS', districtId: 1 },
  { id: 2, name: 'Jayanagar PS', districtId: 1 },
  { id: 3, name: 'Indiranagar PS', districtId: 1 },
  { id: 4, name: 'Devaraja PS', districtId: 2 },
  { id: 5, name: 'Lashkar PS', districtId: 2 },
  { id: 6, name: 'Khade Bazar PS', districtId: 3 },
  { id: 7, name: 'Kankanady PS', districtId: 4 },
  { id: 8, name: 'Hubli Town PS', districtId: 5 },
  { id: 9, name: 'Udupi Town PS', districtId: 6 },
  { id: 10, name: 'Madikeri Town PS', districtId: 7 },
];

const CRIME_HEADS = [
  { id: 1, name: 'Crimes Against Body' },
  { id: 2, name: 'Crimes Against Property' },
  { id: 3, name: 'Cybercrime' },
  { id: 4, name: 'Narcotics' },
  { id: 5, name: 'White Collar Crime' },
  { id: 6, name: 'Public Peace' },
];

const CRIME_SUB_HEADS = [
  { id: 1, headId: 1, name: 'Murder', seq: 1 },
  { id: 2, headId: 1, name: 'Attempt to Murder', seq: 2 },
  { id: 3, headId: 1, name: 'Assault', seq: 3 },
  { id: 4, headId: 1, name: 'Kidnapping', seq: 4 },
  { id: 5, headId: 2, name: 'Theft', seq: 1 },
  { id: 6, headId: 2, name: 'House Breaking', seq: 2 },
  { id: 7, headId: 2, name: 'Robbery', seq: 3 },
  { id: 8, headId: 2, name: 'Chain Snatching', seq: 4 },
  { id: 9, headId: 3, name: 'Online Financial Fraud', seq: 1 },
  { id: 10, headId: 3, name: 'Phishing', seq: 2 },
  { id: 11, headId: 3, name: 'Identity Theft', seq: 3 },
  { id: 12, headId: 4, name: 'NDPS Possession', seq: 1 },
  { id: 13, headId: 4, name: 'NDPS Trafficking', seq: 2 },
  { id: 14, headId: 5, name: 'Cheating', seq: 1 },
  { id: 15, headId: 5, name: 'Forgery', seq: 2 },
  { id: 16, headId: 6, name: 'Rioting', seq: 1 },
  { id: 17, headId: 6, name: 'Criminal Trespass', seq: 2 },
];

const ACTS = [
  { code: 'IPC', desc: 'Indian Penal Code', short: 'IPC' },
  { code: 'NDPS', desc: 'Narcotic Drugs and Psychotropic Substances Act', short: 'NDPS' },
  { code: 'POCSO', desc: 'Protection of Children from Sexual Offences Act', short: 'POCSO' },
  { code: 'IT_ACT', desc: 'Information Technology Act', short: 'IT Act' },
  { code: 'KP_ACT', desc: 'Karnataka Police Act', short: 'KP Act' },
];

const SECTIONS = [
  { actCode: 'IPC', code: '302', desc: 'Punishment for Murder' },
  { actCode: 'IPC', code: '307', desc: 'Attempt to Murder' },
  { actCode: 'IPC', code: '379', desc: 'Punishment for Theft' },
  { actCode: 'IPC', code: '380', desc: 'Theft in Dwelling House' },
  { actCode: 'IPC', code: '392', desc: 'Punishment for Robbery' },
  { actCode: 'IPC', code: '420', desc: 'Cheating and Dishonestly Inducing Delivery of Property' },
  { actCode: 'IPC', code: '324', desc: 'Voluntarily Causing Hurt by Dangerous Weapons' },
  { actCode: 'IPC', code: '363', desc: 'Punishment for Kidnapping' },
  { actCode: 'IPC', code: '448', desc: 'Punishment for House-Trespass' },
  { actCode: 'IPC', code: '143', desc: 'Punishment for Unlawful Assembly' },
  { actCode: 'IPC', code: '147', desc: 'Punishment for Rioting' },
  { actCode: 'NDPS', code: '20', desc: 'Punishment for Contravention in Relation to Cannabis Plant' },
  { actCode: 'NDPS', code: '22', desc: 'Punishment for Contravention in Relation to Psychotropic Substances' },
  { actCode: 'IT_ACT', code: '66C', desc: 'Identity Theft' },
  { actCode: 'IT_ACT', code: '66D', desc: 'Cheating by Personation using Computer Resource' },
  { actCode: 'KP_ACT', code: '92', desc: 'Punishment for Certain Street Offenses' },
];

const REPEAT_ACCUSED_POOL = [
  'Rajesh Kumar', 'Imran Khan', 'Manjunath S', 'Vikram Gowda', 
  'Sunil Naik', 'Mohammed Ali', 'Sandesh Hegde', 'Anand K', 
  'Girish Gowda', 'Suresh Shetty'
];

const FIRST_NAMES = [
  'Amit', 'Rahul', 'Kiran', 'Sanjay', 'Deepa', 'Jyothi', 'Mallikarjun', 'Naveen', 
  'Venkatesh', 'Meena', 'Savitha', 'Shekar', 'Santosh', 'Shashidhar', 'Latha', 
  'Ravi', 'Chethan', 'Pradeep', 'Lakshmi', 'Nagesh', 'Raghu', 'Harish', 'Ganesh'
];

const LAST_NAMES = [
  'Gowda', 'Murthy', 'Nayar', 'Patil', 'Naik', 'Shetty', 'Kumar', 'Hegde', 'Rao', 
  'Bhat', 'Joshi', 'Desai', 'Banerjee', 'Acharya', 'Reddy', 'Chavan', 'Prasad'
];

const FACTS_TEMPLATES = {
  1: [
    "On {date}, the accused {accused} picked up a quarrel with the victim over a property dispute. In a fit of rage, the accused assaulted the victim with a sharp weapon, causing severe injuries leading to death.",
    "Complainant reported that on the night of {date}, a group of individuals including {accused} forcefully entered their house and attacked their brother with iron rods with the intention of murdering him."
  ],
  2: [
    "The complainant stated that they locked their house and went out. Upon returning on {date}, they found the lock broken and gold ornaments weighing 50g along with cash stolen from the locker.",
    "On {date}, at Kalasipalya market, the accused was caught red-handed while stealing a mobile phone and wallet from a passenger boarding the bus."
  ],
  3: [
    "The complainant received a call from an unknown person claiming to be a bank manager. Under the pretext of KYC update, the caller obtained OTP and fraudulently transferred Rs 75,000 from the complainant's account.",
    "The complainant reported that an unknown person created a fake social media profile using their photos and details, and sent obscene messages to their contacts."
  ],
  4: [
    "Acting on a tip-off, the police team raided a spot near Bangalore University on {date} and apprehended the accused carrying 2.5 kg of contraband Ganja in a backpack.",
    "The accused was found selling synthetic MDMA drugs to college students near Mangalore beach. Police seized 15 grams of MDMA crystals from their possession."
  ],
  5: [
    "The accused collected Rs 12 Lakhs from the complainant promising to secure a government job in KSRTC. However, the accused failed to provide the job and refused to return the money.",
    "The accused sold a piece of land to the complainant using forged documents, claiming sole ownership, while the property was already mortgaged to a bank."
  ],
  6: [
    "During a local festival procession on {date}, two groups clashed near the temple. The accused {accused} along with others formed an unlawful assembly, shouted slogans, threw stones and damaged public buses.",
    "A group of protesters gathered illegally outside the circle office, holding weapons and blocking traffic, violating the section 144 order."
  ]
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function escapeSQLVal(val: any): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'number') {
    return String(val);
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  const escaped = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${escaped}'`;
}

function generateInsertSQL(tableName: string, data: Record<string, any>): string {
  const columns = Object.keys(data);
  const values = columns.map(col => escapeSQLVal(data[col]));
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

function districtObjId(stationId: number): number {
  const st = POLICE_STATIONS.find(p => p.id === stationId);
  return st ? st.districtId : 1;
}

function runGeneration() {
  const sqlStatements: string[] = [];

  // 1. Seeding master lookup tables
  sqlStatements.push('-- State Table');
  sqlStatements.push(generateInsertSQL('State', { StateID: 1, StateName: 'Karnataka', NationalityID: 1, Active: 1 }));

  sqlStatements.push('\n-- District Table');
  for (const d of DISTRICTS) {
    sqlStatements.push(generateInsertSQL('District', { DistrictID: d.id, DistrictName: d.name, StateID: 1, Active: 1 }));
  }

  sqlStatements.push('\n-- Court Table');
  for (const d of DISTRICTS) {
    sqlStatements.push(generateInsertSQL('Court', { CourtID: d.id, CourtName: `District Court - ${d.name}`, DistrictID: d.id, StateID: 1, Active: 1 }));
    sqlStatements.push(generateInsertSQL('Court', { CourtID: d.id + 100, CourtName: `Judicial Magistrate First Class - ${d.name}`, DistrictID: d.id, StateID: 1, Active: 1 }));
  }

  sqlStatements.push('\n-- UnitType Table');
  sqlStatements.push(generateInsertSQL('UnitType', { UnitTypeID: 1, UnitTypeName: 'Police Station', CityDistState: 'City' }));
  sqlStatements.push(generateInsertSQL('UnitType', { UnitTypeID: 2, UnitTypeName: 'Circle Office', CityDistState: 'District' }));

  sqlStatements.push('\n-- Unit (Police Station) Table');
  for (const u of POLICE_STATIONS) {
    sqlStatements.push(generateInsertSQL('Unit', { UnitID: u.id, UnitName: u.name, TypeID: 1, ParentUnit: null, NationalityID: 1, StateID: 1, DistrictID: u.districtId, Active: 1 }));
  }

  sqlStatements.push('\n-- Rank Table');
  const ranks = [
    { id: 1, name: 'Police Constable', hierarchy: 6 },
    { id: 2, name: 'Head Constable', hierarchy: 5 },
    { id: 3, name: 'Assistant Sub-Inspector', hierarchy: 4 },
    { id: 4, name: 'Sub-Inspector', hierarchy: 3 },
    { id: 5, name: 'Inspector', hierarchy: 2 },
    { id: 6, name: 'Deputy Superintendent', hierarchy: 1 },
  ];
  for (const r of ranks) {
    sqlStatements.push(generateInsertSQL('Rank', { RankID: r.id, RankName: r.name, Hierarchy: r.hierarchy, Active: 1 }));
  }

  sqlStatements.push('\n-- Designation Table');
  const designations = [
    { id: 1, name: 'Investigating Officer', sort: 1 },
    { id: 2, name: 'Station House Officer', sort: 2 },
    { id: 3, name: 'Writer', sort: 3 },
  ];
  for (const ds of designations) {
    sqlStatements.push(generateInsertSQL('Designation', { DesignationID: ds.id, DesignationName: ds.name, Active: 1, SortOrder: ds.sort }));
  }

  sqlStatements.push('\n-- Employee Table');
  const employeeIds: number[] = [];
  for (let i = 1; i <= 40; i++) {
    const fName = getRandomElement(FIRST_NAMES);
    const lName = getRandomElement(LAST_NAMES);
    const name = `${fName} ${lName}`;
    const districtId = getRandomElement(DISTRICTS).id;
    const unit = getRandomElement(POLICE_STATIONS.filter(u => u.districtId === districtId)) || POLICE_STATIONS[0];
    const rankId = getRandomRange(1, 5);
    const desigId = rankId >= 4 ? 2 : 1;
    const kgid = `KG-${20000 + i}`;
    const dob = `${1970 + getRandomRange(0, 25)}-0${getRandomRange(1, 9)}-${10 + getRandomRange(0, 18)}`;
    const apptDate = `${2000 + getRandomRange(0, 20)}-0${getRandomRange(1, 9)}-${10 + getRandomRange(0, 18)}`;
    
    sqlStatements.push(generateInsertSQL('Employee', {
      EmployeeID: i, DistrictID: districtId, UnitID: unit.id, RankID: rankId, DesignationID: desigId,
      KGID: kgid, FirstName: name, EmployeeDOB: dob, GenderID: getRandomRange(1, 2), BloodGroupID: getRandomRange(1, 4),
      PhysicallyChallenged: 0, AppointmentDate: apptDate
    }));
    employeeIds.push(i);
  }

  sqlStatements.push('\n-- CaseCategory Table');
  sqlStatements.push(generateInsertSQL('CaseCategory', { CaseCategoryID: 1, LookupValue: 'FIR' }));
  sqlStatements.push(generateInsertSQL('CaseCategory', { CaseCategoryID: 2, LookupValue: 'UDR' }));
  sqlStatements.push(generateInsertSQL('CaseCategory', { CaseCategoryID: 3, LookupValue: 'Zero FIR' }));
  sqlStatements.push(generateInsertSQL('CaseCategory', { CaseCategoryID: 4, LookupValue: 'PAR' }));

  sqlStatements.push('\n-- GravityOffence Table');
  sqlStatements.push(generateInsertSQL('GravityOffence', { GravityOffenceID: 1, LookupValue: 'Heinous' }));
  sqlStatements.push(generateInsertSQL('GravityOffence', { GravityOffenceID: 2, LookupValue: 'Non-Heinous' }));

  sqlStatements.push('\n-- CaseStatusMaster Table');
  sqlStatements.push(generateInsertSQL('CaseStatusMaster', { CaseStatusID: 1, CaseStatusName: 'Under Investigation' }));
  sqlStatements.push(generateInsertSQL('CaseStatusMaster', { CaseStatusID: 2, CaseStatusName: 'Charge Sheeted' }));
  sqlStatements.push(generateInsertSQL('CaseStatusMaster', { CaseStatusID: 3, CaseStatusName: 'Closed' }));

  sqlStatements.push('\n-- ReligionMaster Table');
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain'];
  for (let i = 0; i < religions.length; i++) {
    sqlStatements.push(generateInsertSQL('ReligionMaster', { ReligionID: i + 1, ReligionName: religions[i] }));
  }

  sqlStatements.push('\n-- CasteMaster Table');
  const castes = ['General', 'OBC', 'SC', 'ST'];
  for (let i = 0; i < castes.length; i++) {
    sqlStatements.push(generateInsertSQL('CasteMaster', { caste_master_id: i + 1, caste_master_name: castes[i] }));
  }

  sqlStatements.push('\n-- OccupationMaster Table');
  const occupations = ['Farmer', 'Business Owner', 'Government Employee', 'Private Employee', 'Unemployed', 'Student'];
  for (let i = 0; i < occupations.length; i++) {
    sqlStatements.push(generateInsertSQL('OccupationMaster', { OccupationID: i + 1, OccupationName: occupations[i] }));
  }

  sqlStatements.push('\n-- CrimeHead Table');
  for (const h of CRIME_HEADS) {
    sqlStatements.push(generateInsertSQL('CrimeHead', { CrimeHeadID: h.id, CrimeGroupName: h.name, Active: 1 }));
  }

  sqlStatements.push('\n-- CrimeSubHead Table');
  for (const sh of CRIME_SUB_HEADS) {
    sqlStatements.push(generateInsertSQL('CrimeSubHead', { CrimeSubHeadID: sh.id, CrimeHeadID: sh.headId, CrimeHeadName: sh.name, SeqID: sh.seq }));
  }

  sqlStatements.push('\n-- Act Table');
  for (const a of ACTS) {
    sqlStatements.push(generateInsertSQL('Act', { ActCode: a.code, ActDescription: a.desc, ShortName: a.short, Active: 1 }));
  }

  sqlStatements.push('\n-- Section Table');
  for (const s of SECTIONS) {
    sqlStatements.push(generateInsertSQL('Section', { ActCode: s.actCode, SectionCode: s.code, SectionDescription: s.desc, Active: 1 }));
  }

  sqlStatements.push('\n-- CrimeHeadActSection Table');
  const mapping = [
    { headId: 1, actCode: 'IPC', section: '302' },
    { headId: 1, actCode: 'IPC', section: '307' },
    { headId: 1, actCode: 'IPC', section: '324' },
    { headId: 1, actCode: 'IPC', section: '363' },
    { headId: 2, actCode: 'IPC', section: '379' },
    { headId: 2, actCode: 'IPC', section: '380' },
    { headId: 2, actCode: 'IPC', section: '392' },
    { headId: 3, actCode: 'IT_ACT', section: '66C' },
    { headId: 3, actCode: 'IT_ACT', section: '66D' },
    { headId: 4, actCode: 'NDPS', section: '20' },
    { headId: 4, actCode: 'NDPS', section: '22' },
    { headId: 5, actCode: 'IPC', section: '420' },
    { headId: 5, actCode: 'IPC', section: '448' },
    { headId: 6, actCode: 'IPC', section: '143' },
    { headId: 6, actCode: 'IPC', section: '147' },
    { headId: 6, actCode: 'KP_ACT', section: '92' }
  ];
  for (const m of mapping) {
    sqlStatements.push(generateInsertSQL('CrimeHeadActSection', { CrimeHeadID: m.headId, ActCode: m.actCode, SectionCode: m.section }));
  }

  // 2. Generating 1000 cases and their related records
  sqlStatements.push('\n-- CaseMaster and Child Tables Data');
  let accusedCounter = 0;
  let victimCounter = 0;
  let complainantCounter = 0;
  let arrestCounter = 0;
  let chargesheetCounter = 0;

  const totalCases = 1000;
  for (let caseMasterId = 1; caseMasterId <= totalCases; caseMasterId++) {
    const subHead = getRandomElement(CRIME_SUB_HEADS);
    const headId = subHead.headId;
    const categoryId = Math.random() > 0.05 ? 1 : 2;
    const gravityId = (subHead.name === 'Murder' || subHead.name === 'Attempt to Murder' || subHead.name === 'NDPS Trafficking') ? 1 : 2;
    const station = getRandomElement(POLICE_STATIONS);
    const districtId = station.districtId;
    const districtObj = DISTRICTS.find(d => d.id === districtId)!;
    const officerId = getRandomElement(employeeIds);
    const year = getRandomRange(2020, 2026);
    const month = String(getRandomRange(1, 12)).padStart(2, '0');
    const day = String(getRandomRange(1, 28)).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const serialStr = String(caseMasterId).padStart(5, '0');
    const crimeNo = `${categoryId}${String(districtId).padStart(4, '0')}${String(station.id).padStart(4, '0')}${year}${serialStr}`;
    const caseNo = `${year}${serialStr}`;

    const latOffset = getRandomFloat(-0.06, 0.06);
    const lngOffset = getRandomFloat(-0.06, 0.06);
    const lat = districtObj.lat + latOffset;
    const lng = districtObj.lng + lngOffset;

    const templates = FACTS_TEMPLATES[headId as keyof typeof FACTS_TEMPLATES] || FACTS_TEMPLATES[2];
    let brief = getRandomElement(templates);
    let accusedName = '';
    const isRepeat = Math.random() < 0.25;
    if (isRepeat) {
      accusedName = getRandomElement(REPEAT_ACCUSED_POOL);
    } else {
      accusedName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
    }
    brief = brief.replace(/{date}/g, dateStr).replace(/{accused}/g, accusedName);
    const statusId = year <= 2024 ? (Math.random() > 0.3 ? 2 : 3) : 1;
    const courtId = districtId;

    // CaseMaster
    sqlStatements.push(generateInsertSQL('CaseMaster', {
      CaseMasterID: caseMasterId,
      CrimeNo: crimeNo,
      CaseNo: caseNo,
      CrimeRegisteredDate: dateStr,
      PolicePersonID: officerId,
      PoliceStationID: station.id,
      CaseCategoryID: categoryId,
      GravityOffenceID: gravityId,
      CrimeMajorHeadID: headId,
      CrimeMinorHeadID: subHead.id,
      CaseStatusID: statusId,
      CourtID: courtId,
      IncidentFromDate: dateStr,
      IncidentToDate: dateStr,
      InfoReceivedPSDate: dateStr,
      latitude: lat,
      longitude: lng,
      BriefFacts: brief
    }));

    // Complainant Details
    const compName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
    complainantCounter++;
    sqlStatements.push(generateInsertSQL('ComplainantDetails', {
      ComplainantID: complainantCounter,
      CaseMasterID: caseMasterId, ComplainantName: compName, AgeYear: getRandomRange(20, 60),
      OccupationID: getRandomRange(1, 6), ReligionID: getRandomRange(1, 5), CasteID: getRandomRange(1, 4), GenderID: getRandomRange(1, 2)
    }));

    // Victim Details
    const vicName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
    victimCounter++;
    sqlStatements.push(generateInsertSQL('Victim', {
      VictimMasterID: victimCounter,
      CaseMasterID: caseMasterId, VictimName: vicName, AgeYear: getRandomRange(18, 55),
      GenderID: getRandomRange(1, 2), VictimPolice: '0'
    }));

    // Accused Details
    const accPersonID = isRepeat ? `ACC-R-${REPEAT_ACCUSED_POOL.indexOf(accusedName) + 1}` : `ACC-U-${caseMasterId}`;
    accusedCounter++;
    sqlStatements.push(generateInsertSQL('Accused', {
      AccusedMasterID: accusedCounter,
      CaseMasterID: caseMasterId, AccusedName: accusedName, AgeYear: getRandomRange(20, 50),
      GenderID: getRandomRange(1, 2), PersonID: accPersonID
    }));
    const accusedMasterId = accusedCounter;

    // ActSectionAssociation
    const mappedSections = SECTIONS.filter(s => {
      const correspondingMapping = mapping.filter(m => m.headId === headId);
      return correspondingMapping.some(m => m.actCode === s.actCode && m.section === s.code);
    });
    
    let seqNum = 1;
    for (const ms of mappedSections) {
      sqlStatements.push(generateInsertSQL('ActSectionAssociation', {
        CaseMasterID: caseMasterId, ActID: ms.actCode, SectionID: ms.code, ActOrderID: seqNum, SectionOrderID: seqNum
      }));
      seqNum++;
    }

    // Arrest / Surrender
    const isArrested = Math.random() < 0.70;
    if (isArrested) {
      const arrestDate = `${year}-${month}-${String(getRandomRange(Number(day), 28)).padStart(2, '0')}`;
      arrestCounter++;
      sqlStatements.push(generateInsertSQL('ArrestSurrender', {
        ArrestSurrenderID: arrestCounter,
        CaseMasterID: caseMasterId, ArrestSurrenderTypeID: getRandomRange(1, 2), ArrestSurrenderDate: arrestDate,
        ArrestSurrenderStateId: 1, ArrestSurrenderDistrictId: districtId, PoliceStationID: station.id, IOID: officerId,
        CourtID: courtId, AccusedMasterID: accusedMasterId, IsAccused: 1, IsComplainantAccused: 0
      }));
      const arrestId = arrestCounter;

      sqlStatements.push(generateInsertSQL('inv_arrestsurrenderaccused', {
        ArrestSurrenderID: arrestId, AccusedMasterID: accusedMasterId
      }));
    }

    // Occurrence Time
    sqlStatements.push(generateInsertSQL('Inv_OccuranceTime', {
      CaseMasterID: caseMasterId, IncidentFromDate: dateStr, IncidentToDate: dateStr
    }));

    // Chargesheet Details
    if (statusId >= 2) {
      const csDate = `${year}-${String(Math.min(12, Number(month) + getRandomRange(1, 3))).padStart(2, '0')}-${day}`;
      chargesheetCounter++;
      sqlStatements.push(generateInsertSQL('ChargesheetDetails', {
        CSID: chargesheetCounter,
        CaseMasterID: caseMasterId, csdate: csDate, cstype: 'A', PolicePersonID: officerId
      }));
    }
  }

  const outputPath = path.join(__dirname, '..', 'zcql_query');
  fs.writeFileSync(outputPath, sqlStatements.join('\n'));
  console.log(`Successfully generated SQL insert statements and wrote to ${outputPath}`);
}

runGeneration();
