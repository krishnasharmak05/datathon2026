import * as repos from '../core/repos';
import { SqlTracer } from './sql_tracer';
import { DeterministicSQLGenerator } from '../parser/sql_generator';
import { CatalystContext } from '../core/context';

const sqlGenerator = new DeterministicSQLGenerator();

// ----------------------------------------------------
// 1. ZCQL Helper Utilities
// ----------------------------------------------------

function escapeString(str: string): string {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case "\0": return "\\0";
      case "\x08": return "\\b";
      case "\x09": return "\\t";
      case "\x1a": return "\\z";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\" + char;
      default:
        return char;
    }
  });
}

export function bindParameters(sql: string, params: any[]): string {
  let paramIndex = 0;
  return sql.replace(/\?/g, () => {
    if (paramIndex >= params.length) {
      throw new Error(`Parameter mismatch: expected at least ${paramIndex + 1} parameters, but only ${params.length} were provided.`);
    }
    const val = params[paramIndex++];
    if (val === null || val === undefined) {
      return 'NULL';
    }
    if (typeof val === 'number') {
      return String(val);
    }
    if (typeof val === 'boolean') {
      return val ? '1' : '0';
    }
    return `'${escapeString(String(val))}'`;
  });
}

export function flattenCatalystRow(row: any): any {
  const flat: any = {};
  for (const tableKey of Object.keys(row)) {
    const tableData = row[tableKey];
    if (tableData && typeof tableData === 'object') {
      Object.assign(flat, tableData);
    } else {
      flat[tableKey] = tableData;
    }
  }
  return flat;
}

export async function executeZCQL(sql: string, params: any[] = []): Promise<any[]> {
  const boundSql = bindParameters(sql, params);
  
  // ZCQL compatibility rewriting:
  // Rewrite SQLite Year filter strftime('%Y', CaseMaster.CrimeRegisteredDate) = '2023'
  // into CaseMaster.CrimeRegisteredDate BETWEEN '2023-01-01 00:00:00' AND '2023-12-31 23:59:59'
  const rewrittenSql = boundSql.replace(
    /strftime\('%Y',\s*([\w\.]+)?CrimeRegisteredDate\)\s*=\s*'(\d{4})'/gi,
    (match, tablePrefix, year) => {
      const prefix = tablePrefix || '';
      return `${prefix}CrimeRegisteredDate BETWEEN '${year}-01-01 00:00:00' AND '${year}-12-31 23:59:59'`;
    }
  );

  SqlTracer.trace(rewrittenSql);

  const app = CatalystContext.current();
  const zcql = app.zcql();
  const rawRows = await zcql.executeZCQLQuery(rewrittenSql);
  
  const flattened = rawRows.map(flattenCatalystRow);
  SqlTracer.addRows(flattened.length);
  return flattened;
}

// ----------------------------------------------------
// 2. Repository Implementations
// ----------------------------------------------------

export class CatalystCaseRepository implements repos.CaseRepository {
  async getById(id: number): Promise<repos.Case | null> {
    const sql = `SELECT * FROM CaseMaster WHERE CaseMasterID = ?`;
    const rows = await executeZCQL(sql, [id]);
    return rows[0] || null;
  }

  async getByCrimeNo(crimeNo: string): Promise<repos.Case | null> {
    const sql = `
      SELECT * FROM CaseMaster 
      WHERE CrimeNo = ? OR CaseNo = ?
      OR CaseMasterID IN (
        SELECT CaseMasterID FROM Accused WHERE PersonID = ?
      )
    `;
    const rows = await executeZCQL(sql, [crimeNo, crimeNo, crimeNo]);
    return rows[0] || null;
  }

  async list(filter?: any): Promise<repos.Case[]> {
    const generated = sqlGenerator.generate({
      intent: 'LIST',
      entities: filter || {},
      confidence: 1.0,
      pipelineStage: 'deterministic'
    });
    return executeZCQL(generated.sql, generated.params);
  }

  async count(filter?: any): Promise<number> {
    const generated = sqlGenerator.generate({
      intent: 'COUNT',
      entities: filter || {},
      confidence: 1.0,
      pipelineStage: 'deterministic'
    });
    const rows = await executeZCQL(generated.sql, generated.params);
    return Number(rows[0]?.count || 0);
  }
}

export class CatalystAccusedRepository implements repos.AccusedRepository {
  async getById(id: number): Promise<repos.Accused | null> {
    const sql = `SELECT * FROM Accused WHERE AccusedMasterID = ?`;
    const rows = await executeZCQL(sql, [id]);
    return rows[0] || null;
  }

  async getByCaseId(caseId: number): Promise<repos.Accused[]> {
    const sql = `SELECT * FROM Accused WHERE CaseMasterID = ?`;
    return executeZCQL(sql, [caseId]);
  }

  async getByPersonId(personId: string): Promise<repos.Accused[]> {
    const sql = `SELECT * FROM Accused WHERE PersonID = ?`;
    return executeZCQL(sql, [personId]);
  }

  async listRepeatOffenders(): Promise<{ AccusedName: string; PersonID: string; offenceCount: number }[]> {
    // Group and filter in memory to bypass ZCQL group-by constraints
    const rows = await executeZCQL('SELECT AccusedName, PersonID, CaseMasterID FROM Accused');
    const counts: Record<string, { name: string; pid: string; cases: Set<number> }> = {};
    
    for (const r of rows) {
      if (!r.PersonID) continue;
      const key = `${r.PersonID}_${r.AccusedName}`;
      if (!counts[key]) {
        counts[key] = { name: r.AccusedName, pid: r.PersonID, cases: new Set() };
      }
      counts[key].cases.add(Number(r.CaseMasterID));
    }

    return Object.values(counts)
      .map(c => ({ AccusedName: c.name, PersonID: c.pid, offenceCount: c.cases.size }))
      .filter(c => c.offenceCount > 1)
      .sort((a, b) => b.offenceCount - a.offenceCount);
  }

  async searchByName(name: string): Promise<repos.Accused[]> {
    const sql = `SELECT * FROM Accused WHERE AccusedName LIKE ?`;
    return executeZCQL(sql, [`%${name}%`]);
  }
}

export class CatalystVictimRepository implements repos.VictimRepository {
  async getByCaseId(caseId: number): Promise<repos.Victim[]> {
    const sql = `SELECT * FROM Victim WHERE CaseMasterID = ?`;
    return executeZCQL(sql, [caseId]);
  }
}

export class CatalystComplainantRepository implements repos.ComplainantRepository {
  async getByCaseId(caseId: number): Promise<repos.Complainant | null> {
    const sql = `SELECT * FROM ComplainantDetails WHERE CaseMasterID = ?`;
    const rows = await executeZCQL(sql, [caseId]);
    return rows[0] || null;
  }
}

export class CatalystEmployeeRepository implements repos.EmployeeRepository {
  async getById(id: number): Promise<repos.Employee | null> {
    const sql = `SELECT * FROM Employee WHERE EmployeeID = ?`;
    const rows = await executeZCQL(sql, [id]);
    return rows[0] || null;
  }

  async list(): Promise<repos.Employee[]> {
    return executeZCQL('SELECT * FROM Employee');
  }

  async listWorkload(): Promise<{ OfficerName: string; activeCases: number; chargesheetsFiled: number }[]> {
    // Execute workload metrics aggregation in memory to bypass ZCQL CASE WHEN constraints
    const employees = await executeZCQL('SELECT EmployeeID, FirstName FROM Employee');
    const cases = await executeZCQL('SELECT PolicePersonID, CaseStatusID FROM CaseMaster');

    const activeMap = new Map<number, number>();
    const csMap = new Map<number, number>();

    for (const c of cases) {
      const pId = Number(c.PolicePersonID);
      if (!pId) continue;
      if (Number(c.CaseStatusID) === 1) {
        activeMap.set(pId, (activeMap.get(pId) || 0) + 1);
      } else if (Number(c.CaseStatusID) === 2) {
        csMap.set(pId, (csMap.get(pId) || 0) + 1);
      }
    }

    const workload = employees.map((e: any) => {
      const pId = Number(e.EmployeeID);
      return {
        OfficerName: e.FirstName,
        activeCases: activeMap.get(pId) || 0,
        chargesheetsFiled: csMap.get(pId) || 0
      };
    });

    return workload.sort((a, b) => b.activeCases - a.activeCases).slice(0, 15);
  }
}

export class CatalystPoliceStationRepository implements repos.PoliceStationRepository {
  async getById(id: number): Promise<repos.Unit | null> {
    const sql = `SELECT * FROM Unit WHERE UnitID = ?`;
    const rows = await executeZCQL(sql, [id]);
    return rows[0] || null;
  }

  async list(): Promise<repos.Unit[]> {
    return executeZCQL('SELECT * FROM Unit');
  }
}

export class CatalystDistrictRepository implements repos.DistrictRepository {
  async getById(id: number): Promise<repos.District | null> {
    const sql = `SELECT * FROM District WHERE DistrictID = ?`;
    const rows = await executeZCQL(sql, [id]);
    return rows[0] || null;
  }

  async list(): Promise<repos.District[]> {
    return executeZCQL('SELECT * FROM District');
  }
}

export class CatalystCourtRepository implements repos.CourtRepository {
  async getById(id: number): Promise<repos.Court | null> {
    const sql = `SELECT * FROM Court WHERE CourtID = ?`;
    const rows = await executeZCQL(sql, [id]);
    return rows[0] || null;
  }

  async list(): Promise<repos.Court[]> {
    return executeZCQL('SELECT * FROM Court');
  }
}

export class CatalystCrimeHeadRepository implements repos.CrimeHeadRepository {
  async list(): Promise<repos.CrimeHead[]> {
    return executeZCQL('SELECT * FROM CrimeHead');
  }
}

export class CatalystCrimeSubHeadRepository implements repos.CrimeSubHeadRepository {
  async list(): Promise<repos.CrimeSubHead[]> {
    return executeZCQL('SELECT * FROM CrimeSubHead');
  }
}

export class CatalystActRepository implements repos.ActRepository {
  async list(): Promise<repos.Act[]> {
    return executeZCQL('SELECT * FROM Act');
  }
}

export class CatalystSectionRepository implements repos.SectionRepository {
  async listByAct(actCode: string): Promise<repos.Section[]> {
    const sql = `SELECT * FROM Section WHERE ActCode = ?`;
    return executeZCQL(sql, [actCode]);
  }
}

export class CatalystChargesheetRepository implements repos.ChargesheetRepository {
  async getByCaseId(caseId: number): Promise<repos.Chargesheet | null> {
    const sql = `SELECT * FROM ChargesheetDetails WHERE CaseMasterID = ?`;
    const rows = await executeZCQL(sql, [caseId]);
    return rows[0] || null;
  }
}

export class CatalystAnalyticsRepository implements repos.AnalyticsRepository {
  async getCrimeDistribution(): Promise<{ name: string; count: number }[]> {
    const cases = await executeZCQL('SELECT CrimeMajorHeadID FROM CaseMaster');
    const heads = await executeZCQL('SELECT CrimeHeadID, CrimeGroupName FROM CrimeHead');
    
    const headMap = new Map<number, string>();
    for (const h of heads) {
      headMap.set(Number(h.CrimeHeadID), h.CrimeGroupName);
    }

    const countMap = new Map<number, number>();
    for (const c of cases) {
      const headId = Number(c.CrimeMajorHeadID);
      countMap.set(headId, (countMap.get(headId) || 0) + 1);
    }

    return Array.from(countMap.entries()).map(([headId, count]) => ({
      name: headMap.get(headId) || `Crime Head ${headId}`,
      count
    })).sort((a, b) => b.count - a.count);
  }

  async getDistrictStats(): Promise<{ DistrictName: string; caseCount: number; arrestCount: number }[]> {
    const districts = await executeZCQL('SELECT DistrictID, DistrictName FROM District');
    const units = await executeZCQL('SELECT UnitID, DistrictID FROM Unit');
    const cases = await executeZCQL('SELECT CaseMasterID, PoliceStationID FROM CaseMaster');
    const arrests = await executeZCQL('SELECT ArrestSurrenderID, CaseMasterID FROM ArrestSurrender');

    const unitToDist = new Map<number, number>();
    for (const u of units) {
      unitToDist.set(Number(u.UnitID), Number(u.DistrictID));
    }

    const caseToDist = new Map<number, number>();
    const distCaseCounts = new Map<number, Set<number>>();
    const distArrestCounts = new Map<number, Set<number>>();

    for (const d of districts) {
      const dId = Number(d.DistrictID);
      distCaseCounts.set(dId, new Set());
      distArrestCounts.set(dId, new Set());
    }

    for (const c of cases) {
      const cId = Number(c.CaseMasterID);
      const stationId = Number(c.PoliceStationID);
      const dId = unitToDist.get(stationId);
      if (dId !== undefined) {
        caseToDist.set(cId, dId);
        distCaseCounts.get(dId)?.add(cId);
      }
    }

    for (const a of arrests) {
      const cId = Number(a.CaseMasterID);
      const dId = caseToDist.get(cId);
      if (dId !== undefined) {
        distArrestCounts.get(dId)?.add(Number(a.ArrestSurrenderID));
      }
    }

    return districts.map((d: any) => {
      const dId = Number(d.DistrictID);
      return {
        DistrictName: d.DistrictName,
        caseCount: distCaseCounts.get(dId)?.size || 0,
        arrestCount: distArrestCounts.get(dId)?.size || 0
      };
    }).sort((a, b) => b.caseCount - a.caseCount);
  }

  async getStationStats(): Promise<{ UnitName: string; caseCount: number; chargesheetCount: number }[]> {
    const units = await executeZCQL('SELECT UnitID, UnitName FROM Unit');
    const cases = await executeZCQL('SELECT CaseMasterID, PoliceStationID FROM CaseMaster');
    const csSheets = await executeZCQL('SELECT CSID, CaseMasterID FROM ChargesheetDetails');

    const unitCaseCounts = new Map<number, Set<number>>();
    const unitCsCounts = new Map<number, Set<number>>();
    const caseToUnit = new Map<number, number>();

    for (const u of units) {
      const uId = Number(u.UnitID);
      unitCaseCounts.set(uId, new Set());
      unitCsCounts.set(uId, new Set());
    }

    for (const c of cases) {
      const cId = Number(c.CaseMasterID);
      const stId = Number(c.PoliceStationID);
      caseToUnit.set(cId, stId);
      unitCaseCounts.get(stId)?.add(cId);
    }

    for (const cs of csSheets) {
      const cId = Number(cs.CaseMasterID);
      const stId = caseToUnit.get(cId);
      if (stId !== undefined) {
        unitCsCounts.get(stId)?.add(Number(cs.CSID));
      }
    }

    return units.map((u: any) => {
      const stId = Number(u.UnitID);
      return {
        UnitName: u.UnitName,
        caseCount: unitCaseCounts.get(stId)?.size || 0,
        chargesheetCount: unitCsCounts.get(stId)?.size || 0
      };
    }).sort((a, b) => b.caseCount - a.caseCount).slice(0, 15);
  }

  async getTimelineEvents(caseNoOrCrimeNo: string): Promise<any[]> {
    const sql = `
      SELECT 
        c.CaseMasterID, c.CrimeNo, c.CaseNo, c.CrimeRegisteredDate,
        e.FirstName as OfficerName, ch.CrimeGroupName, csh.CrimeHeadName
      FROM CaseMaster c
      LEFT JOIN Employee e ON c.PolicePersonID = e.EmployeeID
      LEFT JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      LEFT JOIN CrimeSubHead csh ON c.CrimeMinorHeadID = csh.CrimeSubHeadID
      WHERE c.CrimeNo = ? OR c.CaseNo = ?
      OR c.CaseMasterID IN (
        SELECT CaseMasterID FROM Accused WHERE PersonID = ?
      )
    `;
    const caseDetailsList = await executeZCQL(sql, [caseNoOrCrimeNo, caseNoOrCrimeNo, caseNoOrCrimeNo]);
    if (caseDetailsList.length === 0) return [];
    
    const caseDetails = caseDetailsList[0];
    const caseId = caseDetails.CaseMasterID;
    const events: { stage: string; date: string; details: string; officer: string }[] = [];

    // Stage 1: FIR Registration
    events.push({
      stage: 'FIR Registration',
      date: caseDetails.CrimeRegisteredDate,
      details: `Case registered under category. Major Head: ${caseDetails.CrimeGroupName}, Sub Head: ${caseDetails.CrimeHeadName}.`,
      officer: caseDetails.OfficerName
    });

    // Stage 2: Arrest / Surrender (if any)
    const sqlArrests = `
      SELECT a.ArrestSurrenderDate, e.FirstName as OfficerName, ac.AccusedName
      FROM ArrestSurrender a
      LEFT JOIN Employee e ON a.IOID = e.EmployeeID
      LEFT JOIN Accused ac ON a.AccusedMasterID = ac.AccusedMasterID
      WHERE a.CaseMasterID = ?
    `;
    const arrests = await executeZCQL(sqlArrests, [caseId]);
    for (const arr of arrests) {
      events.push({
        stage: 'Arrest Made',
        date: arr.ArrestSurrenderDate,
        details: `Accused ${arr.AccusedName} arrested/surrendered.`,
        officer: arr.OfficerName || caseDetails.OfficerName
      });
    }

    // Stage 3: Chargesheet details (if any)
    const sqlCS = `
      SELECT cs.csdate, cs.cstype, e.FirstName as OfficerName
      FROM ChargesheetDetails cs
      LEFT JOIN Employee e ON cs.PolicePersonID = e.EmployeeID
      WHERE cs.CaseMasterID = ?
    `;
    const csList = await executeZCQL(sqlCS, [caseId]);
    if (csList.length > 0) {
      const cs = csList[0];
      events.push({
        stage: 'Chargesheet Filed',
        date: cs.csdate,
        details: `Chargesheet filed in court. Final Report type: ${cs.cstype === 'A' ? 'A (Chargesheet)' : cs.cstype}.`,
        officer: cs.OfficerName || caseDetails.OfficerName
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getDemographicsData(): Promise<any> {
    const accuseds = await executeZCQL('SELECT AgeYear, GenderID FROM Accused');
    const ageGroupsMap = {
      'Juvenile (<18)': 0,
      'Youth (18-30)': 0,
      'Adult (31-50)': 0,
      'Senior (>50)': 0
    };
    const genderMap = {
      'Male': 0,
      'Female': 0,
      'Transgender': 0
    };

    for (const a of accuseds) {
      const age = a.AgeYear !== null && a.AgeYear !== undefined ? Number(a.AgeYear) : null;
      if (age !== null) {
        if (age < 18) ageGroupsMap['Juvenile (<18)']++;
        else if (age <= 30) ageGroupsMap['Youth (18-30)']++;
        else if (age <= 50) ageGroupsMap['Adult (31-50)']++;
        else ageGroupsMap['Senior (>50)']++;
      }
      const g = Number(a.GenderID);
      if (g === 1) genderMap['Male']++;
      else if (g === 2) genderMap['Female']++;
      else if (a.GenderID !== null && a.GenderID !== undefined) genderMap['Transgender']++;
    }

    const ageGroups = Object.entries(ageGroupsMap).map(([group, count]) => ({ group, count }));
    const genderGroups = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }));

    // Religions & Castes (Complainants)
    const complainantDetails = await executeZCQL('SELECT ReligionID, CasteID FROM ComplainantDetails');
    const religionsList = await executeZCQL('SELECT ReligionID, ReligionName FROM ReligionMaster');
    const castesList = await executeZCQL('SELECT caste_master_id, caste_master_name FROM CasteMaster');

    const relNameMap = new Map<number, string>();
    for (const r of religionsList) {
      relNameMap.set(Number(r.ReligionID), r.ReligionName);
    }

    const casteNameMap = new Map<number, string>();
    for (const c of castesList) {
      casteNameMap.set(Number(c.caste_master_id), c.caste_master_name);
    }

    const relCounts = new Map<number, number>();
    const casteCounts = new Map<number, number>();

    for (const c of complainantDetails) {
      const rId = Number(c.ReligionID);
      if (rId) relCounts.set(rId, (relCounts.get(rId) || 0) + 1);
      const cId = Number(c.CasteID);
      if (cId) casteCounts.set(cId, (casteCounts.get(cId) || 0) + 1);
    }

    const religionGroups = Array.from(relCounts.entries()).map(([rId, count]) => ({
      religion: relNameMap.get(rId) || `Religion ${rId}`,
      count
    }));

    const casteGroups = Array.from(casteCounts.entries()).map(([cId, count]) => ({
      caste: casteNameMap.get(cId) || `Caste ${cId}`,
      count
    }));

    return {
      ageGroups,
      genderGroups,
      religionGroups,
      casteGroups
    };
  }

  async getTrendData(years?: number[]): Promise<any[]> {
    const cases = await executeZCQL('SELECT CrimeRegisteredDate FROM CaseMaster');
    const trendMap = new Map<string, number>();

    for (const c of cases) {
      if (!c.CrimeRegisteredDate) continue;
      const date = new Date(c.CrimeRegisteredDate);
      const year = date.getFullYear();
      if (years && years.length && !years.includes(year)) continue;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      trendMap.set(key, (trendMap.get(key) || 0) + 1);
    }

    const results = Array.from(trendMap.entries()).map(([key, count]) => {
      const [year, month] = key.split('-');
      return {
        year: Number(year),
        month,
        count
      };
    });
    return results.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month.localeCompare(b.month));
  }

  async getNetworkData(accusedNameOrPersonId: string): Promise<any> {
    const pidSql = `SELECT DISTINCT PersonID, AccusedName FROM Accused WHERE PersonID = ?`;
    let matchedAccused = await executeZCQL(pidSql, [accusedNameOrPersonId]);
    
    if (matchedAccused.length === 0) {
      const accusedSql = `SELECT DISTINCT PersonID, AccusedName FROM Accused WHERE AccusedName LIKE ?`;
      matchedAccused = await executeZCQL(accusedSql, [`%${accusedNameOrPersonId}%`]);
    }
    
    if (matchedAccused.length === 0) {
      return { nodes: [], edges: [] };
    }
    
    const uniquePids = Array.from(new Set(matchedAccused.map(m => m.PersonID)));
    if (uniquePids.length > 1) {
      const optionsMap = new Map<string, string>();
      for (const item of matchedAccused) {
        optionsMap.set(item.PersonID, item.AccusedName);
      }
      const options = Array.from(optionsMap.entries()).map(([personId, accusedName]) => ({ personId, accusedName }));
      return {
        status: 'conflict',
        message: 'Multiple suspects found matching the name.',
        options
      };
    }

    const nodesMap = new Map<string, { id: string; label: string; type: string }>();
    const edgesList: { id: string; source: string; target: string; label: string }[] = [];
    const getEdgeId = (s: string, t: string) => s < t ? `${s}-${t}` : `${t}-${s}`;
    const addedEdges = new Set<string>();

    for (const targetAcc of matchedAccused) {
      const pid = targetAcc.PersonID;
      nodesMap.set(pid, { id: pid, label: targetAcc.AccusedName, type: 'accused' });

      const casesSql = `
        SELECT c.CaseMasterID, c.CrimeNo, c.CaseNo, u.UnitName, e.FirstName
        FROM CaseMaster c
        JOIN Accused a ON c.CaseMasterID = a.CaseMasterID
        JOIN Unit u ON c.PoliceStationID = u.UnitID
        JOIN Employee e ON c.PolicePersonID = e.EmployeeID
        WHERE a.PersonID = ?
      `;
      const cases = await executeZCQL(casesSql, [pid]);

      for (const cs of cases) {
        const caseNodeId = `CASE-${cs.CaseMasterID}`;
        nodesMap.set(caseNodeId, { id: caseNodeId, label: cs.CrimeNo, type: 'case' });

        const acEdgeId = getEdgeId(pid, caseNodeId);
        if (!addedEdges.has(acEdgeId)) {
          edgesList.push({ id: acEdgeId, source: pid, target: caseNodeId, label: 'accused in' });
          addedEdges.add(acEdgeId);
        }

        const officerNodeId = `OFFICER-${cs.FirstName}`;
        nodesMap.set(officerNodeId, { id: officerNodeId, label: cs.FirstName, type: 'officer' });
        
        const offEdgeId = getEdgeId(officerNodeId, caseNodeId);
        if (!addedEdges.has(offEdgeId)) {
          edgesList.push({ id: offEdgeId, source: officerNodeId, target: caseNodeId, label: 'investigates' });
          addedEdges.add(offEdgeId);
        }

        const victimsSql = `SELECT VictimName FROM Victim WHERE CaseMasterID = ?`;
        const victims = await executeZCQL(victimsSql, [cs.CaseMasterID]);
        for (const v of victims) {
          const victimNodeId = `VICTIM-${v.VictimName}`;
          nodesMap.set(victimNodeId, { id: victimNodeId, label: v.VictimName, type: 'victim' });

          const vEdgeId = getEdgeId(caseNodeId, victimNodeId);
          if (!addedEdges.has(vEdgeId)) {
            edgesList.push({ id: vEdgeId, source: caseNodeId, target: victimNodeId, label: 'victim in' });
            addedEdges.add(vEdgeId);
          }
        }

        const coAccusedSql = `SELECT PersonID, AccusedName FROM Accused WHERE CaseMasterID = ? AND PersonID != ?`;
        const coAccused = await executeZCQL(coAccusedSql, [cs.CaseMasterID, pid]);
        for (const co of coAccused) {
          nodesMap.set(co.PersonID, { id: co.PersonID, label: co.AccusedName, type: 'accused' });

          const coEdgeId = getEdgeId(co.PersonID, caseNodeId);
          if (!addedEdges.has(coEdgeId)) {
            edgesList.push({ id: coEdgeId, source: co.PersonID, target: caseNodeId, label: 'co-accused in' });
            addedEdges.add(coEdgeId);
          }
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edgesList
    };
  }

  async getGeospatialPoints(filter?: any): Promise<any[]> {
    let sql = `
      SELECT c.CaseMasterID as id, c.latitude, c.longitude, ch.CrimeGroupName as crimeGroup
      FROM CaseMaster c
      JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
    `;
    const params: any[] = [];
    if (filter?.districtId) {
      sql += ` AND c.PoliceStationID IN (SELECT UnitID FROM Unit WHERE DistrictID = ?)`;
      params.push(filter.districtId);
    }
    if (filter?.crimeHeadId) {
      sql += ` AND c.CrimeMajorHeadID = ?`;
      params.push(filter.crimeHeadId);
    }

    return executeZCQL(sql, params);
  }
}
