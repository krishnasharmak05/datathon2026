import * as fs from 'fs';
import * as path from 'path';
import { DeterministicParser } from '../functions/crime_intel_api/src/parser/parser';
import { ExecutionPlanner } from '../functions/crime_intel_api/src/parser/planner';
import { DeterministicSQLGenerator } from '../functions/crime_intel_api/src/parser/sql_generator';

const parser = new DeterministicParser();
const planner = new ExecutionPlanner();
const generator = new DeterministicSQLGenerator();

interface TestCaseSpec {
  category: string;
  query: string;
  expectedIntent: string;
  expectedEntities: any;
  expectedJoinGraph?: string[];
}

const testSpecs: TestCaseSpec[] = [
  // === BASIC QUERIES ===
  {
    category: 'Basic',
    query: 'How many theft cases occurred in Mysuru?',
    expectedIntent: 'COUNT',
    expectedEntities: { districtId: 2, district: 'Mysuru', crimeSubHeadId: 5, crimeSubHead: 'Theft', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  },
  {
    category: 'Basic',
    query: 'How many robberies occurred in Bengaluru?',
    expectedIntent: 'COUNT',
    expectedEntities: { districtId: 1, district: 'Bengaluru City', crimeSubHeadId: 7, crimeSubHead: 'Robbery', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  },
  {
    category: 'Basic',
    query: 'Show murder cases.',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 1, crimeSubHead: 'Murder', crimeHeadId: 1, crimeHead: 'Crimes Against Body' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead']
  },
  {
    category: 'Basic',
    query: 'Show cybercrime cases.',
    expectedIntent: 'LIST',
    expectedEntities: { crimeHeadId: 3, crimeHead: 'Cybercrime' },
    expectedJoinGraph: ['CaseMaster', 'CrimeHead']
  },
  {
    category: 'Basic',
    query: 'Latest robbery.',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 7, crimeSubHead: 'Robbery', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead']
  },
  {
    category: 'Basic',
    query: 'Oldest murder.',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 1, crimeSubHead: 'Murder', crimeHeadId: 1, crimeHead: 'Crimes Against Body' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead']
  },

  // === SYNONYMS ===
  {
    category: 'Synonyms',
    query: 'How many burglary cases happened?',
    expectedIntent: 'COUNT',
    expectedEntities: { crimeSubHeadId: 6, crimeSubHead: 'House Breaking', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead']
  },
  {
    category: 'Synonyms',
    query: 'Show mobile theft in Bengaluru',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 1, district: 'Bengaluru City', crimeSubHeadId: 5, crimeSubHead: 'Theft', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  },
  {
    category: 'Synonyms',
    query: 'List cyber fraud cases in Mysuru',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 2, district: 'Mysuru', crimeSubHeadId: 9, crimeSubHead: 'Online Financial Fraud', crimeHeadId: 3, crimeHead: 'Cybercrime' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  },

  // === MISSPELLINGS ===
  {
    category: 'Misspellings',
    query: 'count cases in Mysore',
    expectedIntent: 'COUNT',
    expectedEntities: { districtId: 2, district: 'Mysuru' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Misspellings',
    query: 'list cases in Bangalore',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 1, district: 'Bengaluru City' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Misspellings',
    query: 'list cases in B\'lore',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 1, district: 'Bengaluru City' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Misspellings',
    query: 'list cases in BLR',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 1, district: 'Bengaluru City' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Misspellings',
    query: 'count cases in Hubli',
    expectedIntent: 'COUNT',
    expectedEntities: { districtId: 5, district: 'Hubballi-Dharwad' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Misspellings',
    query: 'count cases in Hubballi',
    expectedIntent: 'COUNT',
    expectedEntities: { districtId: 5, district: 'Hubballi-Dharwad' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Misspellings',
    query: 'count cases in Mangalore',
    expectedIntent: 'COUNT',
    expectedEntities: { districtId: 4, district: 'Mangaluru City' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Misspellings',
    query: 'count cases in Mangaluru',
    expectedIntent: 'COUNT',
    expectedEntities: { districtId: 4, district: 'Mangaluru City' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },

  // === RELATIVE DATES ===
  {
    category: 'Relative Dates',
    query: 'List crimes today',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2026-07-25', endDate: '2026-07-25' }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes yesterday',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2026-07-24', endDate: '2026-07-24' }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes last week',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2026-07-18', endDate: '2026-07-25' }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes last month',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2026-06-25', endDate: '2026-07-25' }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes last year',
    expectedIntent: 'LIST',
    expectedEntities: { year: 2025 }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes this year',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2026-01-01', endDate: '2026-12-31' }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes last 3 years',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2024-01-01' }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes past six months',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2026-01-25', endDate: '2026-07-25' }
  },
  {
    category: 'Relative Dates',
    query: 'List crimes between Jan 2023 and Mar 2024',
    expectedIntent: 'LIST',
    expectedEntities: { startDate: '2023-01-01', endDate: '2024-03-31' }
  },

  // === MULTIPLE FILTERS ===
  {
    category: 'Multiple Filters',
    query: 'Theft in Mysuru during 2024',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 2, district: 'Mysuru', crimeSubHeadId: 5, crimeSubHead: 'Theft', crimeHeadId: 2, crimeHead: 'Crimes Against Property', year: 2024 },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  },
  {
    category: 'Multiple Filters',
    query: 'Robbery in Bengaluru handled by Kalasipalya PS',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 1, district: 'Bengaluru City', unitId: 1, unit: 'Kalasipalya PS', crimeSubHeadId: 7, crimeSubHead: 'Robbery', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  },
  {
    category: 'Multiple Filters',
    query: 'Cybercrime in Bengaluru during last year',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 1, district: 'Bengaluru City', crimeHeadId: 3, crimeHead: 'Cybercrime', year: 2025 },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeHead']
  },

  // === MULTIPLE CRIMES ===
  {
    category: 'Multiple Crimes',
    query: 'Theft and robbery',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 5, crimeSubHead: 'Theft', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead']
  },

  // === AGGREGATIONS ===
  {
    category: 'Aggregations',
    query: 'Top 5 stations',
    expectedIntent: 'LIST',
    expectedEntities: {}
  },
  {
    category: 'Aggregations',
    query: 'District with highest robbery',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 7, crimeSubHead: 'Robbery', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead']
  },
  {
    category: 'Aggregations',
    query: 'Crime trend',
    expectedIntent: 'TREND',
    expectedEntities: {}
  },
  {
    category: 'Aggregations',
    query: 'Monthly trend',
    expectedIntent: 'TREND',
    expectedEntities: {}
  },
  {
    category: 'Aggregations',
    query: 'Yearly trend',
    expectedIntent: 'TREND',
    expectedEntities: {}
  },

  // === TIMELINE ===
  {
    category: 'Timeline',
    query: 'Timeline of Case 202600001',
    expectedIntent: 'TIMELINE',
    expectedEntities: { caseNo: '202600001' }
  },
  {
    category: 'Timeline',
    query: 'Chargesheet history of Case 104430006202600001',
    expectedIntent: 'TIMELINE',
    expectedEntities: { caseNo: '104430006202600001', csType: 'A' }
  },

  // === REPEAT OFFENDERS ===
  {
    category: 'Repeat Offenders',
    query: 'All crimes involving Rajesh Kumar',
    expectedIntent: 'LIST',
    expectedEntities: { name: 'Rajesh Kumar' },
    expectedJoinGraph: ['CaseMaster', 'Accused']
  },
  {
    category: 'Repeat Offenders',
    query: 'Rajesh Kumar in Mysuru',
    expectedIntent: 'LIST',
    expectedEntities: { name: 'Rajesh Kumar', districtId: 2, district: 'Mysuru' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'Accused']
  },
  {
    category: 'Repeat Offenders',
    query: 'Repeat offenders in Bengaluru',
    expectedIntent: 'PROFILE',
    expectedEntities: { districtId: 1, district: 'Bengaluru City' }
  },

  // === ACTS AND SECTIONS ===
  {
    category: 'Acts and Sections',
    query: 'List IPC 379 cases',
    expectedIntent: 'LIST',
    expectedEntities: { act: 'IPC', section: '379' },
    expectedJoinGraph: ['CaseMaster', 'ActSectionAssociation', 'Act', 'Section']
  },
  {
    category: 'Acts and Sections',
    query: 'Count IPC 302 cases',
    expectedIntent: 'COUNT',
    expectedEntities: { act: 'IPC', section: '302' },
    expectedJoinGraph: ['CaseMaster', 'ActSectionAssociation', 'Act', 'Section']
  },
  {
    category: 'Acts and Sections',
    query: 'Show NDPS cases',
    expectedIntent: 'LIST',
    expectedEntities: { act: 'NDPS', crimeHeadId: 4, crimeHead: 'Narcotics' },
    expectedJoinGraph: ['CaseMaster', 'CrimeHead', 'ActSectionAssociation', 'Act']
  },
  {
    category: 'Acts and Sections',
    query: 'Show IT Act cases',
    expectedIntent: 'LIST',
    expectedEntities: { act: 'IT_ACT' },
    expectedJoinGraph: ['CaseMaster', 'ActSectionAssociation', 'Act']
  },
  {
    category: 'Acts and Sections',
    query: 'List Section 66C cases',
    expectedIntent: 'LIST',
    expectedEntities: { section: '66C' },
    expectedJoinGraph: ['CaseMaster', 'ActSectionAssociation', 'Section']
  },

  // === INVALID QUERIES ===
  {
    category: 'Invalid Queries',
    query: 'Alien invasion in Bengaluru',
    expectedIntent: 'INVALID',
    expectedEntities: { invalidQuery: true }
  },
  {
    category: 'Invalid Queries',
    query: 'UFO theft in Jayanagar',
    expectedIntent: 'INVALID',
    expectedEntities: { invalidQuery: true }
  },
  {
    category: 'Invalid Queries',
    query: 'Zombie attack in Mysuru',
    expectedIntent: 'INVALID',
    expectedEntities: { invalidQuery: true }
  },
  {
    category: 'Invalid Queries',
    query: 'Crime in Gotham',
    expectedIntent: 'INVALID',
    expectedEntities: { invalidQuery: true }
  },
  {
    category: 'Invalid Queries',
    query: 'Cases in Wakanda',
    expectedIntent: 'INVALID',
    expectedEntities: { invalidQuery: true }
  },

  // === CONTRADICTORY QUERIES ===
  {
    category: 'Contradictory Queries',
    query: 'Kalasipalya Police Station in Mysuru',
    expectedIntent: 'INVALID',
    expectedEntities: { contradiction: true, unit: 'Kalasipalya PS', district: 'Mysuru' }
  },
  {
    category: 'Contradictory Queries',
    query: 'Jayanagar PS in Belagavi',
    expectedIntent: 'INVALID',
    expectedEntities: { contradiction: true, unit: 'Jayanagar PS', district: 'Belagavi' }
  },

  // === SQL INJECTION ===
  {
    category: 'SQL Injection',
    query: '\'; DROP TABLE CaseMaster;',
    expectedIntent: 'LIST',
    expectedEntities: {}
  },
  {
    category: 'SQL Injection',
    query: '\' OR 1=1',
    expectedIntent: 'LIST',
    expectedEntities: {}
  },
  {
    category: 'SQL Injection',
    query: 'UNION SELECT * FROM CaseMaster',
    expectedIntent: 'LIST',
    expectedEntities: {}
  },
  {
    category: 'SQL Injection',
    query: '-- comment',
    expectedIntent: 'LIST',
    expectedEntities: {}
  },

  // === EMPTY RESULTS ===
  {
    category: 'Empty Results',
    query: 'List crimes in 2050',
    expectedIntent: 'LIST',
    expectedEntities: { year: 2050 }
  },
  {
    category: 'Empty Results',
    query: 'lookup case 9999999999999999',
    expectedIntent: 'LOOKUP',
    expectedEntities: { caseNo: '9999999999999999' }
  },
  {
    category: 'Empty Results',
    query: 'crimes involving Unknown Person',
    expectedIntent: 'LIST',
    expectedEntities: { name: 'Unknown Person' },
    expectedJoinGraph: ['CaseMaster', 'Accused']
  },

  // === RELATIONSHIP JOIN TESTS ===
  // Case ↔ Police Station ↔ District
  {
    category: 'Case ↔ Police Station ↔ District',
    query: 'Thefts in Mysuru',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 2, district: 'Mysuru', crimeSubHeadId: 5, crimeSubHead: 'Theft', crimeHeadId: 2, crimeHead: 'Crimes Against Property' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  },
  {
    category: 'Case ↔ Police Station ↔ District',
    query: 'Crimes in Bengaluru City',
    expectedIntent: 'LIST',
    expectedEntities: { districtId: 1, district: 'Bengaluru City' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Case ↔ Police Station ↔ District',
    query: 'Cases registered in Devaraja Police Station',
    expectedIntent: 'LIST',
    expectedEntities: { unitId: 4, unit: 'Devaraja PS', districtId: 2, district: 'Mysuru' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },
  {
    category: 'Case ↔ Police Station ↔ District',
    query: 'Crimes handled by Kalasipalya PS',
    expectedIntent: 'LIST',
    expectedEntities: { unitId: 1, unit: 'Kalasipalya PS', districtId: 1, district: 'Bengaluru City' },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District']
  },

  // Case ↔ Accused
  {
    category: 'Case ↔ Accused',
    query: 'Show all crimes involving Rajesh Kumar',
    expectedIntent: 'LIST',
    expectedEntities: { name: 'Rajesh Kumar' },
    expectedJoinGraph: ['CaseMaster', 'Accused']
  },
  {
    category: 'Case ↔ Accused',
    query: 'Show cases involving Mohammed Ali',
    expectedIntent: 'LIST',
    expectedEntities: { name: 'Mohammed Ali' },
    expectedJoinGraph: ['CaseMaster', 'Accused']
  },
  {
    category: 'Case ↔ Accused',
    query: 'Crimes involving male accused',
    expectedIntent: 'LIST',
    expectedEntities: { accusedGenderId: 1, accusedGender: 'Male' },
    expectedJoinGraph: ['CaseMaster', 'Accused']
  },

  // Case ↔ Victim
  {
    category: 'Case ↔ Victim',
    query: 'Kidnapping cases involving police victims',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 4, crimeSubHead: 'Kidnapping', crimeHeadId: 1, crimeHead: 'Crimes Against Body', victimPolice: 1 },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead', 'Victim']
  },
  {
    category: 'Case ↔ Victim',
    query: 'Assault cases with female victims',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 3, crimeSubHead: 'Assault', crimeHeadId: 1, crimeHead: 'Crimes Against Body', victimGenderId: 2, victimGender: 'Female' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead', 'Victim']
  },

  // Case ↔ Complainant
  {
    category: 'Case ↔ Complainant',
    query: 'Show cases filed by female complainant',
    expectedIntent: 'LIST',
    expectedEntities: { complainantGenderId: 2, complainantGender: 'Female' },
    expectedJoinGraph: ['CaseMaster', 'ComplainantDetails']
  },

  // Case ↔ Employee
  {
    category: 'Case ↔ Employee',
    query: 'FIRs registered by officer Amit Kumar',
    expectedIntent: 'LIST',
    expectedEntities: { officerName: 'Amit Kumar' },
    expectedJoinGraph: ['CaseMaster', 'Employee']
  },
  {
    category: 'Case ↔ Employee',
    query: 'Cases handled by officer KG-20025',
    expectedIntent: 'LIST',
    expectedEntities: { officerKgid: 'KG-20025', officerId: 25 },
    expectedJoinGraph: ['CaseMaster', 'Employee']
  },

  // Case ↔ Chargesheet
  {
    category: 'Case ↔ Chargesheet',
    query: 'Murder cases where chargesheet has been filed',
    expectedIntent: 'LIST',
    expectedEntities: { crimeSubHeadId: 1, crimeSubHead: 'Murder', crimeHeadId: 1, crimeHead: 'Crimes Against Body', csType: 'A' },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead', 'ChargesheetDetails']
  },
  {
    category: 'Case ↔ Chargesheet',
    query: 'Pending cases without chargesheet',
    expectedIntent: 'LIST',
    expectedEntities: { noChargesheet: true },
    expectedJoinGraph: ['CaseMaster', 'ChargesheetDetails']
  },

  // Case ↔ Court
  {
    category: 'Case ↔ Court',
    query: 'Cases pending in Court 1',
    expectedIntent: 'LIST',
    expectedEntities: { courtId: 1 },
    expectedJoinGraph: ['CaseMaster', 'Court']
  },

  // Case ↔ Act ↔ Section
  {
    category: 'Case ↔ Act ↔ Section',
    query: 'IPC 302 cases',
    expectedIntent: 'LIST',
    expectedEntities: { act: 'IPC', section: '302' },
    expectedJoinGraph: ['CaseMaster', 'ActSectionAssociation', 'Act', 'Section']
  },
  {
    category: 'Case ↔ Act ↔ Section',
    query: 'NDPS Act cases',
    expectedIntent: 'LIST',
    expectedEntities: { act: 'NDPS', crimeHeadId: 4, crimeHead: 'Narcotics' },
    expectedJoinGraph: ['CaseMaster', 'CrimeHead', 'ActSectionAssociation', 'Act']
  },
  {
    category: 'Case ↔ Act ↔ Section',
    query: 'IT Act 66C cases',
    expectedIntent: 'LIST',
    expectedEntities: { act: 'IT_ACT', section: '66C' },
    expectedJoinGraph: ['CaseMaster', 'ActSectionAssociation', 'Act', 'Section']
  },

  // Case ↔ Religion
  {
    category: 'Case ↔ Religion',
    query: 'Crimes involving Muslim complainants',
    expectedIntent: 'LIST',
    expectedEntities: { religionId: 2, religion: 'Muslim' },
    expectedJoinGraph: ['CaseMaster', 'ComplainantDetails', 'ReligionMaster']
  },

  // Case ↔ Caste
  {
    category: 'Case ↔ Caste',
    query: 'Crimes involving SC victims',
    expectedIntent: 'LIST',
    expectedEntities: { casteId: 3, caste: 'SC' },
    expectedJoinGraph: ['CaseMaster', 'ComplainantDetails', 'CasteMaster']
  },
  {
    category: 'Case ↔ Caste',
    query: 'Crimes involving ST complainants',
    expectedIntent: 'LIST',
    expectedEntities: { casteId: 4, caste: 'ST' },
    expectedJoinGraph: ['CaseMaster', 'ComplainantDetails', 'CasteMaster']
  },

  // Case ↔ Occupation
  {
    category: 'Case ↔ Occupation',
    query: 'Crimes involving students',
    expectedIntent: 'LIST',
    expectedEntities: { occupationId: 6, occupation: 'Student' },
    expectedJoinGraph: ['CaseMaster', 'ComplainantDetails', 'OccupationMaster']
  },

  // Multiple JOIN Chains
  {
    category: 'Multiple JOIN Chains',
    query: 'Show robbery cases in Mysuru where accused Rajesh Kumar has already been chargesheeted',
    expectedIntent: 'LIST',
    expectedEntities: {
      districtId: 2,
      district: 'Mysuru',
      crimeSubHeadId: 7,
      crimeSubHead: 'Robbery',
      crimeHeadId: 2,
      crimeHead: 'Crimes Against Property',
      name: 'Rajesh Kumar',
      csType: 'A',
      caseStatusId: 2,
      caseStatus: 'Charge Sheeted'
    },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead', 'CaseStatusMaster', 'Accused', 'ChargesheetDetails']
  },

  // LEFT JOIN tests
  {
    category: 'LEFT JOIN Tests',
    query: 'Cases without chargesheets',
    expectedIntent: 'LIST',
    expectedEntities: { noChargesheet: true },
    expectedJoinGraph: ['CaseMaster', 'ChargesheetDetails']
  },
  {
    category: 'LEFT JOIN Tests',
    query: 'Cases without arrests',
    expectedIntent: 'LIST',
    expectedEntities: { noArrest: true },
    expectedJoinGraph: ['CaseMaster', 'ArrestSurrender']
  },
  {
    category: 'LEFT JOIN Tests',
    query: 'Cases without victims',
    expectedIntent: 'LIST',
    expectedEntities: { noVictim: true },
    expectedJoinGraph: ['CaseMaster', 'Victim']
  },
  {
    category: 'LEFT JOIN Tests',
    query: 'Cases without accused',
    expectedIntent: 'LIST',
    expectedEntities: { noAccused: true },
    expectedJoinGraph: ['CaseMaster', 'Accused']
  }
];

// Let's programmatically expand the test specs to hit 220+ test cases
const generatedSpecs = [...testSpecs];

// Helper to add permutations
const districts = [
  { name: 'Bengaluru City', id: 1 },
  { name: 'Mysuru', id: 2 },
  { name: 'Belagavi', id: 3 },
  { name: 'Mangaluru City', id: 4 },
  { name: 'Hubballi-Dharwad', id: 5 },
  { name: 'Udupi', id: 6 },
  { name: 'Kodagu', id: 7 },
  { name: 'Mandya', id: 8 },
  { name: 'Hassan', id: 9 },
  { name: 'Shivamogga', id: 10 }
];

const crimes = [
  { name: 'Murder', id: 1, majorId: 1, majorName: 'Crimes Against Body' },
  { name: 'Attempt to Murder', id: 2, majorId: 1, majorName: 'Crimes Against Body' },
  { name: 'Assault', id: 3, majorId: 1, majorName: 'Crimes Against Body' },
  { name: 'Kidnapping', id: 4, majorId: 1, majorName: 'Crimes Against Body' },
  { name: 'Theft', id: 5, majorId: 2, majorName: 'Crimes Against Property' },
  { name: 'House Breaking', id: 6, majorId: 2, majorName: 'Crimes Against Property' },
  { name: 'Robbery', id: 7, majorId: 2, majorName: 'Crimes Against Property' },
  { name: 'Chain Snatching', id: 8, majorId: 2, majorName: 'Crimes Against Property' },
  { name: 'Online Financial Fraud', id: 9, majorId: 3, majorName: 'Cybercrime' },
  { name: 'Phishing', id: 10, majorId: 3, majorName: 'Cybercrime' }
];

const years = [2021, 2022, 2023, 2024, 2025, 2026];

// Add basic crime + district permutations (100 cases)
for (const d of districts) {
  for (const c of crimes) {
    generatedSpecs.push({
      category: 'Basic Permutations',
      query: `How many ${c.name.toLowerCase()} cases occurred in ${d.name}?`,
      expectedIntent: 'COUNT',
      expectedEntities: {
        districtId: d.id,
        district: d.name,
        crimeSubHeadId: c.id,
        crimeSubHead: c.name,
        crimeHeadId: c.majorId,
        crimeHead: c.majorName
      },
      expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
    });

    generatedSpecs.push({
      category: 'Basic Permutations',
      query: `List ${c.name.toLowerCase()} cases in ${d.name}`,
      expectedIntent: 'LIST',
      expectedEntities: {
        districtId: d.id,
        district: d.name,
        crimeSubHeadId: c.id,
        crimeSubHead: c.name,
        crimeHeadId: c.majorId,
        crimeHead: c.majorName
      },
      expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
    });
  }
}

// Add some year-based permutations (30 cases)
for (const y of years) {
  generatedSpecs.push({
    category: 'Year Permutations',
    query: `How many theft cases happened in ${y}?`,
    expectedIntent: 'COUNT',
    expectedEntities: {
      crimeSubHeadId: 5,
      crimeSubHead: 'Theft',
      crimeHeadId: 2,
      crimeHead: 'Crimes Against Property',
      year: y
    },
    expectedJoinGraph: ['CaseMaster', 'CrimeSubHead']
  });

  generatedSpecs.push({
    category: 'Year Permutations',
    query: `List murder cases in Mysuru during ${y}`,
    expectedIntent: 'LIST',
    expectedEntities: {
      districtId: 2,
      district: 'Mysuru',
      crimeSubHeadId: 1,
      crimeSubHead: 'Murder',
      crimeHeadId: 1,
      crimeHead: 'Crimes Against Body',
      year: y
    },
    expectedJoinGraph: ['CaseMaster', 'Unit', 'District', 'CrimeSubHead']
  });
}

// Add some demographics permutations (30 cases)
const castes = [
  { name: 'OBC', id: 2 },
  { name: 'SC', id: 3 },
  { name: 'ST', id: 4 }
];
const occupations = [
  { name: 'Farmer', id: 1 },
  { name: 'Business Owner', id: 2 },
  { name: 'Government Employee', id: 3 },
  { name: 'Student', id: 6 }
];

for (const caste of castes) {
  for (const occ of occupations) {
    generatedSpecs.push({
      category: 'Demographics Permutations',
      query: `List cases involving ${caste.name} ${occ.name.toLowerCase()} complainants`,
      expectedIntent: 'LIST',
      expectedEntities: {
        casteId: caste.id,
        caste: caste.name,
        occupationId: occ.id,
        occupation: occ.name
      },
      expectedJoinGraph: ['CaseMaster', 'ComplainantDetails', 'CasteMaster', 'OccupationMaster']
    });
  }
}

// Compile everything into structured TestCase elements
const finalSuite = generatedSpecs.map((spec, index) => {
  const parsed = parser.parse(spec.query);
  if (!parsed) {
    throw new Error(`Failed to parse speculative query: "${spec.query}"`);
  }

  // Generate SQL dynamically
  const generatedSQL = generator.generate(parsed);
  const plan = planner.plan(parsed);

  return {
    id: index + 1,
    name: `${spec.category} - ${spec.expectedIntent} - Test ${index + 1}`,
    query: spec.query,
    expected: {
      intent: spec.expectedIntent,
      entities: spec.expectedEntities,
      planner: plan.steps,
      sql: generatedSQL.sql,
      parameters: generatedSQL.params,
      join_graph: spec.expectedJoinGraph || generatedSQL.joinGraph
    }
  };
});

// Ensure directory exists
const targetDir = path.resolve(__dirname, 'datasets');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetFile = path.join(targetDir, 'regression.json');
fs.writeFileSync(targetFile, JSON.stringify(finalSuite, null, 2), 'utf-8');

console.log(`Generated ${finalSuite.length} test cases in ${targetFile}`);
