-- State Table
CREATE TABLE IF NOT EXISTS State (
    StateID INTEGER PRIMARY KEY,
    StateName TEXT NOT NULL,
    NationalityID INTEGER,
    Active INTEGER DEFAULT 1
);

-- District Table
CREATE TABLE IF NOT EXISTS District (
    DistrictID INTEGER PRIMARY KEY,
    DistrictName TEXT NOT NULL,
    StateID INTEGER REFERENCES State(StateID),
    Active INTEGER DEFAULT 1
);

-- Court Table
CREATE TABLE IF NOT EXISTS Court (
    CourtID INTEGER PRIMARY KEY,
    CourtName TEXT NOT NULL,
    DistrictID INTEGER REFERENCES District(DistrictID),
    StateID INTEGER REFERENCES State(StateID),
    Active INTEGER DEFAULT 1
);

-- UnitType Table
CREATE TABLE IF NOT EXISTS UnitType (
    UnitTypeID INTEGER PRIMARY KEY,
    UnitTypeName TEXT NOT NULL,
    CityDistState TEXT
);

-- Unit (Police Station) Table
CREATE TABLE IF NOT EXISTS Unit (
    UnitID INTEGER PRIMARY KEY,
    UnitName TEXT NOT NULL,
    TypeID INTEGER REFERENCES UnitType(UnitTypeID),
    ParentUnit INTEGER REFERENCES Unit(UnitID),
    NationalityID INTEGER,
    StateID INTEGER REFERENCES State(StateID),
    DistrictID INTEGER REFERENCES District(DistrictID),
    Active INTEGER DEFAULT 1
);

-- Rank Table
CREATE TABLE IF NOT EXISTS Rank (
    RankID INTEGER PRIMARY KEY,
    RankName TEXT NOT NULL,
    Hierarchy INTEGER,
    Active INTEGER DEFAULT 1
);

-- Designation Table
CREATE TABLE IF NOT EXISTS Designation (
    DesignationID INTEGER PRIMARY KEY,
    DesignationName TEXT NOT NULL,
    Active INTEGER DEFAULT 1,
    SortOrder INTEGER
);

-- Employee Table
CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID INTEGER PRIMARY KEY,
    DistrictID INTEGER REFERENCES District(DistrictID),
    UnitID INTEGER REFERENCES Unit(UnitID),
    RankID INTEGER REFERENCES Rank(RankID),
    DesignationID INTEGER REFERENCES Designation(DesignationID),
    KGID TEXT UNIQUE NOT NULL,
    FirstName TEXT NOT NULL,
    EmployeeDOB TEXT,
    GenderID INTEGER,
    BloodGroupID INTEGER,
    PhysicallyChallenged INTEGER DEFAULT 0,
    AppointmentDate TEXT
);

-- CaseCategory Table
CREATE TABLE IF NOT EXISTS CaseCategory (
    CaseCategoryID INTEGER PRIMARY KEY,
    LookupValue TEXT NOT NULL
);

-- GravityOffence Table
CREATE TABLE IF NOT EXISTS GravityOffence (
    GravityOffenceID INTEGER PRIMARY KEY,
    LookupValue TEXT NOT NULL
);

-- CaseStatusMaster Table
CREATE TABLE IF NOT EXISTS CaseStatusMaster (
    CaseStatusID INTEGER PRIMARY KEY,
    CaseStatusName TEXT NOT NULL
);

-- ReligionMaster Table
CREATE TABLE IF NOT EXISTS ReligionMaster (
    ReligionID INTEGER PRIMARY KEY,
    ReligionName TEXT NOT NULL
);

-- CasteMaster Table
CREATE TABLE IF NOT EXISTS CasteMaster (
    caste_master_id INTEGER PRIMARY KEY,
    caste_master_name TEXT NOT NULL
);

-- OccupationMaster Table
CREATE TABLE IF NOT EXISTS OccupationMaster (
    OccupationID INTEGER PRIMARY KEY,
    OccupationName TEXT NOT NULL
);

-- CrimeHead Table
CREATE TABLE IF NOT EXISTS CrimeHead (
    CrimeHeadID INTEGER PRIMARY KEY,
    CrimeGroupName TEXT NOT NULL,
    Active INTEGER DEFAULT 1
);

-- CrimeSubHead Table
CREATE TABLE IF NOT EXISTS CrimeSubHead (
    CrimeSubHeadID INTEGER PRIMARY KEY,
    CrimeHeadID INTEGER REFERENCES CrimeHead(CrimeHeadID),
    CrimeHeadName TEXT NOT NULL,
    SeqID INTEGER
);

-- Act Table
CREATE TABLE IF NOT EXISTS Act (
    ActCode TEXT PRIMARY KEY,
    ActDescription TEXT,
    ShortName TEXT,
    Active INTEGER DEFAULT 1
);

-- Section Table
CREATE TABLE IF NOT EXISTS Section (
    ActCode TEXT REFERENCES Act(ActCode),
    SectionCode TEXT NOT NULL,
    SectionDescription TEXT,
    Active INTEGER DEFAULT 1,
    PRIMARY KEY (ActCode, SectionCode)
);

-- CrimeHeadActSection Table
CREATE TABLE IF NOT EXISTS CrimeHeadActSection (
    CrimeHeadID INTEGER REFERENCES CrimeHead(CrimeHeadID),
    ActCode TEXT,
    SectionCode TEXT,
    PRIMARY KEY (CrimeHeadID, ActCode, SectionCode),
    FOREIGN KEY (ActCode, SectionCode) REFERENCES Section(ActCode, SectionCode)
);

-- CaseMaster Table
CREATE TABLE IF NOT EXISTS CaseMaster (
    CaseMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
    CrimeNo TEXT UNIQUE NOT NULL,
    CaseNo TEXT NOT NULL,
    CrimeRegisteredDate TEXT NOT NULL,
    PolicePersonID INTEGER REFERENCES Employee(EmployeeID),
    PoliceStationID INTEGER REFERENCES Unit(UnitID),
    CaseCategoryID INTEGER REFERENCES CaseCategory(CaseCategoryID),
    GravityOffenceID INTEGER REFERENCES GravityOffence(GravityOffenceID),
    CrimeMajorHeadID INTEGER REFERENCES CrimeHead(CrimeHeadID),
    CrimeMinorHeadID INTEGER REFERENCES CrimeSubHead(CrimeSubHeadID),
    CaseStatusID INTEGER REFERENCES CaseStatusMaster(CaseStatusID),
    CourtID INTEGER REFERENCES Court(CourtID),
    IncidentFromDate TEXT,
    IncidentToDate TEXT,
    InfoReceivedPSDate TEXT,
    latitude REAL,
    longitude REAL,
    BriefFacts TEXT
);

-- ComplainantDetails Table
CREATE TABLE IF NOT EXISTS ComplainantDetails (
    ComplainantID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER REFERENCES CaseMaster(CaseMasterID),
    ComplainantName TEXT NOT NULL,
    AgeYear INTEGER,
    OccupationID INTEGER REFERENCES OccupationMaster(OccupationID),
    ReligionID INTEGER REFERENCES ReligionMaster(ReligionID),
    CasteID INTEGER REFERENCES CasteMaster(caste_master_id),
    GenderID INTEGER
);

-- ActSectionAssociation Table
CREATE TABLE IF NOT EXISTS ActSectionAssociation (
    CaseMasterID INTEGER REFERENCES CaseMaster(CaseMasterID),
    ActID TEXT REFERENCES Act(ActCode),
    SectionID TEXT NOT NULL,
    ActOrderID INTEGER,
    SectionOrderID INTEGER,
    PRIMARY KEY (CaseMasterID, ActID, SectionID)
);

-- Victim Table
CREATE TABLE IF NOT EXISTS Victim (
    VictimMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER REFERENCES CaseMaster(CaseMasterID),
    VictimName TEXT NOT NULL,
    AgeYear INTEGER,
    GenderID INTEGER,
    VictimPolice TEXT DEFAULT '0'
);

-- Accused Table
CREATE TABLE IF NOT EXISTS Accused (
    AccusedMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER REFERENCES CaseMaster(CaseMasterID),
    AccusedName TEXT NOT NULL,
    AgeYear INTEGER,
    GenderID INTEGER,
    PersonID TEXT
);

-- ArrestSurrender Table
CREATE TABLE IF NOT EXISTS ArrestSurrender (
    ArrestSurrenderID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER REFERENCES CaseMaster(CaseMasterID),
    ArrestSurrenderTypeID INTEGER,
    ArrestSurrenderDate TEXT,
    ArrestSurrenderStateId INTEGER REFERENCES State(StateID),
    ArrestSurrenderDistrictId INTEGER REFERENCES District(DistrictID),
    PoliceStationID INTEGER REFERENCES Unit(UnitID),
    IOID INTEGER REFERENCES Employee(EmployeeID),
    CourtID INTEGER REFERENCES Court(CourtID),
    AccusedMasterID INTEGER REFERENCES Accused(AccusedMasterID),
    IsAccused INTEGER DEFAULT 1,
    IsComplainantAccused INTEGER DEFAULT 0
);

-- inv_arrestsurrenderaccused Junction Table
CREATE TABLE IF NOT EXISTS inv_arrestsurrenderaccused (
    ArrestSurrenderID INTEGER REFERENCES ArrestSurrender(ArrestSurrenderID),
    AccusedMasterID INTEGER REFERENCES Accused(AccusedMasterID),
    PRIMARY KEY (ArrestSurrenderID, AccusedMasterID)
);

-- Inv_OccuranceTime Table
CREATE TABLE IF NOT EXISTS Inv_OccuranceTime (
    CaseMasterID INTEGER PRIMARY KEY REFERENCES CaseMaster(CaseMasterID),
    IncidentFromDate TEXT,
    IncidentToDate TEXT
);

-- ChargesheetDetails Table
CREATE TABLE IF NOT EXISTS ChargesheetDetails (
    CSID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER REFERENCES CaseMaster(CaseMasterID),
    csdate TEXT NOT NULL,
    cstype TEXT,
    PolicePersonID INTEGER REFERENCES Employee(EmployeeID)
);
