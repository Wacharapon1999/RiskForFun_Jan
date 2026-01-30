
import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';

interface QuizModalProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ question, onAnswer }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSelect(-1); // Timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isDone]);

  const handleSelect = (idx: number) => {
    if (isDone) return;
    setSelectedIdx(idx);
    setIsDone(true);
    const isCorrect = idx === question.correct;
    setTimeout(() => onAnswer(isCorrect), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg p-6 border-2 border-amber-500/50 bg-slate-900 rounded-3xl shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎁</div>
          <h2 className="text-2xl font-bold text-amber-400">โบนัสมาแล้ว!</h2>
          <p className="text-white/80">ตอบให้ถูกนะ รับคะแนนเพิ่ม</p>
        </div>

        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 mb-6">
          {!isDone ? (
            <p className="text-white text-lg font-semibold text-center">{question.question}</p>
          ) : (
            <div className="text-center">
              {selectedIdx === question.correct ? (
                <p className="text-emerald-400 text-xl font-bold">✅ ถูกต้อง! +10 คะแนน</p>
              ) : (
                <p className="text-amber-400 text-xl font-bold">💡 ไม่เป็นไร +5 คะแนน</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            let bgColor = 'bg-slate-700 hover:bg-blue-600';
            let borderColor = 'border-slate-600';

            if (isDone) {
              if (idx === question.correct) {
                bgColor = 'bg-emerald-600';
                borderColor = 'border-emerald-400';
              } else if (idx === selectedIdx) {
                bgColor = 'bg-red-600';
                borderColor = 'border-red-400';
              } else {
                bgColor = 'bg-slate-800 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={isDone}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${bgColor} ${borderColor} text-white font-medium`}
              >
                <span className="text-amber-400 font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-center">
          <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-amber-400 font-bold">⏱️ เหลือเวลา: </span>
            <span className="text-white font-bold text-xl">{timeLeft}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
