import React, { useState, useCallback, useMemo } from 'react';

interface PracticeModeProps {
  entries: Array<{ text: string; signWriting: string[] }>;
  onClose: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ entries, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const questions = useMemo(() => {
    return shuffleArray(entries).slice(0, 10);
  }, [entries]);

  const currentQuestion = questions[currentIndex];

  const options = useMemo(() => {
    if (!currentQuestion) return [];
    const wrong = entries
      .filter(e => e.text !== currentQuestion.text)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(e => e.text);
    return shuffleArray([currentQuestion.text, ...wrong]);
  }, [currentQuestion, entries]);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    setScore(prev => ({
      correct: prev.correct + (answer === currentQuestion.text ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [selectedAnswer, currentQuestion]);

  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setCurrentIndex(prev => prev + 1);
  }, []);

  if (entries.length < 4) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card max-w-md w-full mx-4 p-8 text-center">
          <h2 className="text-heading text-theme-primary mb-4">Not Enough Data</h2>
          <p className="text-body text-theme-secondary mb-6">Translate at least 4 phrases to unlock Practice Mode.</p>
          <button onClick={onClose} className="px-6 py-2 rounded-xl gradient-teal text-white font-semibold btn-press">Got it</button>
        </div>
      </div>
    );
  }

  if (currentIndex >= questions.length) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card max-w-md w-full mx-4 p-8 text-center">
          <h2 className="text-heading text-theme-primary mb-2">Practice Complete!</h2>
          <p className="text-4xl font-bold gradient-text-teal mb-2">{percentage}%</p>
          <p className="text-body text-theme-secondary mb-6">{score.correct} of {score.total} correct</p>
          <button onClick={onClose} className="px-6 py-2 rounded-xl gradient-teal text-white font-semibold btn-press">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-lg w-full mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-theme-muted">{currentIndex + 1} / {questions.length}</span>
          <span className="text-sm font-medium text-teal-600">Score: {score.correct}/{score.total}</span>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-center mb-6">
          <p className="text-sm text-theme-muted mb-3">What does this sign mean?</p>
          <div className="text-2xl font-mono text-theme-primary bg-theme-secondary rounded-xl p-4">
            {currentQuestion.signWriting.join(' ')}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 mb-6">
          {options.map((option) => {
            let optionClass = 'card hover:bg-theme-tertiary cursor-pointer text-center py-3';
            if (selectedAnswer) {
              if (option === currentQuestion.text) {
                optionClass = 'card bg-green-50 border-green-500 text-center py-3';
              } else if (option === selectedAnswer) {
                optionClass = 'card bg-red-50 border-red-500 text-center py-3';
              }
            }
            return (
              <button key={option} onClick={() => handleAnswer(option)} className={optionClass} disabled={!!selectedAnswer}>
                <span className="text-sm font-medium">{option}</span>
              </button>
            );
          })}
        </div>
        {selectedAnswer && (
          <button onClick={handleNext} className="w-full py-3 rounded-xl gradient-teal text-white font-semibold btn-press">
            {currentIndex < questions.length - 1 ? 'Next' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticeMode;
