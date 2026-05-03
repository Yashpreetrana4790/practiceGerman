export type Gender = 'Masculine' | 'Feminine' | 'Neutral';

export interface NounData {
  srNo: number;
  noun: string;
  germanWord: string;
  article: string;
  gender: Gender;
  plural: string;
  example: string;
}

export type Person = 'ich' | 'du' | 'er/sie/es' | 'wir' | 'ihr' | 'sie/Sie';

export interface VerbData {
  infinitive: string;
  meaning: string;
  ich: string;
  du: string;
  'er/sie/es': string;
  wir: string;
  ihr: string;
  'sie/Sie': string;
  past: string;
  pastParticiple: string;
  auxiliary: string;
  prepositions: string;
  exampleSentence: string;
  notes: string;
}

export interface PracticeState {
  currentIndex: number;
  usedIndices: Set<number>;
  score: number;
  totalAnswered: number;
}

export const ARTICLE_COLORS: Record<string, { color: string; gradient: string; light: string; border: string }> = {
  der: { color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', light: 'rgba(59,130,246,0.12)', border: '#93c5fd' },
  die: { color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #be185d)', light: 'rgba(236,72,153,0.12)', border: '#f9a8d4' },
  das: { color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #15803d)', light: 'rgba(34,197,94,0.12)', border: '#86efac' },
};

export const GENDER_ARTICLE: Record<Gender, string> = {
  Masculine: 'der',
  Feminine: 'die',
  Neutral: 'das',
};
