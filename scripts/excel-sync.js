import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../src/data');
const LOCALE_DIR = path.resolve(__dirname, '../src/locales');
const EXCEL_FILE = path.resolve(DATA_DIR, 'game_data.xlsx');

const FILES = {
  advisors: 'advisors.json',
  buildings: 'buildings.json',
  ideas: 'ideas.json',
  techs: 'technologies.json',
  resources: 'resources.json',
  map: 'worldMap.json'
};

const LOCALES = ['en', 'zh'];

// Helper to check if a string is valid JSON
const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

// Key generation strategies
const getKey = (type, id, field) => {
  switch (type) {
    case 'advisors':
      return field === 'name' ? `advisor.${id}.name` : `advisor.${id}.desc`;
    case 'buildings':
      return field === 'name' ? `building.${id}.name` : `building.${id}.desc`;
    case 'techs':
      return field === 'name' ? `tech.${id}.name` : `tech.${id}.desc`;
    case 'ideas':
      return field === 'name' ? `idea.${id}.name` : `idea.${id}.desc`;
    case 'resources':
      return `resource.${id}`; // Resources only have name
    default:
      return null;
  }
};

const getTextFields = (type) => {
  switch (type) {
    case 'advisors': return ['name', 'biography'];
    case 'buildings': return ['name', 'description'];
    case 'techs': return ['name', 'description']; // Techs might not have desc in current json but valid
    case 'ideas': return ['name', 'description']; // Ideas might not have desc in current json but valid
    case 'resources': return ['name'];
    default: return [];
  }
};

// Convert JSON data to Sheet Rows
const jsonToSheet = (type, data, localesData) => {
  if (!data || data.length === 0) return [];
  
  const textFields = getTextFields(type);

  return data.map(item => {
    const row = { id: item.id };
    
    // Handle text fields (localization)
    textFields.forEach(field => {
      const key = getKey(type, item.id, field);
      
      // Special case: map biography -> desc for consistency in keys, but column headers can be specific
      // We will use standard column names: name_en, name_zh, desc_en, desc_zh
      const colPrefix = field === 'biography' ? 'desc' : (field === 'description' ? 'desc' : field);
      
      LOCALES.forEach(lang => {
        const colName = `${colPrefix}_${lang}`;
        let val = localesData[lang][key];
        
        // Fallback to data file content if not in locale
        if (!val && item[field]) {
           // Heuristic for fallback based on existing data
           if (type === 'advisors') {
             if (field === 'name' && lang === 'zh') val = item[field]; // Advisor names are ZH
             if (field === 'biography' && lang === 'en') val = item[field]; // Advisor bios are EN
           } else {
             // Default to EN for others
             if (lang === 'en') val = item[field];
           }
        }
        
        row[colName] = val || '';
      });
    });

    // Handle non-text fields
    for (const [key, value] of Object.entries(item)) {
      if (textFields.includes(key)) continue; // Skip text fields
      
      if (typeof value === 'object' && value !== null) {
        row[key] = JSON.stringify(value);
      } else {
        row[key] = value;
      }
    }
    // Debug log for first item
    if (data.indexOf(item) === 0) {
      console.log(`[DEBUG] Export row keys for ${type}:`, Object.keys(row));
    }
    return row;
  });
};

// Convert Sheet Rows to JSON data
const sheetToJson = (type, rows, localesData, validKeysSet) => {
  const textFields = getTextFields(type);

  return rows.map(row => {
    const item = {};
    
    // Debug log for first item
    if (rows.indexOf(row) === 0) {
      console.log(`[DEBUG] Import row keys for ${type}:`, Object.keys(row));
    }
    
    // Extract text fields to locales
    textFields.forEach(field => {
      const key = getKey(type, row.id, field);
      if (key && validKeysSet) validKeysSet.add(key);

      const colPrefix = field === 'biography' ? 'desc' : (field === 'description' ? 'desc' : field);
      
      LOCALES.forEach(lang => {
        const colName = `${colPrefix}_${lang}`;
        if (row[colName]) {
          localesData[lang][key] = row[colName];
        }
      });
    });

    // Extract non-text fields to item
    for (const [key, value] of Object.entries(row)) {
      // Skip locale columns
      if (key.endsWith('_en') || key.endsWith('_zh')) continue;
      
      // Try to parse JSON strings back to objects
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
          item[key] = JSON.parse(value);
        } catch (e) {
          item[key] = value;
        }
      } else {
        item[key] = value;
      }
    }
    return item;
  });
};

const loadLocales = () => {
  const locales = {};
  LOCALES.forEach(lang => {
    const p = path.join(LOCALE_DIR, `${lang}.json`);
    if (fs.existsSync(p)) {
      locales[lang] = JSON.parse(fs.readFileSync(p, 'utf-8'));
    } else {
      locales[lang] = {};
    }
  });
  return locales;
};

const saveLocales = (locales) => {
  LOCALES.forEach(lang => {
    const p = path.join(LOCALE_DIR, `${lang}.json`);
    // Sort keys for consistent output
    const sorted = Object.keys(locales[lang]).sort().reduce((acc, key) => {
      acc[key] = locales[lang][key];
      return acc;
    }, {});
    fs.writeFileSync(p, JSON.stringify(sorted, null, 2));
  });
};

const exportToExcel = () => {
  console.log('Exporting JSON files to Excel...');
  const workbook = XLSX.utils.book_new();
  const locales = loadLocales();

  for (const [sheetName, filename] of Object.entries(FILES)) {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      console.log(`Processing ${filename}...`);
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(rawData);
      
      // Pass locales to help populate columns
      const rows = jsonToSheet(sheetName, jsonData, locales);
      
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    } else {
      console.warn(`Warning: ${filename} not found.`);
    }
  }

  XLSX.writeFile(workbook, EXCEL_FILE);
  console.log(`Successfully exported to ${EXCEL_FILE}`);
};

const importFromExcel = () => {
  console.log('Importing Excel to JSON files...');
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`Error: ${EXCEL_FILE} not found.`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_FILE);
  const locales = loadLocales();
  const validKeys = new Set();

  for (const [sheetName, filename] of Object.entries(FILES)) {
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
      console.log(`Processing sheet ${sheetName}...`);
      const rows = XLSX.utils.sheet_to_json(worksheet);
      
      // This will update 'locales' object by reference and return clean items
      const jsonData = sheetToJson(sheetName, rows, locales, validKeys);
      
      const filePath = path.join(DATA_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
      console.log(`Updated ${filename}`);
    } else {
      console.warn(`Warning: Sheet ${sheetName} not found in Excel file.`);
    }
  }

  cleanupLocales(locales, validKeys);
  saveLocales(locales);
  console.log('Successfully imported all data and updated locales.');
};

const cleanupLocales = (locales, validKeys) => {
  const MANAGED_PREFIXES = [
    { prefix: 'advisor.', pattern: /^advisor\..+\.(name|desc)$/ },
    { prefix: 'building.', pattern: /^building\..+\.(name|desc)$/ },
    { prefix: 'tech.', pattern: /^tech\..+\.(name|desc)$/ },
    { prefix: 'idea.', pattern: /^idea\..+\.(name|desc)$/ },
    { prefix: 'resource.', pattern: /^resource\.[^.]+$/ }
  ];

  LOCALES.forEach(lang => {
    Object.keys(locales[lang]).forEach(key => {
      // Check if key matches any managed pattern
      const managedType = MANAGED_PREFIXES.find(p => p.pattern.test(key));
      
      if (managedType && !validKeys.has(key)) {
        console.log(`[Cleanup] Removing orphaned key from ${lang}: ${key}`);
        delete locales[lang][key];
      }
    });
  });
};

// Main execution
const mode = process.argv[2];

if (mode === 'export') {
  exportToExcel();
} else if (mode === 'import') {
  importFromExcel();
} else {
  console.log('Usage: node scripts/excel-sync.js [export|import]');
}
