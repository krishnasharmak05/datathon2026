import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as fs from 'fs';
import * as path from 'path';

// Define directories
const DB_DIR = __dirname;
const DB_FILE = path.join(DB_DIR, 'police_fir.db');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

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
  1: [ // Murder / Attempt
    "On {date}, the accused {accused} picked up a quarrel with the victim over a property dispute. In a fit of rage, the accused assaulted the victim with a sharp weapon, causing severe injuries leading to death.",
    "Complainant reported that on the night of {date}, a group of individuals including {accused} forcefully entered their house and attacked their brother with iron rods with the intention of murdering him."
  ],
  2: [ // Theft / House Breaking
    "The complainant stated that they locked their house and went out. Upon returning on {date}, they found the lock broken and gold ornaments weighing 50g along with cash stolen from the locker.",
    "On {date}, at Kalasipalya market, the accused was caught red-handed while stealing a mobile phone and wallet from a passenger boarding the bus."
  ],
  3: [ // Cybercrime
    "The complainant received a call from an unknown person claiming to be a bank manager. Under the pretext of KYC update, the caller obtained OTP and fraudulently transferred Rs 75,000 from the complainant's account.",
    "The complainant reported that an unknown person created a fake social media profile using their photos and details, and sent obscene messages to their contacts."
  ],
  4: [ // Narcotics
    "Acting on a tip-off, the police team raided a spot near Bangalore University on {date} and apprehended the accused carrying 2.5 kg of contraband Ganja in a backpack.",
    "The accused was found selling synthetic MDMA drugs to college students near Mangalore beach. Police seized 15 grams of MDMA crystals from their possession."
  ],
  5: [ // Cheating
    "The accused collected Rs 12 Lakhs from the complainant promising to secure a government job in KSRTC. However, the accused failed to provide the job and refused to return the money.",
    "The accused sold a piece of land to the complainant using forged documents, claiming sole ownership, while the property was already mortgaged to a bank."
  ],
  6: [ // Rioting
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

async function seed() {
  console.log('Starting DB Seeding...');
  
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
    console.log('Deleted existing database file.');
  }

  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  // Execute Schema SQL
  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  await db.exec(schemaSql);
  console.log('Database tables created from schema.sql');

  // Begin Transaction
  await db.exec('BEGIN TRANSACTION');

  try {
    // 1. Seed State
    await db.run(`INSERT INTO State (StateID, StateName, NationalityID, Active) VALUES (1, 'Karnataka', 1, 1)`);

    // 2. Seed Districts
    for (const d of DISTRICTS) {
      await db.run(`INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (?, ?, 1, 1)`, d.id, d.name);
    }

    // 3. Seed Courts
    for (const d of DISTRICTS) {
      await db.run(`INSERT INTO Court (CourtID, CourtName, DistrictID, StateID, Active) VALUES (?, ?, ?, 1, 1)`, d.id, `District Court - ${d.name}`, d.id);
      await db.run(`INSERT INTO Court (CourtID, CourtName, DistrictID, StateID, Active) VALUES (?, ?, ?, 1, 1)`, d.id + 100, `Judicial Magistrate First Class - ${d.name}`, d.id);
    }

    // 4. Seed UnitType
    await db.run(`INSERT INTO UnitType (UnitTypeID, UnitTypeName, CityDistState) VALUES (1, 'Police Station', 'City')`);
    await db.run(`INSERT INTO UnitType (UnitTypeID, UnitTypeName, CityDistState) VALUES (2, 'Circle Office', 'District')`);

    // 5. Seed Units
    for (const u of POLICE_STATIONS) {
      await db.run(`INSERT INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active) VALUES (?, ?, 1, NULL, 1, 1, ?, 1)`, u.id, u.name, u.districtId);
    }

    // 6. Seed Ranks
    const ranks = [
      { id: 1, name: 'Police Constable', hierarchy: 6 },
      { id: 2, name: 'Head Constable', hierarchy: 5 },
      { id: 3, name: 'Assistant Sub-Inspector', hierarchy: 4 },
      { id: 4, name: 'Sub-Inspector', hierarchy: 3 },
      { id: 5, name: 'Inspector', hierarchy: 2 },
      { id: 6, name: 'Deputy Superintendent', hierarchy: 1 },
    ];
    for (const r of ranks) {
      await db.run(`INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (?, ?, ?, 1)`, r.id, r.name, r.hierarchy);
    }

    // 7. Seed Designations
    const designations = [
      { id: 1, name: 'Investigating Officer', sort: 1 },
      { id: 2, name: 'Station House Officer', sort: 2 },
      { id: 3, name: 'Writer', sort: 3 },
    ];
    for (const ds of designations) {
      await db.run(`INSERT INTO Designation (DesignationID, DesignationName, Active, SortOrder) VALUES (?, ?, 1, ?)`, ds.id, ds.name, ds.sort);
    }

    // 8. Seed Employees (Officers)
    const employeesCount = 40;
    const employeeIds: number[] = [];
    for (let i = 1; i <= employeesCount; i++) {
      const fName = getRandomElement(FIRST_NAMES);
      const lName = getRandomElement(LAST_NAMES);
      const name = `${fName} ${lName}`;
      const districtId = getRandomElement(DISTRICTS).id;
      const unit = getRandomElement(POLICE_STATIONS.filter(u => u.districtId === districtId)) || POLICE_STATIONS[0];
      const rankId = getRandomRange(1, 5);
      const desigId = rankId >= 4 ? 2 : 1; // SI or Inspector are SHO
      const kgid = `KG-${20000 + i}`;
      const dob = `${1970 + getRandomRange(0, 25)}-0${getRandomRange(1, 9)}-${10 + getRandomRange(0, 18)}`;
      const apptDate = `${2000 + getRandomRange(0, 20)}-0${getRandomRange(1, 9)}-${10 + getRandomRange(0, 18)}`;
      
      await db.run(
        `INSERT INTO Employee (EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID, BloodGroupID, PhysicallyChallenged, AppointmentDate) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        i, districtId, unit.id, rankId, desigId, kgid, name, dob, getRandomRange(1, 2), getRandomRange(1, 4), apptDate
      );
      employeeIds.push(i);
    }

    // 9. Seed CaseCategory
    await db.run(`INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (1, 'FIR')`);
    await db.run(`INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (2, 'UDR')`);
    await db.run(`INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (3, 'Zero FIR')`);
    await db.run(`INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (4, 'PAR')`);

    // 10. Seed GravityOffence
    await db.run(`INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES (1, 'Heinous')`);
    await db.run(`INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES (2, 'Non-Heinous')`);

    // 11. Seed CaseStatusMaster
    await db.run(`INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (1, 'Under Investigation')`);
    await db.run(`INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (2, 'Charge Sheeted')`);
    await db.run(`INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (3, 'Closed')`);

    // 12. Seed ReligionMaster
    const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain'];
    for (let rIdx = 0; rIdx < religions.length; rIdx++) {
      await db.run(`INSERT INTO ReligionMaster (ReligionID, ReligionName) VALUES (?, ?)`, rIdx + 1, religions[rIdx]);
    }

    // 13. Seed CasteMaster
    const castes = ['General', 'OBC', 'SC', 'ST'];
    for (let cIdx = 0; cIdx < castes.length; cIdx++) {
      await db.run(`INSERT INTO CasteMaster (caste_master_id, caste_master_name) VALUES (?, ?)`, cIdx + 1, castes[cIdx]);
    }

    // 14. Seed OccupationMaster
    const occupations = ['Farmer', 'Business Owner', 'Government Employee', 'Private Employee', 'Unemployed', 'Student'];
    for (let oIdx = 0; oIdx < occupations.length; oIdx++) {
      await db.run(`INSERT INTO OccupationMaster (OccupationID, OccupationName) VALUES (?, ?)`, oIdx + 1, occupations[oIdx]);
    }

    // 15. Seed CrimeHead
    for (const h of CRIME_HEADS) {
      await db.run(`INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (?, ?, 1)`, h.id, h.name);
    }

    // 16. Seed CrimeSubHead
    for (const sh of CRIME_SUB_HEADS) {
      await db.run(`INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (?, ?, ?, ?)`, sh.id, sh.headId, sh.name, sh.seq);
    }

    // 17. Seed Act
    for (const a of ACTS) {
      await db.run(`INSERT INTO Act (ActCode, ActDescription, ShortName, Active) VALUES (?, ?, ?, 1)`, a.code, a.desc, a.short);
    }

    // 18. Seed Section
    for (const s of SECTIONS) {
      await db.run(`INSERT INTO Section (ActCode, SectionCode, SectionDescription, Active) VALUES (?, ?, ?, 1)`, s.actCode, s.code, s.desc);
    }

    // 19. Seed CrimeHeadActSection
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
      await db.run(`INSERT INTO CrimeHeadActSection (CrimeHeadID, ActCode, SectionCode) VALUES (?, ?, ?)`, m.headId, m.actCode, m.section);
    }

    // 20. Seed CaseMaster & associated entities (Complainant, Victim, Accused, Arrests, Chargesheets)
    // We will generate 1000 cases to provide rich statistical databases.
    const casesCount = 1000;
    
    // Track case numbers for repeat offender linking
    const crimeTypes = CRIME_SUB_HEADS;
    
    for (let c = 1; c <= casesCount; c++) {
      const subHead = getRandomElement(crimeTypes);
      const headId = subHead.headId;
      
      const categoryId = Math.random() > 0.05 ? 1 : 2; // 95% FIR, 5% UDR
      const gravityId = (subHead.name === 'Murder' || subHead.name === 'Attempt to Murder' || subHead.name === 'NDPS Trafficking') ? 1 : 2;
      
      // Select station & matching district
      const station = getRandomElement(POLICE_STATIONS);
      const districtId = station.districtId;
      const districtObj = DISTRICTS.find(d => d.id === districtId)!;
      
      // Assign case officer
      const officersAtStation = employeeIds; // Simplify
      const officerId = getRandomElement(officersAtStation);
      
      const year = getRandomRange(2020, 2026);
      const month = String(getRandomRange(1, 12)).padStart(2, '0');
      const day = String(getRandomRange(1, 28)).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Unique serial
      const serialStr = String(c).padStart(5, '0');
      // Format: 1 digit category (1=FIR, 2=UDR) + 4 digit district + 4 digit station + 4 digit year + 5 digit running serial
      const crimeNo = `${categoryId}${String(districtId).padStart(4, '0')}${String(station.id).padStart(4, '0')}${year}${serialStr}`;
      const caseNo = `${year}${serialStr}`;
      
      // Add GPS with offset from district center to create hotspots
      const latOffset = getRandomFloat(-0.06, 0.06);
      const lngOffset = getRandomFloat(-0.06, 0.06);
      const lat = districtObj.lat + latOffset;
      const lng = districtObj.lng + lngOffset;
      
      // Build brief facts
      const templates = FACTS_TEMPLATES[headId as keyof typeof FACTS_TEMPLATES] || FACTS_TEMPLATES[2];
      let brief = getRandomElement(templates);
      
      // Assign accused
      let accusedName = '';
      let isRepeat = Math.random() < 0.25; // 25% repeat offender probability
      if (isRepeat) {
        accusedName = getRandomElement(REPEAT_ACCUSED_POOL);
      } else {
        accusedName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
      }
      
      brief = brief.replace(/{date}/g, dateStr).replace(/{accused}/g, accusedName);
      
      // Insert CaseMaster
      const statusId = year <= 2024 ? (Math.random() > 0.3 ? 2 : 3) : 1; // older cases are chargesheeted/closed
      const courtId = districtId;
      
      const result = await db.run(
        `INSERT INTO CaseMaster (CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        crimeNo, caseNo, dateStr, officerId, station.id, categoryId, gravityId, headId, subHead.id, statusId, courtId, dateStr, dateStr, dateStr, lat, lng, brief
      );
      
      const caseId = result.lastID!;

      // Insert Complainant
      const compName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
      await db.run(
        `INSERT INTO ComplainantDetails (CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        caseId, compName, getRandomRange(20, 60), getRandomRange(1, 6), getRandomRange(1, 5), getRandomRange(1, 4), getRandomRange(1, 2)
      );

      // Insert Victim
      const vicName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
      await db.run(
        `INSERT INTO Victim (CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) 
         VALUES (?, ?, ?, ?, '0')`,
        caseId, vicName, getRandomRange(18, 55), getRandomRange(1, 2)
      );

      // Insert Accused
      const accAge = getRandomRange(20, 50);
      const accGender = getRandomRange(1, 2);
      const accPersonID = isRepeat ? `ACC-R-${REPEAT_ACCUSED_POOL.indexOf(accusedName) + 1}` : `ACC-U-${caseId}`;
      const accResult = await db.run(
        `INSERT INTO Accused (CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) 
         VALUES (?, ?, ?, ?, ?)`,
        caseId, accusedName, accAge, accGender, accPersonID
      );
      const accusedId = accResult.lastID!;

      // Insert ActSectionAssociation (link mapping sections)
      const mappedSections = SECTIONS.filter(s => {
        const correspondingMapping = mapping.filter(m => m.headId === headId);
        return correspondingMapping.some(m => m.actCode === s.actCode && m.section === s.code);
      });
      
      let seqNum = 1;
      for (const ms of mappedSections) {
        await db.run(
          `INSERT INTO ActSectionAssociation (CaseMasterID, ActID, SectionID, ActOrderID, SectionOrderID) 
           VALUES (?, ?, ?, ?, ?)`,
          caseId, ms.actCode, ms.code, seqNum, seqNum
        );
        seqNum++;
      }

      // Insert ArrestSurrender for a portion of cases
      const isArrested = Math.random() < 0.70;
      if (isArrested) {
        const arrestDate = `${year}-${month}-${String(getRandomRange(Number(day), 28)).padStart(2, '0')}`;
        const arrResult = await db.run(
          `INSERT INTO ArrestSurrender (CaseMasterID, ArrestSurrenderTypeID, ArrestSurrenderDate, ArrestSurrenderStateId, ArrestSurrenderDistrictId, PoliceStationID, IOID, CourtID, AccusedMasterID, IsAccused, IsComplainantAccused) 
           VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, 1, 0)`,
          caseId, getRandomRange(1, 2), arrestDate, districtId, station.id, officerId, courtId, accusedId
        );
        const arrestId = arrResult.lastID!;

        // Add to junction
        await db.run(
          `INSERT INTO inv_arrestsurrenderaccused (ArrestSurrenderID, AccusedMasterID) 
           VALUES (?, ?)`,
          arrestId, accusedId
        );
      }

      // Insert Occurrence Time
      await db.run(
        `INSERT INTO Inv_OccuranceTime (CaseMasterID, IncidentFromDate, IncidentToDate) 
         VALUES (?, ?, ?)`,
        caseId, dateStr, dateStr
      );

      // Insert Chargesheet for closed or chargesheeted cases
      if (statusId >= 2) {
        const csDate = `${year}-${String(Math.min(12, Number(month) + getRandomRange(1, 3))).padStart(2, '0')}-${day}`;
        await db.run(
          `INSERT INTO ChargesheetDetails (CaseMasterID, csdate, cstype, PolicePersonID) 
           VALUES (?, ?, 'A', ?)`,
          caseId, csDate, officerId
        );
      }
    }

    await db.exec('COMMIT');
    console.log(`Seeding complete! Seeded:
      - 1 State
      - ${DISTRICTS.length} Districts
      - ${POLICE_STATIONS.length} Units (Police Stations)
      - ${employeesCount} Employees (Officers)
      - ${casesCount} CaseMaster records, along with Victims, Accused, and Complainants.
    `);

  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Seeding failed! Rollback triggered.', error);
  } finally {
    await db.close();
  }
}

seed().catch(console.error);
