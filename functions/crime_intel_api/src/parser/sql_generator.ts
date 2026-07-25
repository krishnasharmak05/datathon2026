import { ParsedQuery } from '../core/pipeline';

export interface GeneratedSQL {
  sql: string;
  params: any[];
  joinGraph: string[];
}

export class DeterministicSQLGenerator {
  generate(parsed: ParsedQuery): GeneratedSQL {
    const { intent, entities } = parsed;
    const selectClause = intent === 'COUNT' 
      ? 'SELECT COUNT(DISTINCT CaseMaster.CaseMasterID) AS count'
      : 'SELECT CaseMaster.*';

    const tablesToJoin = new Set<string>();
    const leftJoinTables = new Set<string>();

    // 1. Analyze filters to determine which tables must be joined
    if (entities.districtId !== undefined || entities.district !== undefined) {
      tablesToJoin.add('Unit');
      tablesToJoin.add('District');
    }
    if (entities.unitId !== undefined || entities.unit !== undefined) {
      tablesToJoin.add('Unit');
    }
    if (entities.crimeSubHeadId !== undefined || entities.crimeSubHead !== undefined) {
      tablesToJoin.add('CrimeSubHead');
    } else if (entities.crimeHeadId !== undefined || entities.crimeHead !== undefined) {
      tablesToJoin.add('CrimeHead');
    }
    if (entities.act !== undefined) {
      tablesToJoin.add('ActSectionAssociation');
      tablesToJoin.add('Act');
    }
    if (entities.section !== undefined) {
      tablesToJoin.add('ActSectionAssociation');
      tablesToJoin.add('Section');
    }
    if (entities.caseCategoryId !== undefined || entities.caseCategory !== undefined) {
      tablesToJoin.add('CaseCategory');
    }
    if (entities.gravityId !== undefined || entities.gravity !== undefined) {
      tablesToJoin.add('GravityOffence');
    }
    if (entities.caseStatusId !== undefined || entities.caseStatus !== undefined) {
      tablesToJoin.add('CaseStatusMaster');
    }
    if (entities.casteId !== undefined || entities.caste !== undefined) {
      tablesToJoin.add('ComplainantDetails');
      tablesToJoin.add('CasteMaster');
    }
    if (entities.religionId !== undefined || entities.religion !== undefined) {
      tablesToJoin.add('ComplainantDetails');
      tablesToJoin.add('ReligionMaster');
    }
    if (entities.occupationId !== undefined || entities.occupation !== undefined) {
      tablesToJoin.add('ComplainantDetails');
      tablesToJoin.add('OccupationMaster');
    }
    if (entities.complainantGenderId !== undefined || entities.complainantGender !== undefined) {
      tablesToJoin.add('ComplainantDetails');
    }
    if (entities.victimGenderId !== undefined || entities.victimGender !== undefined || entities.victimPolice !== undefined) {
      tablesToJoin.add('Victim');
    }
    if (entities.accusedGenderId !== undefined || entities.accusedGender !== undefined || entities.name !== undefined) {
      tablesToJoin.add('Accused');
    }
    if (entities.officerId !== undefined || entities.officerKgid !== undefined || entities.officerName !== undefined) {
      tablesToJoin.add('Employee');
    }
    if (entities.csType !== undefined) {
      tablesToJoin.add('ChargesheetDetails');
    }
    if (entities.courtId !== undefined) {
      tablesToJoin.add('Court');
    }

    // Exclusions trigger LEFT JOINs
    if (entities.noChargesheet) {
      leftJoinTables.add('ChargesheetDetails');
    }
    if (entities.noAccused) {
      leftJoinTables.add('Accused');
    }
    if (entities.noVictim) {
      leftJoinTables.add('Victim');
    }
    if (entities.noArrest) {
      leftJoinTables.add('ArrestSurrender');
    }

    // 2. Define traversal order and generate JOIN clauses
    const orderedJoinables = [
      { name: 'Unit', join: 'JOIN Unit ON CaseMaster.PoliceStationID = Unit.UnitID' },
      { name: 'District', join: 'JOIN District ON Unit.DistrictID = District.DistrictID' },
      { name: 'CrimeHead', join: 'JOIN CrimeHead ON CaseMaster.CrimeMajorHeadID = CrimeHead.CrimeHeadID' },
      { name: 'CrimeSubHead', join: 'JOIN CrimeSubHead ON CaseMaster.CrimeMinorHeadID = CrimeSubHead.CrimeSubHeadID' },
      { name: 'CaseCategory', join: 'JOIN CaseCategory ON CaseMaster.CaseCategoryID = CaseCategory.CaseCategoryID' },
      { name: 'GravityOffence', join: 'JOIN GravityOffence ON CaseMaster.GravityOffenceID = GravityOffence.GravityOffenceID' },
      { name: 'CaseStatusMaster', join: 'JOIN CaseStatusMaster ON CaseMaster.CaseStatusID = CaseStatusMaster.CaseStatusID' },
      { name: 'Court', join: 'JOIN Court ON CaseMaster.CourtID = Court.CourtID' },
      { name: 'Employee', join: 'JOIN Employee ON CaseMaster.PolicePersonID = Employee.EmployeeID' },
      { name: 'ComplainantDetails', join: 'JOIN ComplainantDetails ON CaseMaster.CaseMasterID = ComplainantDetails.CaseMasterID' },
      { name: 'ReligionMaster', join: 'JOIN ReligionMaster ON ComplainantDetails.ReligionID = ReligionMaster.ReligionID' },
      { name: 'CasteMaster', join: 'JOIN CasteMaster ON ComplainantDetails.CasteID = CasteMaster.caste_master_id' },
      { name: 'OccupationMaster', join: 'JOIN OccupationMaster ON ComplainantDetails.OccupationID = OccupationMaster.OccupationID' },
      { name: 'Accused', join: 'JOIN Accused ON CaseMaster.CaseMasterID = Accused.CaseMasterID', leftJoin: 'LEFT JOIN Accused ON CaseMaster.CaseMasterID = Accused.CaseMasterID' },
      { name: 'Victim', join: 'JOIN Victim ON CaseMaster.CaseMasterID = Victim.CaseMasterID', leftJoin: 'LEFT JOIN Victim ON CaseMaster.CaseMasterID = Victim.CaseMasterID' },
      { name: 'ChargesheetDetails', join: 'JOIN ChargesheetDetails ON CaseMaster.CaseMasterID = ChargesheetDetails.CaseMasterID', leftJoin: 'LEFT JOIN ChargesheetDetails ON CaseMaster.CaseMasterID = ChargesheetDetails.CaseMasterID' },
      { name: 'ArrestSurrender', join: 'JOIN ArrestSurrender ON CaseMaster.CaseMasterID = ArrestSurrender.CaseMasterID', leftJoin: 'LEFT JOIN ArrestSurrender ON CaseMaster.CaseMasterID = ArrestSurrender.CaseMasterID' },
      { name: 'ActSectionAssociation', join: 'JOIN ActSectionAssociation ON CaseMaster.CaseMasterID = ActSectionAssociation.CaseMasterID' },
      { name: 'Act', join: 'JOIN Act ON ActSectionAssociation.ActID = Act.ActCode' },
      { name: 'Section', join: 'JOIN Section ON ActSectionAssociation.SectionID = Section.SectionCode' }
    ];

    const joinGraph: string[] = ['CaseMaster'];
    const joinClauses: string[] = [];

    for (const table of orderedJoinables) {
      const isInner = tablesToJoin.has(table.name);
      const isLeft = leftJoinTables.has(table.name);

      if (isInner || isLeft) {
        joinGraph.push(table.name);
        if (isLeft && table.leftJoin) {
          joinClauses.push(table.leftJoin);
        } else {
          joinClauses.push(table.join);
        }
      }
    }

    // 3. Build conditions and parameters
    const conditions: string[] = [];
    const params: any[] = [];

    if (entities.districtId !== undefined) {
      conditions.push('District.DistrictID = ?');
      params.push(entities.districtId);
    } else if (entities.district !== undefined) {
      conditions.push('District.DistrictName = ?');
      params.push(entities.district);
    }

    if (entities.unitId !== undefined) {
      conditions.push('Unit.UnitID = ?');
      params.push(entities.unitId);
    } else if (entities.unit !== undefined) {
      conditions.push('Unit.UnitName = ?');
      params.push(entities.unit);
    }

    if (entities.crimeHeadId !== undefined) {
      conditions.push('CaseMaster.CrimeMajorHeadID = ?');
      params.push(entities.crimeHeadId);
    }

    if (entities.crimeSubHeadId !== undefined) {
      conditions.push('CaseMaster.CrimeMinorHeadID = ?');
      params.push(entities.crimeSubHeadId);
    }

    if (entities.act !== undefined) {
      conditions.push('ActSectionAssociation.ActID = ?');
      params.push(entities.act);
    }

    if (entities.section !== undefined) {
      conditions.push('ActSectionAssociation.SectionID = ?');
      params.push(entities.section);
    }

    if (entities.caseCategoryId !== undefined) {
      conditions.push('CaseMaster.CaseCategoryID = ?');
      params.push(entities.caseCategoryId);
    }

    if (entities.gravityId !== undefined) {
      conditions.push('CaseMaster.GravityOffenceID = ?');
      params.push(entities.gravityId);
    }

    if (entities.caseStatusId !== undefined) {
      conditions.push('CaseMaster.CaseStatusID = ?');
      params.push(entities.caseStatusId);
    }

    if (entities.casteId !== undefined) {
      conditions.push('ComplainantDetails.CasteID = ?');
      params.push(entities.casteId);
    }

    if (entities.religionId !== undefined) {
      conditions.push('ComplainantDetails.ReligionID = ?');
      params.push(entities.religionId);
    }

    if (entities.occupationId !== undefined) {
      conditions.push('ComplainantDetails.OccupationID = ?');
      params.push(entities.occupationId);
    }

    if (entities.complainantGenderId !== undefined) {
      conditions.push('ComplainantDetails.GenderID = ?');
      params.push(entities.complainantGenderId);
    }

    if (entities.victimGenderId !== undefined) {
      conditions.push('Victim.GenderID = ?');
      params.push(entities.victimGenderId);
    }

    if (entities.accusedGenderId !== undefined) {
      conditions.push('Accused.GenderID = ?');
      params.push(entities.accusedGenderId);
    }

    if (entities.officerId !== undefined) {
      conditions.push('Employee.EmployeeID = ?');
      params.push(entities.officerId);
    } else if (entities.officerKgid !== undefined) {
      conditions.push('Employee.KGID = ?');
      params.push(entities.officerKgid);
    } else if (entities.officerName !== undefined) {
      conditions.push('Employee.FirstName = ?');
      params.push(entities.officerName);
    }

    if (entities.victimPolice !== undefined) {
      conditions.push('Victim.VictimPolice = ?');
      params.push(String(entities.victimPolice));
    }

    if (entities.csType !== undefined) {
      conditions.push('ChargesheetDetails.cstype = ?');
      params.push(entities.csType);
    }

    if (entities.name !== undefined) {
      conditions.push('Accused.AccusedName = ?');
      params.push(entities.name);
    }

    if (entities.caseNo !== undefined) {
      conditions.push('(CaseMaster.CaseNo = ? OR CaseMaster.CrimeNo = ?)');
      params.push(entities.caseNo);
      params.push(entities.caseNo);
    }

    if (entities.startDate !== undefined) {
      conditions.push('CaseMaster.CrimeRegisteredDate >= ?');
      params.push(entities.startDate);
    }

    if (entities.endDate !== undefined) {
      conditions.push('CaseMaster.CrimeRegisteredDate <= ?');
      params.push(entities.endDate);
    }

    if (entities.year !== undefined) {
      conditions.push("strftime('%Y', CaseMaster.CrimeRegisteredDate) = ?");
      params.push(String(entities.year));
    }

    // Exclusions filter
    if (entities.noChargesheet) {
      conditions.push('ChargesheetDetails.CSID IS NULL');
    }
    if (entities.noAccused) {
      conditions.push('Accused.AccusedMasterID IS NULL');
    }
    if (entities.noVictim) {
      conditions.push('Victim.VictimMasterID IS NULL');
    }
    if (entities.noArrest) {
      conditions.push('ArrestSurrender.ArrestSurrenderID IS NULL');
    }

    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    const joinsStr = joinClauses.length > 0 ? ' ' + joinClauses.join(' ') : '';
    const sql = `${selectClause} FROM CaseMaster${joinsStr}${whereClause}`;

    return {
      sql,
      params,
      joinGraph
    };
  }
}
