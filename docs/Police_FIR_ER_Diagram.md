# Police FIR Database Schema

## CaseMaster

Purpose:
Stores the primary FIR / case information.

Columns

| Column | Description |
|--------|-------------|
| CaseMasterID | **[PK]** `INT` — Primary key — unique identifier for each FIR/case |
| CrimeNo | `VARCHAR` — Crime Number is assigned at the police station level and is linked to the corresponding PoliceStationID. The Crime Number follows a structured format consisting of: 1 digit Case Category Code + 4 digit District ID + 4 digit Police Station ID (Unit ID) + 4 digit Year + 5 digit Running Serial Number A separate running serial number is maintained for each police station, case category, and year. Examples:  FIR: 104430006202600001  UDR: 304430006202600001  Zero FIR: 804430006202600001  PAR: 404430006202600001 |
| CaseNo | `VARCHAR` — The Case Number is generated at the police station level and is associated with the corresponding PoliceStationID. For each case category, a unique serial number is maintained per police station and per year. The format is YYYY + 5-digit running serial number (e.g., 202600001). (Last 9 digits from CrimeNo) |
| CrimeRegisteredDate | `DATE` — Date when the FIR was registered |
| PolicePersonID | **[FK → Employee.EmployeeID]** `INT` — FK → Employee.EmployeeID — officer who registered the FIR |
| PoliceStationID | **[FK → Unit.UnitID]** `INT` — FK → Unit.UnitID — police station where FIR is registered |
| CaseCategoryID | **[FK → CaseCategory.CaseCategoryID]** `INT` — FK → CaseCategory.CaseCategoryID — category |
| GravityOffenceID | **[FK → GravityOffence.GravityOffenceID]** `INT` — FK → GravityOffence.GravityOffenceID — gravity level of the offence |
| CrimeMajorHeadID | **[FK → CrimeHead.CrimeHeadID]** `INT` — FK → CrimeHead.CrimeHeadID — major crime head classification |
| CrimeMinorHeadID | **[FK → CrimeSubHead.CrimeSubHeadID]** `INT` — FK → CrimeSubHead.CrimeSubHeadID — minor crime sub-head classification |
| CaseStatusID | **[FK → CaseStatusMaster.CaseStatusID]** `INT` — FK → CaseStatusMaster.CaseStatusID — current status of the case |
| CourtID | **[FK → Court.CourtID]** `INT` — FK → Court.CourtID — court where the case is being heard |
| IncidentFromDate | `DATETIME` — Start date and time of the incident |
| IncidentToDate | `DATETIME` — End date and time of the incident |
| InfoReceivedPSDate | `DATETIME` — Date and time when police station received information about the incident |
| latitude | `DECIMAL` — GPS latitude coordinate of the incident location |
| longitude | `DECIMAL` — GPS longitude coordinate of the incident location |
| BriefFacts | `NVARCHAR(MAX)` — Summary of the case |

Relationships

- CaseCategoryID → CaseCategory(CaseCategoryID)
- CaseMasterID → Inv_OccuranceTime(CaseMasterID)
- CaseStatusID → CaseStatusMaster(CaseStatusID)
- CourtID → Court(CourtID)
- CrimeMajorHeadID → CrimeHead(CrimeHeadID)
- CrimeMinorHeadID → CrimeSubHead(CrimeSubHeadID)
- GravityOffenceID → GravityOffence(GravityOffenceID)
- PolicePersonID → Employee(EmployeeID)
- PoliceStationID → Unit(UnitID)

---

## ComplainantDetails

Purpose:
Stores details of the complainant filing the FIR.

Columns

| Column | Description |
|--------|-------------|
| ComplainantID | **[PK]** `INT` — Primary key — unique identifier for the complainant |
| CaseMasterID | **[FK → CaseMaster.CaseMasterID]** `INT` — FK → CaseMaster.CaseMasterID — FIR/case filed by this complainant |
| ComplainantName | `VARCHAR` — Full name of the complainant |
| AgeYear | `INT` — Age of the complainant |
| OccupationID | **[FK → OccupationMaster.OccupationID]** `INT` — FK → OccupationMaster.OccupationID — occupation of the complainant |
| ReligionID | **[FK → ReligionMaster.ReligionID]** `INT` — FK → ReligionMaster.ReligionID — religion of the complainant |
| CasteID | **[FK → CasteMaster.caste_master_id]** `INT` — FK → CasteMaster.caste_master_id — caste of the complainant |
| GenderID | `INT` — Gender of the complainant (lookup value) |

Relationships

- CaseMasterID → CaseMaster(CaseMasterID)
- CasteID → CasteMaster(caste_master_id)
- OccupationID → OccupationMaster(OccupationID)
- ReligionID → ReligionMaster(ReligionID)

---

## ActSectionAssociation

Purpose:
Junction table mapping cases to the specific legal acts and sections invoked.

Columns

| Column | Description |
|--------|-------------|
| CaseMasterID | **[FK → CaseMaster.CaseMasterID]** `INT` — FK → CaseMaster.CaseMasterID — FIR/case this act-section applies to |
| ActID | **[FK → Act.ActCode]** `INT` — FK → Act.ActCode — legal act under which charges are framed |
| SectionID | **[FK → Section.SectionCode]** `INT` — FK → Section.SectionCode — specific section of the act invoked |
| ActOrderID | `INT` — Display/print order of the act within the case |
| SectionOrderID | `INT` — Display/print order of the section under the act |

Relationships

- ActID → Act(ActCode)
- CaseMasterID → CaseMaster(CaseMasterID)
- SectionID → Section(SectionCode)

---

## Victim

Purpose:
Stores information about victims associated with each case.

Columns

| Column | Description |
|--------|-------------|
| VictimMasterID | **[PK]** `INT` — Primary key — unique identifier for each victim |
| CaseMasterID | **[FK → CaseMaster.CaseMasterID]** `INT` — FK → CaseMaster.CaseMasterID — FIR/case this victim belongs to |
| VictimName | `VARCHAR` — Full name of the victim |
| AgeYear | `INT` — Age of the victim in years |
| GenderID | `INT` — Gender of the victim (lookup value)  like m, f, t |
| VictimPolice | `VARCHAR` — If Victim is police then 1else 0 |

Relationships

- CaseMasterID → CaseMaster(CaseMasterID)

---

## Accused

Purpose:
Stores information about accused individuals linked to each case.

Columns

| Column | Description |
|--------|-------------|
| AccusedMasterID | **[PK]** `INT` — Primary key — unique identifier for each accused person |
| CaseMasterID | **[FK → CaseMaster.CaseMasterID]** `INT` — FK → CaseMaster.CaseMasterID — FIR/case this accused is linked to |
| AccusedName | `VARCHAR` — Full name of the accused |
| AgeYear | `INT` — Age of the accused |
| GenderID | `INT` — Gender of the accused mentioned as M/F/T |
| PersonID | `VARCHAR` — Accused Sorting like A1, A2, A3…. |

Relationships

- CaseMasterID → CaseMaster(CaseMasterID)

---

## ArrestSurrender

Purpose:
Tracks arrest and voluntary surrender events of accused persons.

Columns

| Column | Description |
|--------|-------------|
| ArrestSurrenderID | **[PK]** `INT` — Primary key — unique identifier for each arrest/surrender event |
| CaseMasterID | **[FK → CaseMaster.CaseMasterID]** `INT` — FK → CaseMaster.CaseMasterID — FIR/case linked to this arrest/surrender |
| ArrestSurrenderTypeID | `INT` — Type of event: arrest or voluntary surrender (lookup value) |
| ArrestSurrenderDate | `DATE` — Date of arrest or surrender |
| ArrestSurrenderStateId | **[FK → State.StateID]** `INT` — FK → State.StateID — state where arrest/surrender occurred |
| ArrestSurrenderDistrictId | **[FK → District.DistrictID]** `INT` — FK → District.DistrictID — district where arrest/surrender occurred |
| PoliceStationID | **[FK → Unit.UnitID]** `INT` — FK → Unit.UnitID — police station handling the arrest |
| IOID | **[FK → Employee.EmployeeID]** `INT` — FK → Employee.EmployeeID — Investigating Officer who made the arrest |
| CourtID | **[FK → Court.CourtID]** `INT` — FK → Court.CourtID — court before which accused was produced |
| AccusedMasterID | **[FK → Accused.AccusedMasterID]** `INT` — FK → Accused.AccusedMasterID — accused person linked to this arrest/surrender |
| IsAccused | `BIT` — Flag (0/1): whether the person is the primary accused in the case |
| IsComplainantAccused | `BIT` — Flag (0/1): whether the complainant is also listed as accused |

Relationships

- AccusedMasterID → Accused(AccusedMasterID)
- ArrestSurrenderDistrictId → District(DistrictID)
- ArrestSurrenderStateId → State(StateID)
- CaseMasterID → CaseMaster(CaseMasterID)
- CourtID → Court(CourtID)
- IOID → Employee(EmployeeID)
- PoliceStationID → Unit(UnitID)

---

## Act

Purpose:
Lookup table for legal acts under which charges are framed (e.g. IPC, NDPS).

Columns

| Column | Description |
|--------|-------------|
| ActCode | **[PK]** `VARCHAR` — Primary key — unique code for the legal act (e.g. IPC, NDPS) |
| ActDescription | `VARCHAR` — Full official name/description of the act |
| ShortName | `VARCHAR` — Abbreviated/common name of the act |
| Active | `BIT` — Whether the act is currently active and usable (1=Active, 0=Inactive) |

Relationships

None

---

## Section

Purpose:
Lookup table for specific sections of legal acts (e.g. 302, 307).

Columns

| Column | Description |
|--------|-------------|
| ActCode | **[FK → Act.ActCode]** `VARCHAR` — FK → Act.ActCode — parent act this section belongs to |
| SectionCode | `VARCHAR` — Section number/code (e.g. 302, 307) |
| SectionDescription | `VARCHAR` — Full description of the section |
| Active | `BIT` — Whether the section is currently active (1=Active, 0=Inactive) |

Relationships

- ActCode → Act(ActCode)

---

## CrimeHeadActSection

Purpose:
Junction/mapping table linking crime heads to acts and sections.

Columns

| Column | Description |
|--------|-------------|
| CrimeHeadID | **[FK → CrimeHead.CrimeHeadID]** `INT` — FK → CrimeHead.CrimeHeadID — crime head this act-section combination maps to |
| ActCode | **[FK → Act.ActCode]** `VARCHAR` — FK → Act.ActCode — legal act linked to this crime head |
| SectionCode | `VARCHAR` — Section code from the act applicable to this crime head |

Relationships

- ActCode → Act(ActCode)
- CrimeHeadID → CrimeHead(CrimeHeadID)

---

## CrimeHead

Purpose:
Lookup table for major crime heads classification (e.g. Crimes Against Body).

Columns

| Column | Description |
|--------|-------------|
| CrimeHeadID | **[PK]** `INT` — Primary key — unique identifier for the major crime head |
| CrimeGroupName | `VARCHAR` — Name of the crime group/major head (e.g. Crimes Against Body) |
| Active | `BIT` — Whether this crime head is active (1=Active, 0=Inactive) |

Relationships

None

---

## CrimeSubHead

Purpose:
Lookup table for minor crime sub-head classification (e.g. Murder, Robbery).

Columns

| Column | Description |
|--------|-------------|
| CrimeSubHeadID | **[PK]** `INT` — Primary key — unique identifier for the crime sub-head |
| CrimeHeadID | **[FK → CrimeHead.CrimeHeadID]** `INT` — FK → CrimeHead.CrimeHeadID — parent major crime head this belongs to |
| CrimeHeadName | `VARCHAR` — Name of this crime sub-head (e.g. Murder, Robbery) |
| SeqID | `INT` — Display/sort sequence number for ordering sub-heads |

Relationships

- CrimeHeadID → CrimeHead(CrimeHeadID)

---

## CasteMaster

Purpose:
Lookup table for castes of complainants/individuals.

Columns

| Column | Description |
|--------|-------------|
| caste_master_id | **[PK]** `INT` — Primary key — unique identifier for each caste. Referenced by ComplainantDetails.CasteID |
| caste_master_name | `VARCHAR` — Name of the caste |

Relationships

None

---

## ReligionMaster

Purpose:
Lookup table for religions of complainants/individuals.

Columns

| Column | Description |
|--------|-------------|
| ReligionID | **[PK]** `INT` — Primary key — unique identifier for each religion. Referenced by ComplainantDetails.ReligionID |
| ReligionName | `VARCHAR` — Name of the religion (e.g. Hindu, Muslim, Christian) |

Relationships

None

---

## OccupationMaster

Purpose:
Lookup table for occupations of complainants/individuals.

Columns

| Column | Description |
|--------|-------------|
| OccupationID | **[PK]** `INT` — Primary key — unique identifier for each occupation. Referenced by ComplainantDetails.OccupationID |
| OccupationName | `VARCHAR` — Name of the occupation (e.g. Farmer, Government Employee) |

Relationships

None

---

## CaseStatusMaster

Purpose:
Lookup table for case statuses (e.g. Under Investigation, Charge Sheeted, Closed).

Columns

| Column | Description |
|--------|-------------|
| CaseStatusID | **[PK]** `INT` — Primary key — unique identifier for each case status. Referenced by CaseMaster.CaseStatusID |
| CaseStatusName | `VARCHAR` — Name of the status (e.g. Under Investigation, Charge Sheeted, Closed) |

Relationships

None

---

## Court

Purpose:
Lookup table for judicial courts where cases are heard.

Columns

| Column | Description |
|--------|-------------|
| CourtID | **[PK]** `INT` — Primary key — unique identifier for the court. Referenced by CaseMaster.CourtID, ArrestSurrender.CourtID |
| CourtName | `VARCHAR` — Full name of the court |
| DistrictID | **[FK → District.DistrictID]** `INT` — FK → District.DistrictID — district where the court is located |
| StateID | **[FK → State.StateID]** `INT` — FK → State.StateID — state where the court is located |
| Active | `BIT` — Whether the court is active (1=Active, 0=Inactive) |

Relationships

- DistrictID → District(DistrictID)
- StateID → State(StateID)

---

## District

Purpose:
Lookup table for administrative districts in Karnataka state.

Columns

| Column | Description |
|--------|-------------|
| DistrictID | **[PK]** `INT` — Primary key — unique identifier for the district. Referenced by Court, Unit, Employee, ArrestSurrender |
| DistrictName | `VARCHAR` — Name of the district |
| StateID | **[FK → State.StateID]** `INT` — FK → State.StateID — state this district belongs to |
| Active | `BIT` — Whether the district record is active (1=Active, 0=Inactive) |

Relationships

- StateID → State(StateID)

---

## State

Purpose:
Lookup table for states.

Columns

| Column | Description |
|--------|-------------|
| StateID | **[PK]** `INT` — Primary key — unique identifier for the state. Referenced by Court, District, Unit, ArrestSurrender |
| StateName | `VARCHAR` — Name of the state |
| NationalityID | `INT` — Nationality reference ID |
| Active | `BIT` — Whether the state record is active (1=Active, 0=Inactive) |

Relationships

None

---

## Unit

Purpose:
Stores information about police units or police stations.

Columns

| Column | Description |
|--------|-------------|
| UnitID | **[PK]** `INT` — Primary key — unique identifier for the police unit. Referenced by CaseMaster.PoliceStationID, Employee.UnitID, ArrestSurrender.PoliceStationID |
| UnitName | `VARCHAR` — Name of the unit or police station |
| TypeID | **[FK → UnitType.UnitTypeID]** `INT` — FK → UnitType.UnitTypeID — type/category of the unit |
| ParentUnit | `INT` — Parent unit ID for hierarchy (self-reference to UnitID) |
| NationalityID | `INT` — Nationality reference ID |
| StateID | **[FK → State.StateID]** `INT` — FK → State.StateID — state the unit belongs to |
| DistrictID | **[FK → District.DistrictID]** `INT` — FK → District.DistrictID — district the unit belongs to |
| Active | `BIT` — Whether the unit is active (1=Active, 0=Inactive) |

Relationships

- DistrictID → District(DistrictID)
- StateID → State(StateID)
- TypeID → UnitType(UnitTypeID)

---

## UnitType

Purpose:
Lookup table for unit type classifications (e.g. Police Station, Circle Office).

Columns

| Column | Description |
|--------|-------------|
| UnitTypeID | **[PK]** `INT` — Primary key — unique identifier for the unit type. Referenced by Unit.TypeID |
| UnitTypeName | `VARCHAR` — Name of the unit type (e.g. Police Station, Circle Office) |
| CityDistState | `VARCHAR` — Operational level: City / District / State |
| Hierarchy | `INT` — Hierarchy level number (lower = higher authority) |
| Active | `BIT` — Whether the unit type is active (1=Active, 0=Inactive) |

Relationships

None

---

## Rank

Purpose:
Lookup table for police ranks (e.g. Constable, Inspector, DSP).

Columns

| Column | Description |
|--------|-------------|
| RankID | **[PK]** `INT` — Primary key — unique identifier for the rank. Referenced by Employee.RankID |
| RankName | `VARCHAR` — Name of the police rank (e.g. Constable, Inspector, DSP) |
| Hierarchy | `INT` — Rank hierarchy level (lower = higher rank) |
| Active | `BIT` — Whether the rank is active (1=Active, 0=Inactive) |

Relationships

None

---

## Designation

Purpose:
Lookup table for police employee designations (e.g. Investigating Officer, SHO).

Columns

| Column | Description |
|--------|-------------|
| DesignationID | **[PK]** `INT` — Primary key — unique identifier for the designation. Referenced by Employee.DesignationID |
| DesignationName | `VARCHAR` — Name of the designation (e.g. Investigating Officer, SHO) |
| Active | `BIT` — Whether the designation is active (1=Active, 0=Inactive) |
| SortOrder | `INT` — Display sort order for dropdowns/reports |

Relationships

None

---

## Employee

Purpose:
Stores details of police department employees (officers, investigating officers, etc.).

Columns

| Column | Description |
|--------|-------------|
| EmployeeID | **[PK]** `INT` — Primary key — unique identifier for the police employee. Referenced by CaseMaster.PolicePersonID, ArrestSurrender.IOID |
| DistrictID | **[FK → District.DistrictID]** `INT` — FK → District.DistrictID — district the employee is currently posted in |
| UnitID | **[FK → Unit.UnitID]** `INT` — FK → Unit.UnitID — unit/police station the employee is assigned to |
| RankID | **[FK → Rank.RankID]** `INT` — FK → Rank.RankID — current rank of the employee |
| DesignationID | **[FK → Designation.DesignationID]** `INT` — FK → Designation.DesignationID — current designation of the employee |
| KGID | `VARCHAR` — Karnataka Government ID (unique government employee number) |
| FirstName | `VARCHAR` — First name of the employee |
| EmployeeDOB | `DATE` — Date of birth of the employee |
| GenderID | `INT` — Gender of the employee (lookup value) |
| BloodGroupID | `INT` — Blood group of the employee (lookup value) |
| PhysicallyChallenged | `BIT` — Flag: whether the employee is physically challenged (1=Yes, 0=No) |
| AppointmentDate | `DATE` — Date of appointment to government service |

Relationships

- DesignationID → Designation(DesignationID)
- DistrictID → District(DistrictID)
- RankID → Rank(RankID)
- UnitID → Unit(UnitID)

---

## CaseCategory

Purpose:
Lookup table for case categories (e.g. FIR, UDR, PAR, Zero FIR).

Columns

| Column | Description |
|--------|-------------|
| CaseCategoryID | **[PK]** `INT` — Primary key — unique identifier for the case category. Referenced by CaseMaster.CaseCategoryID |
| LookupValue | `VARCHAR` — Category name (FIR, UDR, PAR..) |

Relationships

None

---

## GravityOffence

Purpose:
Lookup table for the gravity level of the offence (e.g. Heinous, Non-Heinous).

Columns

| Column | Description |
|--------|-------------|
| GravityOffenceID | **[PK]** `INT` — Primary key — unique identifier for the gravity level. Referenced by CaseMaster.GravityOffenceID |
| LookupValue | `VARCHAR` — Gravity description (e.g. Heinous,  Non-Heinous) |

Relationships

None

---

## ChargesheetDetails

Purpose:
Stores details of the chargesheet filed for cases.

Columns

| Column | Description |
|--------|-------------|
| CSID | **[PK]** `INT` — Primary key — unique identifier for the chargesheet |
| CaseMasterID | **[FK → CaseMaster.CaseMasterID]** `INT` — FK → CaseMaster.CaseMasterID — FIR/case filed by this complainant |
| csdate | `DATETIME` — Chargesheeted date |
| cstype | `CHAR` — Final report type A-> Chargesheet, B->False Case, C->Undetected |
| PolicePersonID | **[FK → Employee.EmployeeID]** `INT` — FK → Employee.EmployeeID |

Relationships

- CaseMasterID → CaseMaster(CaseMasterID)
- PolicePersonID → Employee(EmployeeID)

---

## Inv_OccuranceTime

Purpose:
Not defined in the PDF.

Relationships

- CaseMaster.CaseMasterID → Inv_OccuranceTime(CaseMasterID) *(One-to-One — One FIR has one occurrence time/location record)*

---

## inv_arrestsurrenderaccused

Purpose:
Not defined.

Relationships

- ArrestSurrenderID → ArrestSurrender(ArrestSurrenderID) *(Many-to-One — Junction links to the arrest/surrender event)*

---

## Relationships

- Accused.CaseMasterID → CaseMaster.CaseMasterID *(Many-to-One)*
- ActSectionAssociation.ActID → Act.ActCode *(Many-to-One)*
- ActSectionAssociation.ActID → Act.ActCode *(Many-to-One)*
- ActSectionAssociation.CaseMasterID → CaseMaster.CaseMasterID *(Many-to-One)*
- ActSectionAssociation.SectionID → Section.SectionCode *(Many-to-One)*
- ArrestSurrender.AccusedMasterID → Accused.AccusedMasterID *(Many-to-One)*
- ArrestSurrender.ArrestSurrenderDistrictId → District.DistrictID *(Many-to-One)*
- ArrestSurrender.ArrestSurrenderStateId → State.StateID *(Many-to-One)*
- ArrestSurrender.CaseMasterID → CaseMaster.CaseMasterID *(Many-to-One)*
- ArrestSurrender.CourtID → Court.CourtID *(Many-to-One)*
- ArrestSurrender.IOID → Employee.EmployeeID *(Many-to-One)*
- ArrestSurrender.PoliceStationID → Unit.UnitID *(Many-to-One)*
- CaseMaster.CaseCategoryID → CaseCategory.CaseCategoryID *(Many-to-One)*
- CaseMaster.CaseMasterID → Inv_OccuranceTime.CaseMasterID *(One-to-One)*
- CaseMaster.CaseStatusID → CaseStatusMaster.CaseStatusID *(Many-to-One)*
- CaseMaster.CourtID → Court.CourtID *(Many-to-One)*
- CaseMaster.CrimeMajorHeadID → CrimeHead.CrimeHeadID *(Many-to-One)*
- CaseMaster.CrimeMinorHeadID → CrimeSubHead.CrimeSubHeadID *(Many-to-One)*
- CaseMaster.GravityOffenceID → GravityOffence.GravityOffenceID *(Many-to-One)*
- CaseMaster.PolicePersonID → Employee.EmployeeID *(Many-to-One)*
- CaseMaster.PoliceStationID → Unit.UnitID *(Many-to-One)*
- ChargesheetDetails.CaseMasterID → CaseMaster.CaseMasterID *(Many-to-One)*
- ChargesheetDetails.PolicePersonID → Employee.EmployeeID *(Many-to-One)*
- ComplainantDetails.CaseMasterID → CaseMaster.CaseMasterID *(Many-to-One)*
- ComplainantDetails.CasteID → CasteMaster.caste_master_id *(Many-to-One)*
- ComplainantDetails.OccupationID → OccupationMaster.OccupationID *(Many-to-One)*
- ComplainantDetails.ReligionID → ReligionMaster.ReligionID *(Many-to-One)*
- Court.DistrictID → District.DistrictID *(Many-to-One)*
- Court.StateID → State.StateID *(Many-to-One)*
- CrimeHeadActSection.ActCode → Act.ActCode *(One-to-Many from Act to CrimeHeadActSection)*
- CrimeHeadActSection.CrimeHeadID → CrimeHead.CrimeHeadID *(One-to-Many from CrimeHead to CrimeHeadActSection)*
- CrimeSubHead.CrimeHeadID → CrimeHead.CrimeHeadID *(Many-to-One)*
- District.StateID → State.StateID *(Many-to-One)*
- Employee.DesignationID → Designation.DesignationID *(Many-to-One)*
- Employee.DistrictID → District.DistrictID *(Many-to-One)*
- Employee.RankID → Rank.RankID *(Many-to-One)*
- Employee.UnitID → Unit.UnitID *(Many-to-One)*
- Section.ActCode → Act.ActCode *(Many-to-One; equivalently, Act → Section is One-to-Many)*
- Unit.DistrictID → District.DistrictID *(Many-to-One)*
- Unit.StateID → State.StateID *(Many-to-One)*
- Unit.TypeID → UnitType.UnitTypeID *(Many-to-One)*
- Victim.CaseMasterID → CaseMaster.CaseMasterID *(Many-to-One)*
- inv_arrestsurrenderaccused.ArrestSurrenderID → ArrestSurrender.ArrestSurrenderID *(Many-to-One)*

## Lookup Tables

### Act
Purpose:
Lookup table for legal acts under which charges are framed (e.g. IPC, NDPS).

### CaseCategory
Purpose:
Lookup table for case categories (e.g. FIR, UDR, PAR, Zero FIR).

### CaseStatusMaster
Purpose:
Lookup table for case statuses (e.g. Under Investigation, Charge Sheeted, Closed).

### CasteMaster
Purpose:
Lookup table for castes of complainants/individuals.

### Court
Purpose:
Lookup table for judicial courts where cases are heard.

### CrimeHead
Purpose:
Lookup table for major crime heads classification (e.g. Crimes Against Body).

### CrimeSubHead
Purpose:
Lookup table for minor crime sub-head classification (e.g. Murder, Robbery).

### Designation
Purpose:
Lookup table for police employee designations (e.g. Investigating Officer, SHO).

### District
Purpose:
Lookup table for administrative districts in Karnataka state.

### GravityOffence
Purpose:
Lookup table for the gravity level of the offence (e.g. Heinous, Non-Heinous).

### OccupationMaster
Purpose:
Lookup table for occupations of complainants/individuals.

### Rank
Purpose:
Lookup table for police ranks (e.g. Constable, Inspector, DSP).

### ReligionMaster
Purpose:
Lookup table for religions of complainants/individuals.

### Section
Purpose:
Lookup table for specific sections of legal acts (e.g. 302, 307).

### State
Purpose:
Lookup table for states.

### UnitType
Purpose:
Lookup table for unit type classifications (e.g. Police Station, Circle Office).


