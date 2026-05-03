import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { NounData } from '../types';
import { ARTICLE_COLORS } from '../types';
import { fetchNounsData } from '../utils/sheetsData';
import './NounTranslationPractice.css';

export default function NounTranslationPractice() {
  const [nouns, setNouns] = useState<NounData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNoun, setCurrentNoun] = useState<NounData | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      setNouns(await fetchNounsData());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally { setLoading(false); }
  };

  const generateOptions = useCallback((correct: string, all: NounData[]): string[] => {
    const set = new Set<string>([correct]);
    let attempts = 0;
    while (set.size < 4 && attempts < 200) {
      const w = all[Math.floor(Math.random() * all.length)].germanWord;
      if (w && w !== correct) set.add(w);
      attempts++;
    }
    const arr = Array.from(set);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const selectRandomNoun = useCallback(() => {
    if (nouns.length === 0) return;
    setUsedIndices(prevUsed => {
      const available = nouns.map((_, i) => i).filter(i => !prevUsed.has(i));
      if (available.length === 0) { setIsCompleted(true); setCurrentNoun(null); setOptions([]); return prevUsed; }
      const idx = available[Math.floor(Math.random() * available.length)];
      setCurrentNoun(nouns[idx]);
      setOptions(generateOptions(nouns[idx].germanWord, nouns));
      const next = new Set(prevUsed); next.add(idx); return next;
    });
  }, [nouns, generateOptions]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (nouns.length > 0 && currentNoun === null && !isCompleted) selectRandomNoun();
  }, [nouns, currentNoun, isCompleted, selectRandomNoun]);

  const handleAnswer = useCallback((word: string) => {
    if (!currentNoun || isAnswered) return;
    setSelectedAnswer(word);
    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);
    if (word === currentNoun.germanWord) setScore(prev => prev + 1);
  }, [currentNoun, isAnswered]);

  const handleNext = useCallback(() => {
    setIsAnswered(false); setSelectedAnswer(null); selectRandomNoun();
  }, [selectRandomNoun]);

  const handleRestart = () => {
    setUsedIndices(new Set()); setCurrentNoun(null); setOptions([]);
    setScore(0); setTotalAnswered(0); setIsCompleted(false); setIsAnswered(false); setSelectedAnswer(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isAnswered) { if (e.key === 'Enter') handleNext(); return; }
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < options.length) handleAnswer(options[idx]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAnswered, handleAnswer, handleNext, options]);

  if (loading) return <div className="practice-container"><div className="loading">Loading nouns…</div></div>;
  if (error) return <div className="practice-container"><div className="error"><p>{error}</p><button onClick={loadData}>Retry</button></div></div>;
  if (nouns.length === 0) return <div className="practice-container"><div className="error">No nouns data available.</div></div>;

  if (isCompleted) {
    const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    return (
      <div className="practice-container">
        <Link to="/" className="back-button">← Back to Home</Link>
        <div className="completion-screen"><div className="completion-card">
          <div className="completion-icon">🎉</div>
          <h1>All {nouns.length} nouns done!</h1>
          <p className="completion-message">Great work!</p>
          <div className="completion-stats">
            <div className="stat-item"><div className="stat-value">{score}</div><div className="stat-label">Correct</div></div>
            <div className="stat-item"><div className="stat-value">{totalAnswered}</div><div className="stat-label">Total</div></div>
            <div className="stat-item"><div className="stat-value">{pct}%</div><div className="stat-label">Accuracy</div></div>
          </div>
          <div className="completion-actions">
            <button className="restart-button" onClick={handleRestart}>Practice Again</button>
            <Link to="/" className="home-button">Back to Home</Link>
          </div>
        </div></div>
      </div>
    );
  }

  if (!currentNoun || options.length === 0) return <div className="practice-container"><div className="loading">Preparing…</div></div>;

  const article = currentNoun.article.toLowerCase();
  const colors = ARTICLE_COLORS[article] ?? ARTICLE_COLORS['das'];
  const isCorrect = selectedAnswer === currentNoun.germanWord;
  const progress = Math.round((usedIndices.size / nouns.length) * 100);

  return (
    <div className="practice-container">
      <div className="top-bar">
        <Link to="/" className="back-button">← Back</Link>
        <div className="session-score">{score} / {totalAnswered}</div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        <span className="progress-label">{usedIndices.size} / {nouns.length}</span>
      </div>

      <div className="card">
        <div className="word-display">
          <p className="display-prompt">How do you say this in German?</p>
          <h2 className="english-word">{currentNoun.noun}</h2>
        </div>

        <div className="translation-options">
          {options.map((word, i) => {
            let cls = 'trans-btn';
            if (isAnswered) {
              if (word === currentNoun.germanWord) cls += ' btn-correct';
              else if (word === selectedAnswer) cls += ' btn-wrong';
              else cls += ' btn-dimmed';
            }
            return (
              <button key={word} className={cls} onClick={() => handleAnswer(word)} disabled={isAnswered}>
                <kbd>{i + 1}</kbd>
                <span>{word}</span>
                {isAnswered && word === currentNoun.germanWord && <span className="btn-check">✓</span>}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`answer-reveal ${isCorrect ? 'reveal-correct' : 'reveal-wrong'}`}>
            <p className="reveal-verdict">{isCorrect ? '✅ Correct!' : '❌ The answer was:'}</p>
            <div className="reveal-word">
              <span style={{ color: colors.color, fontWeight: 800 }}>{currentNoun.article}</span>
              {' '}{currentNoun.germanWord}
            </div>
            <p className="reveal-gender-line">
              <span className="reveal-badge" style={{ background: colors.light, color: colors.color, borderColor: colors.border }}>
                {currentNoun.gender}
              </span>
            </p>
            {currentNoun.plural && (
              <p className="reveal-info">
                <span className="reveal-info-label">Plural</span>
                <span>die <strong>{currentNoun.plural}</strong></span>
              </p>
            )}
            {currentNoun.example && (
              <p className="reveal-example">"{currentNoun.example}"</p>
            )}
          </div>
        )}

        {isAnswered && (
          <button className="next-button" onClick={handleNext}>
            Next Question <span className="key-hint">Enter ↵</span>
          </button>
        )}
      </div>

      <div className="keyboard-hints">
        <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> Choose option &nbsp;·&nbsp; <kbd>Enter</kbd> Next
      </div>
    </div>
  );
}
