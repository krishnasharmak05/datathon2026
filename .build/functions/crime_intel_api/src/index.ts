import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { orchestrator } from './core/orchestrator';
import { analyticsRepository, accusedRepository, caseRepository } from './db';
import catalyst from 'zcatalyst-sdk-node';
import { CatalystContext } from './core/context';

function isValidCatalystRequest(req: any): boolean {
  return !!(
    req &&
    req.headers &&
    typeof req.headers === 'object' &&
    req.headers['x-zc-projectid'] &&
    req.headers['x-zc-project-key']
  );
}

// Load environmental parameters
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  if (isValidCatalystRequest(req)) {
    try {
      const catalystApp = catalyst.initialize(req as any);
      CatalystContext.run(catalystApp, () => {
        next();
      });
    } catch (error) {
      console.error('Error initializing Catalyst App for request:', error);
      next(error);
    }
  } else {
    next();
  }
});

app.use(cors());
app.use(express.json());

// Conversational analytics query endpoint
app.post('/api/query', async (req, res) => {
  const { query, language, isTerminal } = req.body;
  if (!query) {
    return res.status(400).json({ status: 'error', message: 'Query parameter is required' });
  }

  const response = await orchestrator.processQuery(query, language || 'en', isTerminal);
  res.json(response);
});

// Demographic dashboard data endpoint
app.get('/api/demographics', async (req, res) => {
  try {
    const data = await analyticsRepository.getDemographicsData();
    res.json({ status: 'success', data });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// General crime KPIs and distributions endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [distribution, districts, stations] = await Promise.all([
      analyticsRepository.getCrimeDistribution(),
      analyticsRepository.getDistrictStats(),
      analyticsRepository.getStationStats()
    ]);
    res.json({
      status: 'success',
      data: {
        distribution,
        districts,
        stations
      }
    });
  } catch (error: any) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
  }
});

// Direct timeline progression query endpoint (bypasses LLM query processor)
app.get('/api/timeline/:caseNo', async (req, res) => {
  try {
    const { caseNo } = req.params;
    if (!caseNo) {
      return res.status(400).json({ status: 'error', message: 'Case number is required' });
    }
    const events = await analyticsRepository.getTimelineEvents(caseNo);
    res.json({
      status: 'success',
      data: {
        caseNo,
        events
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Helper function to resolve suspect search string to a unique PersonID
async function resolvePerson(searchStr: string): Promise<
  | { status: 'success'; personId: string; accusedName: string }
  | { status: 'conflict'; options: { personId: string; accusedName: string }[] }
  | { status: 'error'; message: string }
> {
  // 1. Check if direct PersonID
  const directMatches = await accusedRepository.getByPersonId(searchStr);
  if (directMatches && directMatches.length > 0) {
    return {
      status: 'success',
      personId: directMatches[0].PersonID,
      accusedName: directMatches[0].AccusedName
    };
  }

  // 2. Check if Crime No / Case No
  const caseMatch = await caseRepository.getByCrimeNo(searchStr);
  if (caseMatch) {
    const accusedInCase = await accusedRepository.getByCaseId(caseMatch.CaseMasterID);
    if (accusedInCase && accusedInCase.length > 0) {
      // Group by unique PersonID to find unique suspects
      const uniqueSuspects: { personId: string; accusedName: string }[] = [];
      const seenIds = new Set<string>();
      for (const match of accusedInCase) {
        if (!seenIds.has(match.PersonID)) {
          seenIds.add(match.PersonID);
          uniqueSuspects.push({ personId: match.PersonID, accusedName: match.AccusedName });
        }
      }

      if (uniqueSuspects.length === 1) {
        return {
          status: 'success',
          personId: uniqueSuspects[0].personId,
          accusedName: uniqueSuspects[0].accusedName
        };
      }

      return {
        status: 'conflict',
        options: uniqueSuspects
      };
    } else {
      return {
        status: 'error',
        message: `No accused/suspects found in Case/Crime: "${searchStr}"`
      };
    }
  }

  // 3. Otherwise search by name
  const nameMatches = await accusedRepository.searchByName(searchStr);
  if (!nameMatches || nameMatches.length === 0) {
    return {
      status: 'error',
      message: `No accused found matching Name, Person ID, or Case/Crime No: "${searchStr}"`
    };
  }

  // Group by unique PersonID to find unique suspects
  const uniqueSuspects: { personId: string; accusedName: string }[] = [];
  const seenIds = new Set<string>();
  for (const match of nameMatches) {
    if (!seenIds.has(match.PersonID)) {
      seenIds.add(match.PersonID);
      uniqueSuspects.push({ personId: match.PersonID, accusedName: match.AccusedName });
    }
  }

  if (uniqueSuspects.length === 1) {
    return {
      status: 'success',
      personId: uniqueSuspects[0].personId,
      accusedName: uniqueSuspects[0].accusedName
    };
  }

  return {
    status: 'conflict',
    options: uniqueSuspects
  };
}

// Direct network query endpoint (bypasses LLM query processor)
app.get('/api/network', async (req, res) => {
  try {
    const { q, personId } = req.query;
    let targetPid = personId as string;
    
    if (!targetPid && q) {
      const resolved = await resolvePerson(q as string);
      if (resolved.status === 'error') {
        return res.status(404).json({ status: 'error', message: resolved.message });
      }
      if (resolved.status === 'conflict') {
        return res.status(409).json({
          status: 'conflict',
          message: 'Multiple suspects found matching the name. Please select one.',
          options: resolved.options
        });
      }
      targetPid = resolved.personId;
    }
    
    if (!targetPid) {
      return res.status(400).json({ status: 'error', message: 'Query parameter q or personId is required' });
    }
    
    const networkData: any = await analyticsRepository.getNetworkData(targetPid);
    if (networkData && networkData.status === 'conflict') {
      return res.status(409).json({
        status: 'conflict',
        message: networkData.message,
        options: networkData.options
      });
    }
    
    res.json({ status: 'success', data: networkData });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Direct profile query endpoint (bypasses LLM query processor)
app.get('/api/profile', async (req, res) => {
  try {
    const { q, personId } = req.query;
    let targetPid = personId as string;
    
    if (!targetPid && q) {
      const resolved = await resolvePerson(q as string);
      if (resolved.status === 'error') {
        return res.status(404).json({ status: 'error', message: resolved.message });
      }
      if (resolved.status === 'conflict') {
        return res.status(409).json({
          status: 'conflict',
          message: 'Multiple suspects found matching the name. Please select one.',
          options: resolved.options
        });
      }
      targetPid = resolved.personId;
    }
    
    if (!targetPid) {
      return res.status(400).json({ status: 'error', message: 'Query parameter q or personId is required' });
    }
    
    const profileData = await orchestrator.profiling.getAccusedProfile({ personId: targetPid });
    if (profileData && (profileData as any).status === 'conflict') {
      return res.status(409).json({
        status: 'conflict',
        message: (profileData as any).message,
        options: (profileData as any).options
      });
    }
    res.json({ status: 'success', data: profileData });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Direct hotspots query endpoint (bypasses LLM query processor)
app.get('/api/hotspots', async (req, res) => {
  try {
    const { crimeHeadId } = req.query;
    const filter: any = {};
    if (crimeHeadId) {
      filter.crimeHeadId = parseInt(crimeHeadId as string, 10);
    }
    const hotspotsData = await orchestrator.hotspot.detectHotspots(filter);
    res.json({ status: 'success', data: hotspotsData });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// App health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export = app;
