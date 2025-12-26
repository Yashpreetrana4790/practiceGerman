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

