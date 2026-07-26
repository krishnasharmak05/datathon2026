import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DeterministicParser } from './parser';

describe('DeterministicParser Tests', () => {
  const parser = new DeterministicParser();

  // Helper to run parse and assert non-null
  function parseOrThrow(query: string) {
    const res = parser.parse(query);
    assert.ok(res, `Failed to parse query: "${query}"`);
    return res;
  }

  test('Intent Detection', () => {
    assert.strictEqual(parseOrThrow('how many cases').intent, 'COUNT');
    assert.strictEqual(parseOrThrow('compare Mysuru vs Mandya').intent, 'COMPARE');
    assert.strictEqual(parseOrThrow('monthly trend of cybercrime').intent, 'TREND');
    assert.strictEqual(parseOrThrow('hotspots in Bengaluru').intent, 'HOTSPOT');
    assert.strictEqual(parseOrThrow('co-accused network of Rajesh').intent, 'NETWORK');
    assert.strictEqual(parseOrThrow('timeline of case 202600001').intent, 'TIMELINE');
    assert.strictEqual(parseOrThrow('predict future recidivism').intent, 'PREDICTION');
    assert.strictEqual(parseOrThrow('offender profile of Vikram').intent, 'PROFILE');
    assert.strictEqual(parseOrThrow('summarize facts').intent, 'SUMMARY');
    assert.strictEqual(parseOrThrow('list robbery cases').intent, 'LIST');
    assert.strictEqual(parseOrThrow('lookup case 104430006202600001').intent, 'LOOKUP');
  });

  test('Location Parsing & Compare Mode', () => {
    const blr = parseOrThrow('count cases in Bengaluru City');
    assert.strictEqual(blr.entities.district, 'Bengaluru City');
    assert.strictEqual(blr.entities.districtId, 1);

    const blrAlias = parseOrThrow('count cases in bangalore');
    assert.strictEqual(blrAlias.entities.district, 'Bengaluru City');
    assert.strictEqual(blrAlias.entities.districtId, 1);

    const jayanagar = parseOrThrow('list cases in jayanagar');
    assert.strictEqual(jayanagar.entities.unit, 'Jayanagar PS');
    assert.strictEqual(jayanagar.entities.unitId, 2);

    const comp = parseOrThrow('compare Mysuru vs Mandya');
    assert.strictEqual(comp.entities.district, 'Mysuru');
    assert.strictEqual(comp.entities.districtId, 2);
    assert.strictEqual(comp.entities.compareWith, 'Mandya');
    assert.strictEqual(comp.entities.compareWithId, 8);
  });

  test('Crime Head & Sub-Head Extraction', () => {
    const head = parseOrThrow('count cybercrime cases');
    assert.strictEqual(head.entities.crimeHead, 'Cybercrime');
    assert.strictEqual(head.entities.crimeHeadId, 3);

    const subhead = parseOrThrow('list burglary cases');
    assert.strictEqual(subhead.entities.crimeSubHead, 'House Breaking');
    assert.strictEqual(subhead.entities.crimeSubHeadId, 6);
    // Should auto-infer crime head
    assert.strictEqual(subhead.entities.crimeHead, 'Crimes Against Property');
    assert.strictEqual(subhead.entities.crimeHeadId, 2);
  });

  test('Acts & Sections Parsing', () => {
    const case1 = parseOrThrow('list cases under section 302 IPC');
    assert.strictEqual(case1.entities.act, 'IPC');
    assert.strictEqual(case1.entities.section, '302');

    const case2 = parseOrThrow('count cases with IPC 379');
    assert.strictEqual(case2.entities.act, 'IPC');
    assert.strictEqual(case2.entities.section, '379');

    const case3 = parseOrThrow('list u/s 66C of IT Act');
    assert.strictEqual(case3.entities.act, 'IT_ACT');
    assert.strictEqual(case3.entities.section, '66C');

    const case4 = parseOrThrow('count NDPS section 20 cases');
    assert.strictEqual(case4.entities.act, 'NDPS');
    assert.strictEqual(case4.entities.section, '20');

    const case5 = parseOrThrow('list cases under sec 448');
    assert.strictEqual(case5.entities.section, '448');
  });

  test('Case Category & Gravity & Status', () => {
    // Categories
    assert.strictEqual(parseOrThrow('count zero fir cases').entities.caseCategory, 'Zero FIR');
    assert.strictEqual(parseOrThrow('count zero fir cases').entities.caseCategoryId, 3);
    assert.strictEqual(parseOrThrow('count udr cases').entities.caseCategory, 'UDR');
    assert.strictEqual(parseOrThrow('count udr cases').entities.caseCategoryId, 2);

    // Gravity
    assert.strictEqual(parseOrThrow('count heinous cases').entities.gravity, 'Heinous');
    assert.strictEqual(parseOrThrow('count heinous cases').entities.gravityId, 1);
    assert.strictEqual(parseOrThrow('list non-heinous cases').entities.gravity, 'Non-Heinous');
    assert.strictEqual(parseOrThrow('list non-heinous cases').entities.gravityId, 2);

    // Statuses
    assert.strictEqual(parseOrThrow('count cases under investigation').entities.caseStatus, 'Under Investigation');
    assert.strictEqual(parseOrThrow('count cases under investigation').entities.caseStatusId, 1);
    assert.strictEqual(parseOrThrow('list charge sheeted cases').entities.caseStatus, 'Charge Sheeted');
    assert.strictEqual(parseOrThrow('list charge sheeted cases').entities.caseStatusId, 2);
    assert.strictEqual(parseOrThrow('list closed cases').entities.caseStatus, 'Closed');
    assert.strictEqual(parseOrThrow('list closed cases').entities.caseStatusId, 3);
  });

  test('Demographics: Caste, Religion, Occupation', () => {
    // Caste
    const sc = parseOrThrow('count SC caste cases');
    assert.strictEqual(sc.entities.caste, 'SC');
    assert.strictEqual(sc.entities.casteId, 3);

    // Religion
    const muslim = parseOrThrow('count cases with muslim complainants');
    assert.strictEqual(muslim.entities.religion, 'Muslim');
    assert.strictEqual(muslim.entities.religionId, 2);

    // Occupation
    const farmer = parseOrThrow('list cases with farmer complainants');
    assert.strictEqual(farmer.entities.occupation, 'Farmer');
    assert.strictEqual(farmer.entities.occupationId, 1);
  });

  test('Genders (Context-Sensitive)', () => {
    const comp = parseOrThrow('count cases where complainant is female');
    assert.strictEqual(comp.entities.complainantGender, 'Female');
    assert.strictEqual(comp.entities.complainantGenderId, 2);

    const victim = parseOrThrow('count cases with male victim');
    assert.strictEqual(victim.entities.victimGender, 'Male');
    assert.strictEqual(victim.entities.victimGenderId, 1);

    const accused = parseOrThrow('list cases with transgender accused');
    assert.strictEqual(accused.entities.accusedGender, 'Transgender');
    assert.strictEqual(accused.entities.accusedGenderId, 3);
  });

  test('Officer Details & KGID', () => {
    const officer = parseOrThrow('list cases by officer KG-20025');
    assert.strictEqual(officer.entities.officerKgid, 'KG-20025');
    assert.strictEqual(officer.entities.officerId, 25);

    const namedOfficer = parseOrThrow('list cases registered by officer Amit Kumar');
    assert.strictEqual(namedOfficer.entities.officerName, 'Amit Kumar');
  });

  test('Victim is Police & Chargesheet Types', () => {
    const cop = parseOrThrow('count cases where victim is police');
    assert.strictEqual(cop.entities.victimPolice, 1);

    const csB = parseOrThrow('count false cases');
    assert.strictEqual(csB.entities.csType, 'B');

    const csC = parseOrThrow('count undetected cases');
    assert.strictEqual(csC.entities.csType, 'C');
  });

  test('Date Ranges & Year Handling', () => {
    const singleYear = parseOrThrow('list cases in 2023');
    assert.strictEqual(singleYear.entities.year, 2023);

    const between = parseOrThrow('list cases between 2021 and 2025');
    assert.strictEqual(between.entities.startDate, '2021-01-01');
    assert.strictEqual(between.entities.endDate, '2025-12-31');

    const since = parseOrThrow('list cases since 2024');
    assert.strictEqual(since.entities.startDate, '2024-01-01');

    const before = parseOrThrow('list cases before 2023');
    assert.strictEqual(before.entities.endDate, '2023-12-31');

    const relative = parseOrThrow('list cases over the last 3 years');
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 3 + 1;
    assert.strictEqual(relative.entities.startDate, `${startYear}-01-01`);

    const lastYear = parseOrThrow('list cases from last year');
    assert.strictEqual(lastYear.entities.year, currentYear - 1);
  });

  test('PersonID/AccusedID Parsing', () => {
    const res = parseOrThrow('ACC-U-5');
    assert.strictEqual(res.intent, 'PROFILE');
    assert.strictEqual(res.entities.name, 'ACC-U-5');
    assert.strictEqual(res.entities.caseNo, 'ACC-U-5');

    const timelineRes = parseOrThrow('timeline of ACC-R-12');
    assert.strictEqual(timelineRes.intent, 'TIMELINE');
    assert.strictEqual(timelineRes.entities.name, 'ACC-R-12');
    assert.strictEqual(timelineRes.entities.caseNo, 'ACC-R-12');
  });
});
