import { analyticsRepository } from '../../db';

interface Point {
  id: number;
  latitude: number;
  longitude: number;
  crimeGroup: string;
  visited: boolean;
  clusterId: number; // -1 for noise, 0 for unclassified, >0 for cluster
}

export class HotspotAnalytics {
  
  async detectHotspots(params: { districtId?: number; crimeHeadId?: number }) {
    const rawPoints = await analyticsRepository.getGeospatialPoints(params);
    
    // Convert to DBSCAN Points
    const points: Point[] = rawPoints.map(p => ({
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      crimeGroup: p.crimeGroup,
      visited: false,
      clusterId: 0
    }));

    // DBSCAN Parameters
    // eps = 0.015 degrees (approx 1.6 km)
    // minPts = 3 points to form a cluster
    const eps = 0.015;
    const minPts = 3;
    let nextClusterId = 1;

    for (const p of points) {
      if (p.visited) continue;
      p.visited = true;

      const neighbors = this.getNeighbors(p, points, eps);
      if (neighbors.length < minPts) {
        p.clusterId = -1; // Noise for now
      } else {
        p.clusterId = nextClusterId;
        this.expandCluster(p, neighbors, points, nextClusterId, eps, minPts);
        nextClusterId++;
      }
    }

    // Group points by cluster
    const clustersMap = new Map<number, Point[]>();
    for (const p of points) {
      if (p.clusterId > 0) {
        if (!clustersMap.has(p.clusterId)) {
          clustersMap.set(p.clusterId, []);
        }
        clustersMap.get(p.clusterId)!.push(p);
      }
    }

    // Build Hotspot Polygons (Centroids and radii or bounding boxes for Map rendering)
    const hotspots: any[] = [];
    for (const [cId, cPoints] of clustersMap.entries()) {
      // Calculate Centroid
      let sumLat = 0;
      let sumLng = 0;
      for (const cp of cPoints) {
        sumLat += cp.latitude;
        sumLng += cp.longitude;
      }
      const centroidLat = sumLat / cPoints.length;
      const centroidLng = sumLng / cPoints.length;

      // Find max distance from centroid for radius estimation
      let maxDist = 0.005; // min default radius
      for (const cp of cPoints) {
        const dist = this.getDistance(centroidLat, centroidLng, cp.latitude, cp.longitude);
        if (dist > maxDist) {
          maxDist = dist;
        }
      }

      // Compute cluster density/confidence
      const density = cPoints.length / (Math.PI * maxDist * maxDist);
      const confidence = Math.min(99, Math.round(50 + (density / 100)));

      hotspots.push({
        id: cId,
        centroid: [centroidLat, centroidLng],
        radius: maxDist, // in degrees
        pointsCount: cPoints.length,
        crimeTypes: Array.from(new Set(cPoints.map(cp => cp.crimeGroup))),
        confidence: `${confidence}%`
      });
    }

    return {
      points: rawPoints.map(p => ({ lat: p.latitude, lng: p.longitude, label: p.crimeGroup })),
      hotspots: hotspots.sort((a, b) => b.pointsCount - a.pointsCount)
    };
  }

  private expandCluster(
    p: Point, 
    neighbors: Point[], 
    points: Point[], 
    clusterId: number, 
    eps: number, 
    minPts: number
  ) {
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      if (!neighbor.visited) {
        neighbor.visited = true;
        const nextNeighbors = this.getNeighbors(neighbor, points, eps);
        if (nextNeighbors.length >= minPts) {
          // Add unique nextNeighbors to neighbors array to check
          for (const nn of nextNeighbors) {
            if (!neighbors.some(n => n.id === nn.id)) {
              neighbors.push(nn);
            }
          }
        }
      }
      if (neighbor.clusterId <= 0) {
        neighbor.clusterId = clusterId;
      }
    }
  }

  private getNeighbors(p: Point, points: Point[], eps: number): Point[] {
    const neighbors: Point[] = [];
    for (const other of points) {
      const dist = this.getDistance(p.latitude, p.longitude, other.latitude, other.longitude);
      if (dist <= eps) {
        neighbors.push(other);
      }
    }
    return neighbors;
  }

  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = lat1 - lat2;
    const dLng = lng1 - lng2;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }
}
