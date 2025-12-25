import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { NounData, Gender } from '../types';
import { fetchNounsData } from '../utils/sheetsData';
import './GenderPractice.css';

export default function GenderPractice() {
  const [nouns, setNouns] = useState<NounData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNoun, setCurrentNoun] = useState<NounData | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | null; message: string }>({
    type: null,
    message: '',
  });
  const [isAnswered, setIsAnswered] = useState(false);

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

  const selectRandomNoun = useCallback(() => {
    if (nouns.length === 0) return;

    setUsedIndices(prevUsed => {
      const availableIndices = nouns
        .map((_, index) => index)
        .filter(index => !prevUsed.has(index));

      if (availableIndices.length === 0) {
        // All nouns have been used, reset
        const randomIndex = Math.floor(Math.random() * nouns.length);
        setCurrentNoun(nouns[randomIndex]);
        return new Set([randomIndex]);
      } else {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setCurrentNoun(nouns[randomIndex]);
        return new Set([...prevUsed, randomIndex]);
      }
    });
  }, [nouns]);

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

  const handleAnswer = (selectedGender: Gender) => {
    if (!currentNoun || isAnswered) return;

    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);

    if (selectedGender === currentNoun.gender) {
      setScore(prev => prev + 1);
      setFeedback({
        type: 'correct',
        message: `Correct! ${currentNoun.article} ${currentNoun.germanWord} is ${currentNoun.gender}.`,
      });
    } else {
      setFeedback({
        type: 'incorrect',
        message: `Incorrect. ${currentNoun.article} ${currentNoun.germanWord} is ${currentNoun.gender}, not ${selectedGender}.`,
      });
    }
  };

  const handleNext = () => {
    setFeedback({ type: null, message: '' });
    setIsAnswered(false);
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

  if (!currentNoun) {
    return (
      <div className="practice-container">
        <div className="loading">Preparing practice...</div>
      </div>
    );
  }

  const genderOptions: Gender[] = ['Masculine', 'Feminine', 'Neutral'];

  return (
    <div className="practice-container">
      <Link to="/" className="back-button">
        ← Back to Home
      </Link>

      <div className="practice-header">
        <h1>German Noun Gender Practice</h1>
        <div className="stats">
          <span>Score: {score}/{totalAnswered}</span>
          <span>Remaining: {nouns.length - usedIndices.size}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="noun-display">
            <h2>{currentNoun.noun}</h2>
            <p className="german-word">{currentNoun.germanWord}</p>
          </div>

          <div className="question">
            <p>What is the gender of this noun?</p>
          </div>

          <div className="options">
            {genderOptions.map((gender) => (
              <button
                key={gender}
                className={`option-button ${isAnswered
                  ? gender === currentNoun.gender
                    ? 'correct'
                    : 'incorrect'
                  : ''
                  }`}
                onClick={() => handleAnswer(gender)}
                disabled={isAnswered}
              >
                {gender}
              </button>
            ))}
          </div>

          {feedback.type && (
            <div className={`feedback feedback-${feedback.type}`}>
              <p>{feedback.message}</p>
            </div>
          )}

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

