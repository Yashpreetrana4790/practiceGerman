import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { NounData } from '../types';
import { fetchNounsData } from '../utils/sheetsData';
import Toast from './Toast';
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
  const [toast, setToast] = useState<{ type: 'correct' | 'incorrect'; message: string } | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNounsData();
      setNouns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateOptions = useCallback((correctAnswer: string, allNouns: NounData[]): string[] => {
    const optionsSet = new Set<string>([correctAnswer]);
    
    // Get random wrong answers
    while (optionsSet.size < 4) {
      const randomIndex = Math.floor(Math.random() * allNouns.length);
      const randomGermanWord = allNouns[randomIndex].germanWord;
      if (randomGermanWord && randomGermanWord !== correctAnswer) {
        optionsSet.add(randomGermanWord);
      }
    }
    
    // Convert to array and shuffle
    const optionsArray = Array.from(optionsSet);
    for (let i = optionsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
    }
    
    return optionsArray;
  }, []);

  const selectRandomNoun = useCallback(() => {
    if (nouns.length === 0) return;

    setUsedIndices(prevUsed => {
      const availableIndices = nouns
        .map((_, index) => index)
        .filter(index => !prevUsed.has(index));

      let selectedIndex: number;
      if (availableIndices.length === 0) {
        // All nouns have been used, show completion screen
        setIsCompleted(true);
        setCurrentNoun(null);
        setOptions([]);
        return prevUsed;
      } else {
        selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setCurrentNoun(nouns[selectedIndex]);
        const opts = generateOptions(nouns[selectedIndex].germanWord, nouns);
        setOptions(opts);
        return new Set([...prevUsed, selectedIndex]);
      }
    });
  }, [nouns, generateOptions]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Select a new random noun when data is loaded
  useEffect(() => {
    if (nouns.length > 0 && currentNoun === null) {
      selectRandomNoun();
    }
  }, [nouns, currentNoun, selectRandomNoun]);

  const handleAnswer = (selectedGermanWord: string) => {
    if (!currentNoun || isAnswered) return;

    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);

    if (selectedGermanWord === currentNoun.germanWord) {
      setScore(prev => prev + 1);
      setToast({
        type: 'correct',
        message: `Correct! "${currentNoun.noun}" is "${currentNoun.germanWord}".`,
      });
    } else {
      setToast({
        type: 'incorrect',
        message: `"${currentNoun.noun}" is "${currentNoun.germanWord}".`,
      });
    }
  };

  const handleNext = () => {
    setToast(null);
    // Check if this was the last question
    if (usedIndices.size + 1 >= nouns.length) {
      setIsCompleted(true);
      setCurrentNoun(null);
      setOptions([]);
      setIsAnswered(false);
    } else {
      setIsAnswered(false);
      selectRandomNoun();
    }
  };

  const handleRestart = () => {
    setUsedIndices(new Set());
    setCurrentNoun(null);
    setOptions([]);
    setScore(0);
    setTotalAnswered(0);
    setIsCompleted(false);
    setIsAnswered(false);
    setToast(null);
    selectRandomNoun();
  };

  if (loading) {
    return (
      <div className="practice-container">
        <div className="loading">Loading nouns data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  if (nouns.length === 0) {
    return (
      <div className="practice-container">
        <div className="error">No nouns data available.</div>
      </div>
    );
  }

  if (isCompleted) {
    const percentage = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    return (
      <div className="practice-container">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        
        <div className="completion-screen">
          <div className="completion-card">
            <div className="completion-icon">🎉</div>
            <h1>Practice Complete!</h1>
            <p className="completion-message">You've finished all the questions!</p>
            
            <div className="completion-stats">
              <div className="stat-item">
                <div className="stat-value">{score}</div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{totalAnswered}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{percentage}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>

            <div className="completion-actions">
              <button className="restart-button" onClick={handleRestart}>
                Practice Again
              </button>
              <Link to="/" className="home-button">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentNoun || options.length === 0) {
    return (
      <div className="practice-container">
        <div className="loading">Preparing practice...</div>
      </div>
    );
  }

  return (
    <div className="practice-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <Link to="/" className="back-button">
        ← Back to Home
      </Link>
      
      <div className="practice-header">
        <h1>Noun Translation Practice</h1>
        <div className="stats">
          <span>Score: {score}/{totalAnswered}</span>
          <span>Remaining: {nouns.length - usedIndices.size}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="word-display">
            <h2>{currentNoun.noun}</h2>
            <p className="question-text">What is this noun called in German?</p>
          </div>

          <div className="options">
            {options.map((germanWord) => (
              <button
                key={germanWord}
                className={`option-button ${
                  isAnswered
                    ? germanWord === currentNoun.germanWord
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }`}
                onClick={() => handleAnswer(germanWord)}
                disabled={isAnswered}
              >
                {germanWord}
              </button>
            ))}
          </div>

          {isAnswered && (
            <button className="next-button" onClick={handleNext}>
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



