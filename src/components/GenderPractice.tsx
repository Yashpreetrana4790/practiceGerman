import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { NounData, Gender } from '../types';
import { ARTICLE_COLORS, GENDER_ARTICLE } from '../types';
import { fetchNounsData } from '../utils/sheetsData';
import './GenderPractice.css';

const GENDER_OPTIONS: { gender: Gender; key: string }[] = [
  { gender: 'Masculine', key: '1' },
  { gender: 'Feminine',  key: '2' },
  { gender: 'Neutral',   key: '3' },
];

export default function GenderPractice() {
  const [nouns, setNouns] = useState<NounData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNoun, setCurrentNoun] = useState<NounData | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNouns(await fetchNounsData());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const selectRandomNoun = useCallback(() => {
    if (nouns.length === 0) return;
    setUsedIndices(prevUsed => {
      const available = nouns.map((_, i) => i).filter(i => !prevUsed.has(i));
      if (available.length === 0) { setIsCompleted(true); setCurrentNoun(null); return prevUsed; }
      const idx = available[Math.floor(Math.random() * available.length)];
      setCurrentNoun(nouns[idx]);
      const next = new Set(prevUsed); next.add(idx); return next;
    });
  }, [nouns]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (nouns.length > 0 && currentNoun === null && !isCompleted) selectRandomNoun();
  }, [nouns, currentNoun, isCompleted, selectRandomNoun]);

  const handleAnswer = useCallback((gender: Gender) => {
    if (!currentNoun || isAnswered) return;
    setSelectedAnswer(gender);
    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);
    if (gender === currentNoun.gender) setScore(prev => prev + 1);
  }, [currentNoun, isAnswered]);

  const handleNext = useCallback(() => {
    setIsAnswered(false);
    setSelectedAnswer(null);
    selectRandomNoun();
  }, [selectRandomNoun]);

  const handleRestart = () => {
    setUsedIndices(new Set()); setCurrentNoun(null); setScore(0);
    setTotalAnswered(0); setIsCompleted(false); setIsAnswered(false); setSelectedAnswer(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isAnswered) { if (e.key === 'Enter') handleNext(); return; }
      const opt = GENDER_OPTIONS.find(o => o.key === e.key);
      if (opt) handleAnswer(opt.gender);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAnswered, handleAnswer, handleNext]);

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

  if (!currentNoun) return <div className="practice-container"><div className="loading">Preparing…</div></div>;

  const article = currentNoun.article.toLowerCase();
  const colors = ARTICLE_COLORS[article] ?? ARTICLE_COLORS['das'];
  const isCorrect = selectedAnswer === currentNoun.gender;
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
        {/* Noun display */}
        <div className="noun-display" style={isAnswered ? { background: colors.gradient } : {}}>
          <div className="article-slot">
            {isAnswered
              ? <span className="article-text">{currentNoun.article}</span>
              : <span className="article-blank">___</span>
            }
          </div>
          <h2 className="noun-german">{currentNoun.germanWord}</h2>
          <p className="noun-english">{currentNoun.noun}</p>
        </div>

        <p className="question-label">What is the gender?</p>

        {/* Options */}
        <div className="gender-options">
          {GENDER_OPTIONS.map(({ gender, key }) => {
            const g = GENDER_ARTICLE[gender];
            const gc = ARTICLE_COLORS[g];
            let cls = 'gender-btn';
            if (isAnswered) {
              if (gender === currentNoun.gender) cls += ' btn-correct';
              else if (gender === selectedAnswer) cls += ' btn-wrong';
              else cls += ' btn-dimmed';
            }
            return (
              <button
                key={gender}
                className={cls}
                style={!isAnswered ? { '--gc': gc.color, '--gc-light': gc.light, '--gc-border': gc.border } as React.CSSProperties : {}}
                onClick={() => handleAnswer(gender)}
                disabled={isAnswered}
              >
                <kbd>{key}</kbd>
                <span className="btn-article" style={{ color: gc.color }}>{g}</span>
                <span className="btn-gender">{gender}</span>
                {isAnswered && gender === currentNoun.gender && <span className="btn-check">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Answer reveal */}
        {isAnswered && (
          <div className={`answer-reveal ${isCorrect ? 'reveal-correct' : 'reveal-wrong'}`}>
            <p className="reveal-verdict">{isCorrect ? '✅ Correct!' : `❌ It's ${currentNoun.gender}`}</p>
            <div className="reveal-word">
              <span style={{ color: colors.color, fontWeight: 800 }}>{currentNoun.article}</span>
              {' '}{currentNoun.germanWord}
            </div>
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
        <kbd>1</kbd> der (Masc.) &nbsp;·&nbsp; <kbd>2</kbd> die (Fem.) &nbsp;·&nbsp; <kbd>3</kbd> das (Neut.) &nbsp;·&nbsp; <kbd>Enter</kbd> Next
      </div>
    </div>
  );
}
