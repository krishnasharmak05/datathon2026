import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { orchestrator } from './core/orchestrator';
import { analyticsRepository } from './db';

// Load environmental parameters
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Conversational analytics query endpoint
app.post('/api/query', async (req, res) => {
  const { query, language } = req.body;
  if (!query) {
    return res.status(400).json({ status: 'error', message: 'Query parameter is required' });
  }

  const response = await orchestrator.processQuery(query, language || 'en');
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
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// App health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Crime Intelligence API Server is listening on http://localhost:${PORT}`);
});
