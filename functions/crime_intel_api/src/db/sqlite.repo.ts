import { getDbConnection } from './connection';
import * as repos from '../core/repos';

// Thread-safe or static execution trace for explainability
export class SqlTracer {
  private static queries: string[] = [];
  private static rowsCount: number = 0;

  static trace(sql: string, params?: any[]) {
    const formatted = params && params.length ? `${sql} [Params: ${params.join(', ')}]` : sql;
    this.queries.push(formatted);
  }

  static addRows(count: number) {
    this.rowsCount += count;
  }

  static getQueries(): string[] {
    return [...this.queries];
  }

  static getRowsProcessed(): number {
    return this.rowsCount;
  }

  static clear() {
    this.queries = [];
    this.rowsCount = 0;
  }
}

// 1. CaseRepository
export class SQLiteCaseRepository implements repos.CaseRepository {
  async getById(id: number): Promise<repos.Case | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM CaseMaster WHERE CaseMasterID = ?`;
    SqlTracer.trace(sql, [id]);
    const row = await db.get(sql, [id]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }

  async getByCrimeNo(crimeNo: string): Promise<repos.Case | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM CaseMaster WHERE CrimeNo = ? OR CaseNo = ?`;
    SqlTracer.trace(sql, [crimeNo, crimeNo]);
    const row = await db.get(sql, [crimeNo, crimeNo]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }

  async list(filter?: {
    districtId?: number;
    unitId?: number;
    crimeHeadId?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<repos.Case[]> {
    const db = await getDbConnection();
    let sql = `SELECT * FROM CaseMaster WHERE 1=1`;
    const params: any[] = [];

    if (filter?.districtId) {
      sql += ` AND PoliceStationID IN (SELECT UnitID FROM Unit WHERE DistrictID = ?)`;
      params.push(filter.districtId);
    }
    if (filter?.unitId) {
      sql += ` AND PoliceStationID = ?`;
      params.push(filter.unitId);
    }
    if (filter?.crimeHeadId) {
      sql += ` AND CrimeMajorHeadID = ?`;
      params.push(filter.crimeHeadId);
    }
    if (filter?.year) {
      sql += ` AND strftime('%Y', CrimeRegisteredDate) = ?`;
      params.push(String(filter.year));
    }
    if (filter?.startDate) {
      sql += ` AND CrimeRegisteredDate >= ?`;
      params.push(filter.startDate);
    }
    if (filter?.endDate) {
      sql += ` AND CrimeRegisteredDate <= ?`;
      params.push(filter.endDate);
    }

    SqlTracer.trace(sql, params);
    const rows = await db.all(sql, params);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async count(filter?: {
    districtId?: number;
    unitId?: number;
    crimeHeadId?: number;
    year?: number;
  }): Promise<number> {
    const db = await getDbConnection();
    let sql = `SELECT COUNT(*) as count FROM CaseMaster WHERE 1=1`;
    const params: any[] = [];

    if (filter?.districtId) {
      sql += ` AND PoliceStationID IN (SELECT UnitID FROM Unit WHERE DistrictID = ?)`;
      params.push(filter.districtId);
    }
    if (filter?.unitId) {
      sql += ` AND PoliceStationID = ?`;
      params.push(filter.unitId);
    }
    if (filter?.crimeHeadId) {
      sql += ` AND CrimeMajorHeadID = ?`;
      params.push(filter.crimeHeadId);
    }
    if (filter?.year) {
      sql += ` AND strftime('%Y', CrimeRegisteredDate) = ?`;
      params.push(String(filter.year));
    }

    SqlTracer.trace(sql, params);
    const result = await db.get(sql, params);
    SqlTracer.addRows(1);
    return result?.count || 0;
  }
}

// 2. AccusedRepository
export class SQLiteAccusedRepository implements repos.AccusedRepository {
  async getById(id: number): Promise<repos.Accused | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Accused WHERE AccusedMasterID = ?`;
    SqlTracer.trace(sql, [id]);
    const row = await db.get(sql, [id]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }

  async getByCaseId(caseId: number): Promise<repos.Accused[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Accused WHERE CaseMasterID = ?`;
    SqlTracer.trace(sql, [caseId]);
    const rows = await db.all(sql, [caseId]);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async getByPersonId(personId: string): Promise<repos.Accused[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Accused WHERE PersonID = ?`;
    SqlTracer.trace(sql, [personId]);
    const rows = await db.all(sql, [personId]);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async listRepeatOffenders(): Promise<{ AccusedName: string; PersonID: string; offenceCount: number }[]> {
    const db = await getDbConnection();
    const sql = `
      SELECT AccusedName, PersonID, COUNT(CaseMasterID) as offenceCount 
      FROM Accused 
      GROUP BY PersonID, AccusedName 
      HAVING offenceCount > 1 
      ORDER BY offenceCount DESC
    `;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async searchByName(name: string): Promise<repos.Accused[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Accused WHERE AccusedName LIKE ?`;
    SqlTracer.trace(sql, [`%${name}%`]);
    const rows = await db.all(sql, [`%${name}%`]);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 3. VictimRepository
export class SQLiteVictimRepository implements repos.VictimRepository {
  async getByCaseId(caseId: number): Promise<repos.Victim[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Victim WHERE CaseMasterID = ?`;
    SqlTracer.trace(sql, [caseId]);
    const rows = await db.all(sql, [caseId]);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 4. ComplainantRepository
export class SQLiteComplainantRepository implements repos.ComplainantRepository {
  async getByCaseId(caseId: number): Promise<repos.Complainant | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM ComplainantDetails WHERE CaseMasterID = ?`;
    SqlTracer.trace(sql, [caseId]);
    const row = await db.get(sql, [caseId]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }
}

// 5. EmployeeRepository
export class SQLiteEmployeeRepository implements repos.EmployeeRepository {
  async getById(id: number): Promise<repos.Employee | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Employee WHERE EmployeeID = ?`;
    SqlTracer.trace(sql, [id]);
    const row = await db.get(sql, [id]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }

  async list(): Promise<repos.Employee[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Employee`;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async listWorkload(): Promise<{ OfficerName: string; activeCases: number; chargesheetsFiled: number }[]> {
    const db = await getDbConnection();
    const sql = `
      SELECT 
        e.FirstName as OfficerName,
        SUM(CASE WHEN c.CaseStatusID = 1 THEN 1 ELSE 0 END) as activeCases,
        SUM(CASE WHEN c.CaseStatusID = 2 THEN 1 ELSE 0 END) as chargesheetsFiled
      FROM Employee e
      LEFT JOIN CaseMaster c ON e.EmployeeID = c.PolicePersonID
      GROUP BY e.EmployeeID
      ORDER BY activeCases DESC
      LIMIT 15
    `;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 6. PoliceStationRepository (Unit)
export class SQLitePoliceStationRepository implements repos.PoliceStationRepository {
  async getById(id: number): Promise<repos.Unit | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Unit WHERE UnitID = ?`;
    SqlTracer.trace(sql, [id]);
    const row = await db.get(sql, [id]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }

  async list(): Promise<repos.Unit[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Unit`;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 7. DistrictRepository
export class SQLiteDistrictRepository implements repos.DistrictRepository {
  async getById(id: number): Promise<repos.District | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM District WHERE DistrictID = ?`;
    SqlTracer.trace(sql, [id]);
    const row = await db.get(sql, [id]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }

  async list(): Promise<repos.District[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM District`;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 8. CourtRepository
export class SQLiteCourtRepository implements repos.CourtRepository {
  async getById(id: number): Promise<repos.Court | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Court WHERE CourtID = ?`;
    SqlTracer.trace(sql, [id]);
    const row = await db.get(sql, [id]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }

  async list(): Promise<repos.Court[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Court`;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 9. CrimeHeadRepository
export class SQLiteCrimeHeadRepository implements repos.CrimeHeadRepository {
  async list(): Promise<repos.CrimeHead[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM CrimeHead`;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 10. CrimeSubHeadRepository
export class SQLiteCrimeSubHeadRepository implements repos.CrimeSubHeadRepository {
  async list(): Promise<repos.CrimeSubHead[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM CrimeSubHead`;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 11. ActRepository
export class SQLiteActRepository implements repos.ActRepository {
  async list(): Promise<repos.Act[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Act`;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 12. SectionRepository
export class SQLiteSectionRepository implements repos.SectionRepository {
  async listByAct(actCode: string): Promise<repos.Section[]> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM Section WHERE ActCode = ?`;
    SqlTracer.trace(sql, [actCode]);
    const rows = await db.all(sql, [actCode]);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}

// 13. ChargesheetRepository
export class SQLiteChargesheetRepository implements repos.ChargesheetRepository {
  async getByCaseId(caseId: number): Promise<repos.Chargesheet | null> {
    const db = await getDbConnection();
    const sql = `SELECT * FROM ChargesheetDetails WHERE CaseMasterID = ?`;
    SqlTracer.trace(sql, [caseId]);
    const row = await db.get(sql, [caseId]);
    if (row) SqlTracer.addRows(1);
    return row || null;
  }
}

// 14. AnalyticsRepository
export class SQLiteAnalyticsRepository implements repos.AnalyticsRepository {
  async getCrimeDistribution(): Promise<{ name: string; count: number }[]> {
    const db = await getDbConnection();
    const sql = `
      SELECT ch.CrimeGroupName as name, COUNT(c.CaseMasterID) as count
      FROM CaseMaster c
      JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      GROUP BY ch.CrimeHeadID
      ORDER BY count DESC
    `;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async getDistrictStats(): Promise<{ DistrictName: string; caseCount: number; arrestCount: number }[]> {
    const db = await getDbConnection();
    const sql = `
      SELECT 
        d.DistrictName, 
        COUNT(DISTINCT c.CaseMasterID) as caseCount,
        COUNT(DISTINCT a.ArrestSurrenderID) as arrestCount
      FROM District d
      LEFT JOIN Unit u ON d.DistrictID = u.DistrictID
      LEFT JOIN CaseMaster c ON u.UnitID = c.PoliceStationID
      LEFT JOIN ArrestSurrender a ON c.CaseMasterID = a.CaseMasterID
      GROUP BY d.DistrictID
      ORDER BY caseCount DESC
    `;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async getStationStats(): Promise<{ UnitName: string; caseCount: number; chargesheetCount: number }[]> {
    const db = await getDbConnection();
    const sql = `
      SELECT 
        u.UnitName, 
        COUNT(DISTINCT c.CaseMasterID) as caseCount,
        COUNT(DISTINCT cs.CSID) as chargesheetCount
      FROM Unit u
      LEFT JOIN CaseMaster c ON u.UnitID = c.PoliceStationID
      LEFT JOIN ChargesheetDetails cs ON c.CaseMasterID = cs.CaseMasterID
      GROUP BY u.UnitID
      ORDER BY caseCount DESC
      LIMIT 15
    `;
    SqlTracer.trace(sql);
    const rows = await db.all(sql);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async getTimelineEvents(caseNoOrCrimeNo: string): Promise<{
    stage: string;
    date: string;
    details: string;
    officer: string;
  }[]> {
    const db = await getDbConnection();
    const sql = `
      SELECT 
        c.CaseMasterID, c.CrimeNo, c.CaseNo, c.CrimeRegisteredDate,
        e.FirstName as OfficerName, ch.CrimeGroupName, csh.CrimeHeadName
      FROM CaseMaster c
      LEFT JOIN Employee e ON c.PolicePersonID = e.EmployeeID
      LEFT JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      LEFT JOIN CrimeSubHead csh ON c.CrimeMinorHeadID = csh.CrimeSubHeadID
      WHERE c.CrimeNo = ? OR c.CaseNo = ?
    `;
    SqlTracer.trace(sql, [caseNoOrCrimeNo, caseNoOrCrimeNo]);
    const caseDetails = await db.get(sql, [caseNoOrCrimeNo, caseNoOrCrimeNo]);
    if (!caseDetails) return [];
    
    SqlTracer.addRows(1);
    const caseId = caseDetails.CaseMasterID;
    const events: { stage: string; date: string; details: string; officer: string }[] = [];

    // Stage 1: FIR Registered
    events.push({
      stage: 'FIR Registration',
      date: caseDetails.CrimeRegisteredDate,
      details: `Case registered under category. Major Head: ${caseDetails.CrimeGroupName}, Sub Head: ${caseDetails.CrimeHeadName}.`,
      officer: caseDetails.OfficerName
    });

    // Stage 2: Arrest / Surrender (if any)
    const sqlArrests = `
      SELECT a.ArrestSurrenderDate, a.ArrestSurrenderID, e.FirstName as OfficerName, ac.AccusedName
      FROM ArrestSurrender a
      LEFT JOIN Employee e ON a.IOID = e.EmployeeID
      LEFT JOIN Accused ac ON a.AccusedMasterID = ac.AccusedMasterID
      WHERE a.CaseMasterID = ?
    `;
    SqlTracer.trace(sqlArrests, [caseId]);
    const arrests = await db.all(sqlArrests, [caseId]);
    SqlTracer.addRows(arrests.length);
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
    SqlTracer.trace(sqlCS, [caseId]);
    const cs = await db.get(sqlCS, [caseId]);
    if (cs) {
      SqlTracer.addRows(1);
      events.push({
        stage: 'Chargesheet Filed',
        date: cs.csdate,
        details: `Chargesheet filed in court. Final Report type: ${cs.cstype === 'A' ? 'A (Chargesheet)' : cs.cstype}.`,
        officer: cs.OfficerName || caseDetails.OfficerName
      });
    }

    // Sort events by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getDemographicsData(): Promise<{
    ageGroups: { group: string; count: number }[];
    genderGroups: { gender: string; count: number }[];
    religionGroups: { religion: string; count: number }[];
    casteGroups: { caste: string; count: number }[];
  }> {
    const db = await getDbConnection();
    
    // Age Groups (Accused)
    const sqlAge = `
      SELECT 
        CASE 
          WHEN AgeYear < 18 THEN 'Juvenile (<18)'
          WHEN AgeYear BETWEEN 18 AND 30 THEN 'Youth (18-30)'
          WHEN AgeYear BETWEEN 31 AND 50 THEN 'Adult (31-50)'
          ELSE 'Senior (>50)'
        END as 'group',
        COUNT(*) as count
      FROM Accused
      WHERE AgeYear IS NOT NULL
      GROUP BY 'group'
    `;
    SqlTracer.trace(sqlAge);
    const ageRows = await db.all(sqlAge);
    SqlTracer.addRows(ageRows.length);

    // Gender (Accused)
    const sqlGender = `
      SELECT 
        CASE WHEN GenderID = 1 THEN 'Male' WHEN GenderID = 2 THEN 'Female' ELSE 'Transgender' END as gender,
        COUNT(*) as count
      FROM Accused
      GROUP BY GenderID
    `;
    SqlTracer.trace(sqlGender);
    const genderRows = await db.all(sqlGender);
    SqlTracer.addRows(genderRows.length);

    // Religions (Complainants)
    const sqlReligion = `
      SELECT r.ReligionName as religion, COUNT(c.ComplainantID) as count
      FROM ComplainantDetails c
      JOIN ReligionMaster r ON c.ReligionID = r.ReligionID
      GROUP BY r.ReligionID
    `;
    SqlTracer.trace(sqlReligion);
    const religionRows = await db.all(sqlReligion);
    SqlTracer.addRows(religionRows.length);

    // Caste (Complainants)
    const sqlCaste = `
      SELECT cm.caste_master_name as caste, COUNT(c.ComplainantID) as count
      FROM ComplainantDetails c
      JOIN CasteMaster cm ON c.CasteID = cm.caste_master_id
      GROUP BY cm.caste_master_id
    `;
    SqlTracer.trace(sqlCaste);
    const casteRows = await db.all(sqlCaste);
    SqlTracer.addRows(casteRows.length);

    return {
      ageGroups: ageRows,
      genderGroups: genderRows,
      religionGroups: religionRows,
      casteGroups: casteRows,
    };
  }

  async getTrendData(years?: number[]): Promise<{ year: number; month: string; count: number }[]> {
    const db = await getDbConnection();
    let sql = `
      SELECT 
        CAST(strftime('%Y', CrimeRegisteredDate) AS INTEGER) as year,
        strftime('%m', CrimeRegisteredDate) as month,
        COUNT(*) as count
      FROM CaseMaster
      WHERE 1=1
    `;
    const params: any[] = [];
    if (years && years.length) {
      sql += ` AND year IN (${years.map(() => '?').join(',')})`;
      params.push(...years);
    }
    sql += ` GROUP BY year, month ORDER BY year ASC, month ASC`;
    
    SqlTracer.trace(sql, params);
    const rows = await db.all(sql, params);
    SqlTracer.addRows(rows.length);
    return rows;
  }

  async getNetworkData(accusedName: string): Promise<{
    nodes: { id: string; label: string; type: string }[];
    edges: { id: string; source: string; target: string; label: string }[];
  }> {
    const db = await getDbConnection();
    
    // Find all cases linked to this accused name or PersonID
    const accusedSql = `SELECT DISTINCT PersonID, AccusedName FROM Accused WHERE AccusedName LIKE ?`;
    SqlTracer.trace(accusedSql, [`%${accusedName}%`]);
    const matchedAccused = await db.all(accusedSql, [`%${accusedName}%`]);
    SqlTracer.addRows(matchedAccused.length);
    
    if (matchedAccused.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodesMap = new Map<string, { id: string; label: string; type: string }>();
    const edgesList: { id: string; source: string; target: string; label: string }[] = [];

    // Helper to generate edge ID
    const getEdgeId = (s: string, t: string) => s < t ? `${s}-${t}` : `${t}-${s}`;
    const addedEdges = new Set<string>();

    for (const targetAcc of matchedAccused) {
      const pid = targetAcc.PersonID;
      
      // Node for primary accused
      nodesMap.set(pid, { id: pid, label: targetAcc.AccusedName, type: 'accused' });

      // Find all cases involving this person
      const casesSql = `
        SELECT c.CaseMasterID, c.CrimeNo, c.CaseNo, u.UnitName, e.FirstName as OfficerName
        FROM CaseMaster c
        JOIN Accused a ON c.CaseMasterID = a.CaseMasterID
        JOIN Unit u ON c.PoliceStationID = u.UnitID
        JOIN Employee e ON c.PolicePersonID = e.EmployeeID
        WHERE a.PersonID = ?
      `;
      SqlTracer.trace(casesSql, [pid]);
      const cases = await db.all(casesSql, [pid]);
      SqlTracer.addRows(cases.length);

      for (const cs of cases) {
        const caseNodeId = `CASE-${cs.CaseMasterID}`;
        nodesMap.set(caseNodeId, { id: caseNodeId, label: cs.CrimeNo, type: 'case' });

        // Accused -> Case Edge
        const acEdgeId = getEdgeId(pid, caseNodeId);
        if (!addedEdges.has(acEdgeId)) {
          edgesList.push({ id: acEdgeId, source: pid, target: caseNodeId, label: 'accused in' });
          addedEdges.add(acEdgeId);
        }

        // Officer Node
        const officerNodeId = `OFFICER-${cs.OfficerName}`;
        nodesMap.set(officerNodeId, { id: officerNodeId, label: cs.OfficerName, type: 'officer' });
        
        // Officer -> Case Edge
        const offEdgeId = getEdgeId(officerNodeId, caseNodeId);
        if (!addedEdges.has(offEdgeId)) {
          edgesList.push({ id: offEdgeId, source: officerNodeId, target: caseNodeId, label: 'investigates' });
          addedEdges.add(offEdgeId);
        }

        // Fetch other co-accused in this same case
        const coAccusedSql = `
          SELECT PersonID, AccusedName 
          FROM Accused 
          WHERE CaseMasterID = ? AND PersonID != ?
        `;
        SqlTracer.trace(coAccusedSql, [cs.CaseMasterID, pid]);
        const coAccused = await db.all(coAccusedSql, [cs.CaseMasterID, pid]);
        SqlTracer.addRows(coAccused.length);

        for (const co of coAccused) {
          nodesMap.set(co.PersonID, { id: co.PersonID, label: co.AccusedName, type: 'accused' });

          // Co-accused -> Case Edge
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

  async getGeospatialPoints(filter?: { districtId?: number; crimeHeadId?: number }): Promise<{ latitude: number; longitude: number; crimeGroup: string; id: number }[]> {
    const db = await getDbConnection();
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

    SqlTracer.trace(sql, params);
    const rows = await db.all(sql, params);
    SqlTracer.addRows(rows.length);
    return rows;
  }
}
