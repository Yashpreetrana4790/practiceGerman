import type { NounData, Gender, VerbData, Person } from '../types';

const SHEET_ID = '1j1YiF4Vj33guXhIJm1DkJDUJQX_HNKPDUSmNrpooADw';
const NOUNS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
// Assuming verbs are in a different sheet/tab - you may need to adjust the gid
const VERBS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

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

// Map person strings from sheet to our Person type
function normalizePerson(person: string): Person {
  const normalized = person.trim().toLowerCase();
  if (normalized.includes('ich')) return 'ich';
  if (normalized.includes('du')) return 'du';
  if (normalized.includes('er') || normalized.includes('sie') || normalized.includes('es')) {
    if (normalized.includes('er')) return 'er/sie/es';
    if (normalized.includes('sie') && !normalized.includes('sie/sie')) return 'er/sie/es';
  }
  if (normalized.includes('wir')) return 'wir';
  if (normalized.includes('ihr')) return 'ihr';
  if (normalized.includes('sie/sie') || normalized === 'sie') return 'sie/Sie';
  return 'ich'; // Default fallback
}

// Parse verbs CSV data
function parseVerbsCSV(csvText: string): VerbData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

  // Find column indices (case-insensitive) - adjust based on your actual sheet structure
  const srNoIndex = headers.findIndex(h => h.includes('sr no') || h.includes('srno') || h === 'sr no.');
  const verbIndex = headers.findIndex(h => h === 'verb');
  const germanWordIndex = headers.findIndex(h => (h.includes('german') && h.includes('word')) || h === 'german word');
  const personIndex = headers.findIndex(h => h === 'person');
  const conjugationIndex = headers.findIndex(h => h === 'conjugation');
  const exampleIndex = headers.findIndex(h => h === 'example');

  const verbs: VerbData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());

    if (values.length < Math.max(srNoIndex, verbIndex, germanWordIndex, personIndex, conjugationIndex) + 1) continue;

    const srNoStr = values[srNoIndex] || '';
    const srNo = parseInt(srNoStr, 10);
    if (isNaN(srNo) || srNo === 0) continue;

    const verb = values[verbIndex] || '';
    const germanWord = values[germanWordIndex] || '';
    const person = normalizePerson(values[personIndex] || '');
    const conjugation = values[conjugationIndex] || '';
    const example = values[exampleIndex] || '';

    if (verb && germanWord && person && conjugation) {
      verbs.push({
        srNo,
        verb,
        germanWord,
        person,
        conjugation,
        example,
      });
    }
  }

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
    return parseVerbsCSV(csvText);
  } catch (error) {
    console.error('Error fetching verbs data:', error);
    throw error;
  }
}

