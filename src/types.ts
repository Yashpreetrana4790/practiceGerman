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
  srNo: number;
  verb: string;
  germanWord: string;
  person: Person;
  conjugation: string;
  example: string;
}

export interface PracticeState {
  currentIndex: number;
  usedIndices: Set<number>;
  score: number;
  totalAnswered: number;
}

