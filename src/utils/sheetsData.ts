import type { NounData, Gender, VerbData } from '../types';

const SHEET_ID = '1j1YiF4Vj33guXhIJm1DkJDUJQX_HNKPDUSmNrpooADw';
const NOUNS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
// Verbs are in a different sheet/tab - using the correct gid for Verb worksheet
const VERBS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1459632609`;

// Map gender strings from sheet to our Gender type
function normalizeGender(gender: string): Gender {
  const normalized = gender.trim();
  if (normalized.toLowerCase().includes('masculine')) {
    return 'Masculine';
  }
  if (normalized.toLowerCase().includes('feminine')) {
    return 'Feminine';
  }
  if (normalized.toLowerCase().includes('neutral')) {
    return 'Neutral';
  }
  // Default fallback
  return 'Neutral';
}

// Parse a CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      if (inQuotes && line[j + 1] === '"') {
        // Escaped quote
        current += '"';
        j++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Parse CSV data
function parseCSV(csvText: string): NounData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

  // Find column indices (case-insensitive)
  const srNoIndex = headers.findIndex(h => h.includes('sr no') || h.includes('srno') || h === 'sr no.');
  const nounIndex = headers.findIndex(h => h === 'noun');
  const germanWordIndex = headers.findIndex(h => h.includes('german') && h.includes('word'));
  const articleIndex = headers.findIndex(h => h === 'article');
  const genderIndex = headers.findIndex(h => h === 'gender');
  const pluralIndex = headers.findIndex(h => h === 'plural');
  const exampleIndex = headers.findIndex(h => h === 'example');

  const nouns: NounData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());

    if (values.length < Math.max(srNoIndex, nounIndex, germanWordIndex, articleIndex, genderIndex) + 1) continue;

    const srNoStr = values[srNoIndex] || '';
    const srNo = parseInt(srNoStr, 10);
    if (isNaN(srNo) || srNo === 0) continue;

    const noun = values[nounIndex] || '';
    const germanWord = values[germanWordIndex] || '';
    const article = values[articleIndex] || '';
    const gender = normalizeGender(values[genderIndex] || '');
    const plural = values[pluralIndex] || '';
    const example = values[exampleIndex] || '';

    if (noun && germanWord && article && gender) {
      nouns.push({
        srNo,
        noun,
        germanWord,
        article,
        gender,
        plural,
        example,
      });
    }
  }

  return nouns;
}



// Parse verbs CSV data
function parseVerbsCSV(csvText: string): VerbData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    console.warn('Not enough lines in CSV:', lines.length);
    return [];
  }

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const headersLower = headers.map(h => h.toLowerCase());

  // Debug: log headers to help troubleshoot
  console.log('Verb CSV Headers:', headers);

  // Find column indices - more flexible matching
  const infinitiveIndex = headersLower.findIndex(h => h === 'infinitive');
  const meaningIndex = headersLower.findIndex(h => h === 'meaning');
  const ichIndex = headersLower.findIndex(h => h === 'ich');
  const duIndex = headersLower.findIndex(h => h === 'du');
  const erSieEsIndex = headersLower.findIndex(h =>
    h === 'er/sie/es' ||
    h === 'er sie es' ||
    h.includes('er/sie') ||
    h.includes('er sie')
  );
  const wirIndex = headersLower.findIndex(h => h === 'wir');
  const ihrIndex = headersLower.findIndex(h => h === 'ihr');
  const sieSieIndex = headersLower.findIndex(h =>
    h === 'sie/sie' ||
    h === 'sie sie' ||
    (h.includes('sie') && headersLower.indexOf(h) !== erSieEsIndex)
  );
  const pastIndex = headersLower.findIndex(h =>
    (h.includes('past') && h.includes('präteritum')) ||
    h.includes('präteritum') ||
    (h.includes('past') && !h.includes('participle'))
  );
  const pastParticipleIndex = headersLower.findIndex(h =>
    h.includes('past participle') ||
    (h.includes('participle') && !h.includes('präteritum'))
  );
  const auxiliaryIndex = headersLower.findIndex(h => h === 'auxiliary');
  const prepositionsIndex = headersLower.findIndex(h => h === 'prepositions' || h === 'preposition');
  const exampleIndex = headersLower.findIndex(h =>
    (h.includes('example') && h.includes('sentence')) ||
    h.includes('example sentence') ||
    h === 'example'
  );
  const notesIndex = headersLower.findIndex(h => h === 'notes' || h === 'note');

  // Check if we found the essential columns
  if (infinitiveIndex < 0 || meaningIndex < 0 || ichIndex < 0) {
    console.error('Missing required columns. Found:', {
      infinitive: infinitiveIndex >= 0,
      meaning: meaningIndex >= 0,
      ich: ichIndex >= 0,
      headers: headers
    });
    return [];
  }

  const verbs: VerbData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());

    // Skip empty rows
    if (values.every(v => !v.trim())) continue;

    // Check if we have enough values
    const maxIndex = Math.max(
      infinitiveIndex,
      meaningIndex,
      ichIndex,
      duIndex >= 0 ? duIndex : 0,
      erSieEsIndex >= 0 ? erSieEsIndex : 0,
      wirIndex >= 0 ? wirIndex : 0,
      ihrIndex >= 0 ? ihrIndex : 0
    );

    if (values.length < maxIndex + 1) {
      console.warn(`Row ${i} has insufficient columns. Expected at least ${maxIndex + 1}, got ${values.length}`);
      continue;
    }

    const infinitive = values[infinitiveIndex]?.trim() || '';
    const meaning = values[meaningIndex]?.trim() || '';
    const ich = values[ichIndex]?.trim() || '';
    const du = values[duIndex >= 0 ? duIndex : ichIndex]?.trim() || '';
    const erSieEs = values[erSieEsIndex >= 0 ? erSieEsIndex : ichIndex]?.trim() || '';
    const wir = values[wirIndex >= 0 ? wirIndex : ichIndex]?.trim() || '';
    const ihr = values[ihrIndex >= 0 ? ihrIndex : ichIndex]?.trim() || '';
    const sieSie = values[sieSieIndex >= 0 ? sieSieIndex : ichIndex]?.trim() || '';
    const past = values[pastIndex >= 0 ? pastIndex : -1]?.trim() || '';
    const pastParticiple = values[pastParticipleIndex >= 0 ? pastParticipleIndex : -1]?.trim() || '';
    const auxiliary = values[auxiliaryIndex >= 0 ? auxiliaryIndex : -1]?.trim() || '';
    const prepositions = values[prepositionsIndex >= 0 ? prepositionsIndex : -1]?.trim() || '';
    const exampleSentence = values[exampleIndex >= 0 ? exampleIndex : -1]?.trim() || '';
    const notes = values[notesIndex >= 0 ? notesIndex : -1]?.trim() || '';

    // Only add if we have at least infinitive, meaning, and ich conjugation
    if (infinitive && meaning && ich) {
      verbs.push({
        infinitive,
        meaning,
        ich,
        du,
        'er/sie/es': erSieEs,
        wir,
        ihr,
        'sie/Sie': sieSie,
        past,
        pastParticiple,
        auxiliary,
        prepositions,
        exampleSentence,
        notes,
      });
    } else {
      console.warn(`Row ${i} skipped - missing required fields:`, { infinitive, meaning, ich });
    }
  }

  console.log(`Parsed ${verbs.length} verbs from CSV`);
  return verbs;
}

export async function fetchNounsData(): Promise<NounData[]> {
  try {
    const response = await fetch(NOUNS_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching nouns data:', error);
    throw error;
  }
}

export async function fetchVerbsData(): Promise<VerbData[]> {
  try {
    const response = await fetch(VERBS_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const csvText = await response.text();

    // Check if we got the wrong sheet (noun data instead of verb data)
    const firstLine = csvText.split('\n')[0]?.toLowerCase() || '';
    if (firstLine.includes('noun') && firstLine.includes('gender') && !firstLine.includes('infinitive')) {
      console.error('⚠️ WARNING: The VERBS_CSV_URL appears to be fetching Noun data instead of Verb data.');
      console.error('Please update the gid in VERBS_CSV_URL to point to the Verb worksheet.');
      console.error('Current URL:', VERBS_CSV_URL);
      console.error('To find the correct gid:');
      console.error('1. Open your Google Sheet');
      console.error('2. Click on the "Verb" tab');
      console.error('3. Look at the URL - it will show gid=XXXXX');
      console.error('4. Replace gid=0 in VERBS_CSV_URL with the correct gid');
    }

    const verbs = parseVerbsCSV(csvText);

    if (verbs.length === 0) {
      console.warn('No verbs parsed. This might mean:');
      console.warn('1. Wrong gid - the URL is pointing to the wrong sheet');
      console.warn('2. Column headers don\'t match expected format');
      console.warn('3. The sheet is empty');
      console.warn('First line of CSV:', csvText.split('\n')[0]);
    }
    console.log(verbs, "bef")
    return verbs;
  } catch (error) {
    console.error('Error fetching verbs data:', error);
    throw error;
  }
}

