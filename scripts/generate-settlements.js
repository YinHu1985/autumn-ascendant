
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as topojson from 'topojson-client';
import { geoPath } from 'd3-geo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.resolve(__dirname, '../src/data/worldMapGeo.json');
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/worldMap.json');

async function generateSettlements() {
  try {
    console.log('Reading map data...');
    const rawData = await fs.readFile(INPUT_FILE, 'utf-8');
    const topology = JSON.parse(rawData);

    if (!topology.objects || !topology.objects.provinces) {
      throw new Error('Invalid TopoJSON: missing objects.provinces');
    }

    // Get features to calculate centroids
    // @ts-ignore
    const features = topojson.feature(topology, topology.objects.provinces).features;
    
    // Get neighbors (returns array of arrays of indices)
    // @ts-ignore
    const neighborsIndices = topojson.neighbors(topology.objects.provinces.geometries);

    console.log(`Found ${features.length} provinces.`);

    const settlements = features.map((feature, index) => {
      // Determine ID
      const rawId = feature.properties.id || feature.id;
      if (!rawId) {
        console.warn(`Feature at index ${index} has no ID`, feature);
        return null;
      }
      
      const settlementId = rawId.toString().startsWith('settlement-') ? rawId : `settlement-${rawId}`;
      const numericId = parseInt(rawId.toString().replace('settlement-', ''), 10);

      // Calculate Centroid
      const centroid = geoPath().centroid(feature);
      
      // Calculate Connections (Neighbors)
      const myNeighborsIndices = neighborsIndices[index];
      const connections = myNeighborsIndices.map(neighborIndex => {
        const neighborFeature = features[neighborIndex];
        const nRawId = neighborFeature.properties.id || neighborFeature.id;
        const targetId = nRawId.toString().startsWith('settlement-') ? nRawId : `settlement-${nRawId}`;
        return {
          targetId: targetId,
          type: 'normal'
        };
      });

      // Simple Owner Distribution Logic
      // Distribute among 3 countries based on ID or position
      const owners = ['country_1', 'country_2', 'country_3'];
      const ownerId = owners[numericId % owners.length];
      
      const terrains = ['plain', 'forest', 'hills', 'mountains', 'water', 'marsh'];
      const terrain = terrains[Math.floor(Math.random() * terrains.length)];

      return {
        id: settlementId,
        name: `Settlement ${rawId}`,
        ownerId: ownerId,
        position: {
          x: Math.round(centroid[0]),
          y: Math.round(centroid[1])
        },
        terrain: terrain,
        connections: connections,
        // Default Economy Values
        population: {
          urban: 1000 + Math.floor(Math.random() * 5000),
          rural: 5000 + Math.floor(Math.random() * 10000)
        },
        development: {
          urban: 1 + Math.floor(Math.random() * 5),
          rural: 1 + Math.floor(Math.random() * 10)
        },
        buildings: []
      };
    }).filter(s => s !== null);

    console.log(`Generated ${settlements.length} settlements.`);

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(settlements, null, 2));
    console.log(`Successfully wrote to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error generating settlements:', error);
  }
}

generateSettlements();
