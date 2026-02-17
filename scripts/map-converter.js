
import { Jimp } from 'jimp';
import { topology } from 'topojson-server';
import { contours } from 'd3-contour';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'path';

/**
 * CONFIGURATION
 */
const INPUT_IMAGE = 'province_map.png';
const INPUT_CSV = 'provinces.csv';
const OUTPUT_FILE = 'src/data/worldMapGeo.json';

// Ensure this matches your CSV column names
// Expected CSV format: id;R;G;B (No header)
// Example: 
// 0;0;0;0
// 1;128;0;0

async function main() {
  console.log('🗺️  Starting Map Conversion Process...');

  // 1. Load CSV and create Color Map
  console.log(`Reading ${INPUT_CSV}...`);
  let csvData;
  try {
    const csvContent = await fs.readFile(INPUT_CSV, 'utf-8');
    csvData = parse(csvContent, { 
      columns: ['id', 'r', 'g', 'b'], 
      delimiter: ';',
      skip_empty_lines: true,
      trim: true 
    });
  } catch (e) {
    console.error(`❌ Failed to read CSV: ${e.message}`);
    console.log('ℹ️  Please ensure you have a provinces.csv file with "id;R;G;B" format.');
    process.exit(1);
  }

  // Map Hex Color -> Integer ID
  // We use an integer ID for the topology generation because it's faster/smaller
  const colorToId = new Map();
  const idToProvince = new Map();
  
  // Reserve ID 0 for "Empty/Ocean"
  let nextId = 1;

  csvData.forEach(row => {
    const r = parseInt(row.r, 10);
    const g = parseInt(row.g, 10);
    const b = parseInt(row.b, 10);
    
    // Convert RGB to 32-bit integer (R G B A) with A=255
    const colorInt = (r << 24 | g << 16 | b << 8 | 255) >>> 0;
    
    // We map the numeric ID used in topology back to the string ID from CSV
    colorToId.set(colorInt, nextId);
    idToProvince.set(nextId, row.id);
    
    nextId++;
  });

  console.log(`✅ Loaded ${csvData.length} province definitions.`);

  // 2. Load Image
  console.log(`Reading ${INPUT_IMAGE}...`);
  let image;
  try {
    image = await Jimp.read(INPUT_IMAGE);
  } catch (e) {
    console.error(`❌ Failed to read Image: ${e.message}`);
    process.exit(1);
  }

  const { width, height } = image.bitmap;
  console.log(`✅ Image loaded (${width}x${height}). Processing pixels...`);

  // Debug Stats
  const debugStats = {
    totalPixels: width * height,
    matchedPixels: 0,
    uniqueColorsFound: new Set(),
    sampleColors: [] // Store first 5 unmatched colors
  };

  // 3. Convert Pixels to Value Grid
  const values = new Int32Array(width * height);

  image.scan(0, 0, width, height, (x, y, idx) => {
    // Jimp stores data as RGBA
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const a = image.bitmap.data[idx + 3];

    // Convert to 32-bit integer (R G B A) matches our map key
    const colorInt = (r << 24 | g << 16 | b << 8 | a) >>> 0;

    const id = colorToId.get(colorInt);
    
    // Debug Logic
    debugStats.uniqueColorsFound.add(colorInt);
    if (id) {
      debugStats.matchedPixels++;
    } else {
      if (debugStats.sampleColors.length < 5 && colorInt !== 0) {
        debugStats.sampleColors.push({
          r, g, b, a, 
          hex: `0x${colorInt.toString(16)}`,
          int: colorInt
        });
      }
    }

    // If id is found, set it. If not, it's 0 (ocean/background)
    values[y * width + x] = id || 0;
  });

  console.log('✅ Pixel processing complete.');
  console.log('--- DEBUG REPORT ---');
  console.log(`Total Pixels: ${debugStats.totalPixels}`);
  console.log(`Matched Pixels: ${debugStats.matchedPixels} (${(debugStats.matchedPixels / debugStats.totalPixels * 100).toFixed(2)}%)`);
  console.log(`Unique Colors Found in Image: ${debugStats.uniqueColorsFound.size}`);
  
  if (debugStats.matchedPixels === 0) {
     console.log('❌ CRITICAL: No pixels matched your CSV colors!');
     process.exit(1);
  }

  // 4. Generate Contours
  console.log('Generating Vectors (this may take a while)...');
  
  const uniqueIds = Array.from(debugStats.uniqueColorsFound)
    .map(colorInt => colorToId.get(colorInt))
    .filter(id => id && id !== 0); // valid IDs only

  console.log(`Vectorizing ${uniqueIds.length} unique provinces...`);

  const features = [];
  // Reuse buffer for memory efficiency
  const binaryGrid = new Float32Array(width * height);

  let processedCount = 0;
  const totalCount = uniqueIds.length;

  for (const id of uniqueIds) {
    // Fill binary grid for this ID
    for(let i = 0; i < values.length; i++) {
       binaryGrid[i] = (values[i] === id) ? 1 : 0;
    }
    
    // Generate contour
    // contours() returns an array of MultiPolygons (one for each threshold)
    // We only have one threshold (0.5), so we take index 0
    const geometry = contours().size([width, height]).thresholds([0.5])(binaryGrid)[0];
    
    if (geometry) {
       features.push({
         type: 'Feature',
         properties: { id: idToProvince.get(id) }, // Use the string ID
         geometry: geometry
       });
    }

    processedCount++;
    if (processedCount % 10 === 0) {
      process.stdout.write(`\rProgress: ${processedCount}/${totalCount} provinces...`);
    }
  }
  process.stdout.write('\n');

  console.log(`✅ Generated ${features.length} vector features.`);

  // 5. Convert to TopoJSON
  console.log('Converting to TopoJSON...');
  const topo = topology({
    provinces: {
      type: 'FeatureCollection',
      features: features
    }
  });

  // 6. Save Output
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(topo));
  
  console.log(`🎉 Success! Vector map saved to ${OUTPUT_FILE}`);
  console.log(`   File size: ${(await fs.stat(OUTPUT_FILE)).size / 1024} KB`);
}

main().catch(console.error);
