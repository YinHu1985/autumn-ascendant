import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import gm from 'gm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.resolve(__dirname, '../raw_assets/ideas');
const PUBLIC_DIR = path.resolve(__dirname, '../public/ideas');
const TARGET_SIZE = 128; // 128x128 for high DPI

// Ensure output dir exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function processImages() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log('No raw_assets/ideas directory found.');
    return;
  }

  const files = fs.readdirSync(RAW_DIR);
  console.log(`Scanning ${RAW_DIR} for images...`);

  let processedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png|bmp|tiff|gif)$/i)) {
      const inputPath = path.join(RAW_DIR, file);
      const basename = path.parse(file).name;
      const outputFilename = basename + '.png';
      const outputPath = path.join(PUBLIC_DIR, outputFilename);

      try {
        await new Promise((resolve, reject) => {
          gm(inputPath)
            .resize(TARGET_SIZE, TARGET_SIZE, '!') // Force resize to exact dimensions (might distort if not square)
            .write(outputPath, (err) => {
              if (err) reject(err);
              else resolve();
            });
        });
        console.log(`Processed: ${file} -> ${outputFilename}`);
        processedCount++;
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
        errorCount++;
      }
    }
  }

  console.log(`\nProcessing complete!`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Errors: ${errorCount}`);
}

processImages().catch(console.error);
