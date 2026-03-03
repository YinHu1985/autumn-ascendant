import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import smartcrop from 'smartcrop-gm';
import gm from 'gm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.resolve(__dirname, '../raw_assets/portraits');
const PUBLIC_DIR = path.resolve(__dirname, '../public/portraits');
// Target size: 4:3 ratio. 
// Let's use 128 width. Height = 128 * (3/4) = 96.
const TARGET_WIDTH = 128;
const TARGET_HEIGHT = 96;

// Ensure output dir exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function processImages() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log('No raw_assets/portraits directory found. Creating it...');
    fs.mkdirSync(RAW_DIR, { recursive: true });
    console.log('Please put your raw images in raw_assets/portraits');
    return;
  }

  // Check if gm is available
  try {
      await new Promise((resolve, reject) => {
          gm(RAW_DIR).size((err) => { 
              resolve();
          });
      });
  } catch (err) {
      // Ignore initial check error
  }

  const files = fs.readdirSync(RAW_DIR);
  let processedCount = 0;
  
  console.log(`Scanning ${RAW_DIR} for images...`);

  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png|bmp|tiff|gif)$/i)) {
      const inputPath = path.join(RAW_DIR, file);
      // Output as .png always
      const outputFilename = path.parse(file).name + '.png'; 
      const outputPath = path.join(PUBLIC_DIR, outputFilename);

      try {
        console.log(`Processing ${file}...`);
        
        // 1. Get dimensions
        const dimensions = await new Promise((resolve, reject) => {
            gm(inputPath).size((err, size) => {
                if (err) reject(err);
                else resolve(size);
            });
        });
        
        const { width, height } = dimensions;
        
        // 2. Smart Crop for 4:3 Ratio
        // Calculate the largest possible 4:3 rectangle
        // Ratio = Width / Height = 4 / 3 = 1.333...
        
        let cropW, cropH;
        
        // Try fitting by height first (Height is the limiter?)
        // If we use full height, width = height * (4/3)
        if (height * (4/3) <= width) {
            // Limited by height
            cropH = height;
            cropW = Math.floor(height * (4/3));
        } else {
            // Limited by width
            cropW = width;
            cropH = Math.floor(width * (3/4));
        }
        
        // Pass the target dimensions to smartcrop
        // We use minScale: 1.0 to force it to use the largest possible crop of this aspect ratio
        const result = await smartcrop.crop(inputPath, {
            width: cropW,
            height: cropH,
            minScale: 1.0 
        });
        
        const crop = result.topCrop;
        
        // 3. Apply crop and resize
        await new Promise((resolve, reject) => {
            gm(inputPath)
                .crop(crop.width, crop.height, crop.x, crop.y)
                .resize(TARGET_WIDTH, TARGET_HEIGHT)
                .write(outputPath, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
        
        console.log(`Saved ${outputFilename} (crop: ${crop.width}x${crop.height} at ${crop.x},${crop.y} -> ${TARGET_WIDTH}x${TARGET_HEIGHT})`);
        processedCount++;
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
  
  console.log(`Finished! Processed ${processedCount} images.`);
}

processImages().catch(console.error);
