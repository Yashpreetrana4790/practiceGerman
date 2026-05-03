import type { NounData, Gender, VerbData } from '../types';

const SHEET_ID = '1j1YiF4Vj33guXhIJm1DkJDUJQX_HNKPDUSmNrpooADw';
const NOUNS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const VERBS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1459632609`;

function normalizeGender(gender: string): Gender {
  const normalized = gender.trim();
  if (normalized.toLowerCase().includes('masculine')) return 'Masculine';
  if (normalized.toLowerCase().includes('feminine')) return 'Feminine';
  if (normalized.toLowerCase().includes('neutral')) return 'Neutral';
  return 'Neutral';
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      if (inQuotes && line[j + 1] === '"') {
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

function parseCSV(csvText: string): NounData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

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

    const srNo = parseInt(values[srNoIndex] || '', 10);
    if (isNaN(srNo) || srNo === 0) continue;

    const noun = values[nounIndex] || '';
    const germanWord = values[germanWordIndex] || '';
    const article = values[articleIndex] || '';
    const gender = normalizeGender(values[genderIndex] || '');
    const plural = values[pluralIndex] || '';
    const example = values[exampleIndex] || '';

    if (noun && germanWord && article && gender) {
      nouns.push({ srNo, noun, germanWord, article, gender, plural, example });
    }
  }

  return nouns;
}

function parseVerbsCSV(csvText: string): VerbData[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const headersLower = headers.map(h => h.toLowerCase());

  const infinitiveIndex = headersLower.findIndex(h => h === 'infinitive');
  const meaningIndex = headersLower.findIndex(h => h === 'meaning');
  const ichIndex = headersLower.findIndex(h => h === 'ich');
  const duIndex = headersLower.findIndex(h => h === 'du');
  const erSieEsIndex = headersLower.findIndex(h =>
    h === 'er/sie/es' || h === 'er sie es' || h.includes('er/sie') || h.includes('er sie')
  );
  const wirIndex = headersLower.findIndex(h => h === 'wir');
  const ihrIndex = headersLower.findIndex(h => h === 'ihr');
  const sieSieIndex = headersLower.findIndex(h =>
    h === 'sie/sie' || h === 'sie sie' || (h.includes('sie') && headersLower.indexOf(h) !== erSieEsIndex)
  );
  const pastIndex = headersLower.findIndex(h =>
    (h.includes('past') && h.includes('präteritum')) || h.includes('präteritum') || (h.includes('past') && !h.includes('participle'))
  );
  const pastParticipleIndex = headersLower.findIndex(h =>
    h.includes('past participle') || (h.includes('participle') && !h.includes('präteritum'))
  );
  const auxiliaryIndex = headersLower.findIndex(h => h === 'auxiliary');
  const prepositionsIndex = headersLower.findIndex(h => h === 'prepositions' || h === 'preposition');
  const exampleIndex = headersLower.findIndex(h =>
    (h.includes('example') && h.includes('sentence')) || h.includes('example sentence') || h === 'example'
  );
  const notesIndex = headersLower.findIndex(h => h === 'notes' || h === 'note');

  if (infinitiveIndex < 0 || meaningIndex < 0 || ichIndex < 0) return [];

  const verbs: VerbData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());

    if (values.every(v => !v.trim())) continue;

    const infinitive = values[infinitiveIndex]?.trim() || '';
    const meaning = values[meaningIndex]?.trim() || '';
    const ich = values[ichIndex]?.trim() || '';

    if (!infinitive || !meaning || !ich) continue;

    verbs.push({
      infinitive,
      meaning,
      ich,
      du: values[duIndex >= 0 ? duIndex : ichIndex]?.trim() || '',
      'er/sie/es': values[erSieEsIndex >= 0 ? erSieEsIndex : ichIndex]?.trim() || '',
      wir: values[wirIndex >= 0 ? wirIndex : ichIndex]?.trim() || '',
      ihr: values[ihrIndex >= 0 ? ihrIndex : ichIndex]?.trim() || '',
      'sie/Sie': values[sieSieIndex >= 0 ? sieSieIndex : ichIndex]?.trim() || '',
      past: values[pastIndex >= 0 ? pastIndex : -1]?.trim() || '',
      pastParticiple: values[pastParticipleIndex >= 0 ? pastParticipleIndex : -1]?.trim() || '',
      auxiliary: values[auxiliaryIndex >= 0 ? auxiliaryIndex : -1]?.trim() || '',
      prepositions: values[prepositionsIndex >= 0 ? prepositionsIndex : -1]?.trim() || '',
      exampleSentence: values[exampleIndex >= 0 ? exampleIndex : -1]?.trim() || '',
      notes: values[notesIndex >= 0 ? notesIndex : -1]?.trim() || '',
    });
  }

  return verbs;
}

export async function fetchNounsData(): Promise<NounData[]> {
  const response = await fetch(NOUNS_CSV_URL);
  if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
  return parseCSV(await response.text());
}

export async function fetchVerbsData(): Promise<VerbData[]> {
  const response = await fetch(VERBS_CSV_URL);
  if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
  return parseVerbsCSV(await response.text());
}
