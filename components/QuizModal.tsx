
import React, { useState, useEffect, useMemo } from 'react';
import { QuizQuestion } from '../types';

interface QuizModalProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ question, onAnswer }) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [canInteract, setCanInteract] = useState(false); // ป้องกันนิ้วลั่นบนมือถือ

  // สุ่มลำดับตัวเลือกเมื่อข้อสอบเปลี่ยน
  const shuffledOptions = useMemo(() => {
    const optionsWithMeta = question.options.map((opt, idx) => ({
      text: opt,
      isCorrect: idx === question.correct
    }));
    
    // Fisher-Yates shuffle for options
    const newArr = [...optionsWithMeta];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }, [question]);

  useEffect(() => {
    // หน่วงเวลา 800ms ก่อนให้เริ่มกดได้ เพื่อป้องกันปัญหา Touch Ghosting จากตอนสไลซ์กล่อง
    const interactionTimer = setTimeout(() => {
      setCanInteract(true);
    }, 800);

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

    return () => {
      clearTimeout(interactionTimer);
      clearInterval(timer);
    };
  }, [isDone]);

  const handleSelect = (idx: number) => {
    if (isDone || !canInteract) return;
    setSelectedIdx(idx);
    setIsDone(true);
    
    // เช็คจากสถานะ isCorrect ที่ผูกไว้กับตัวเลือกนั้นๆ
    const isCorrect = idx !== -1 && shuffledOptions[idx].isCorrect;
    setTimeout(() => onAnswer(isCorrect), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-animate {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      
      <div className="w-full max-w-lg p-6 border-2 border-amber-500/50 bg-slate-900 rounded-3xl shadow-2xl modal-animate">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 animate-bounce">🎁</div>
          <h2 className="text-2xl font-bold text-amber-400">โบนัสมาแล้ว!</h2>
          <p className="text-white/80">ตอบให้ถูกนะ รับคะแนนเพิ่ม</p>
        </div>

        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 mb-6">
          {!isDone ? (
            <p className="text-white text-lg font-semibold text-center leading-relaxed">
              {question.question}
            </p>
          ) : (
            <div className="text-center">
              {selectedIdx !== -1 && shuffledOptions[selectedIdx || 0].isCorrect ? (
                <p className="text-emerald-400 text-xl font-bold animate-pulse">✅ ถูกต้อง! +10 คะแนน</p>
              ) : (
                <p className="text-amber-400 text-xl font-bold">💡 ไม่เป็นไร +5 คะแนน</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {shuffledOptions.map((opt, idx) => {
            let bgColor = 'bg-slate-700';
            let borderColor = 'border-slate-600';
            let hoverStyles = 'hover:bg-blue-600 active:scale-95';

            if (!canInteract && !isDone) {
              bgColor = 'bg-slate-800 opacity-60 cursor-not-allowed';
              hoverStyles = '';
            } else if (isDone) {
              hoverStyles = '';
              if (opt.isCorrect) {
                bgColor = 'bg-emerald-600';
                borderColor = 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
              } else if (idx === selectedIdx) {
                bgColor = 'bg-red-600';
                borderColor = 'border-red-400';
              } else {
                bgColor = 'bg-slate-800 opacity-40';
              }
            }

            return (
              <button
                key={idx}
                disabled={isDone || !canInteract}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${bgColor} ${borderColor} ${hoverStyles} text-white font-medium flex items-start gap-3`}
              >
                <span className="text-amber-400 font-bold shrink-0">{String.fromCharCode(65 + idx)}.</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-center">
          <div className={`px-4 py-2 rounded-full border transition-colors ${canInteract ? 'bg-slate-800 border-slate-700' : 'bg-amber-500/20 border-amber-500/50'}`}>
            <span className="text-amber-400 font-bold">
              {canInteract ? '⏱️ เหลือเวลา: ' : '⏳ เตรียมตัว: '}
            </span>
            <span className="text-white font-bold text-xl ml-1">{timeLeft}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
