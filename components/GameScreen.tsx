
import React, { useState, useEffect, useRef } from 'react';
import { FruitState, QuizQuestion } from '../types';
import { NORMAL_FRUITS, BONUS_FRUIT, BOMB, QUIZ_QUESTIONS } from '../constants';
import QuizModal from './QuizModal';

interface ScoreEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface GameScreenProps {
  onEnd: (stats: { score: number; slices: number; correct: number; totalBonus: number; hitBomb: boolean }) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onEnd }) => {
  const [score, setScore] = useState(0);
  const [slices, setSlices] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [fruits, setFruits] = useState<FruitState[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [stats, setStats] = useState({ correct: 0, totalBonus: 0 });
  const [scoreEffects, setScoreEffects] = useState<ScoreEffect[]>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const spawnTimerRef = useRef<ReturnType<typeof setInterval>>();
  const gameTimerRef = useRef<ReturnType<typeof setInterval>>();
  const nextId = useRef(0);
  const effectId = useRef(0);
  const isPaused = useRef(false);

  // Stats for the end game (refs to avoid closure issues in loop)
  const scoreRef = useRef(0);
  const slicesRef = useRef(0);
  const correctRef = useRef(0);
  const totalBonusRef = useRef(0);

  const spawnFruit = () => {
    if (!gameAreaRef.current || isPaused.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();

    const random = Math.random();
    let type: FruitState['type'] = 'normal';
    let icon = NORMAL_FRUITS[Math.floor(Math.random() * NORMAL_FRUITS.length)];

    if (random < 0.1 && totalBonusRef.current < 10) {
      type = 'bonus';
      icon = BONUS_FRUIT;
    } else if (random < 0.15 && timeLeft < 50) {
      type = 'bomb';
      icon = BOMB;
    }

    const newFruit: FruitState = {
      id: nextId.current++,
      icon,
      type,
      x: Math.random() * (rect.width - 100) + 50,
      y: rect.height + 80,
      velocityY: type === 'bonus' ? -(8 + Math.random() * 2) : -(12 + Math.random() * 4),
      velocityX: (Math.random() - 0.5) * 3,
      gravity: type === 'bonus' ? 0.15 : 0.25,
      isSliced: false
    };

    setFruits(prev => [...prev, newFruit]);
  };

  const addScoreEffect = (x: number, y: number, text: string, color: string) => {
    const id = effectId.current++;
    setScoreEffects(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setScoreEffects(prev => prev.filter(e => e.id !== id));
    }, 800);
  };

  const sliceFruit = (id: number) => {
    if (isPaused.current) return;
    setFruits(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx === -1 || prev[idx].isSliced) return prev;

      const fruit = prev[idx];
      const newFruits = [...prev];
      newFruits[idx] = { ...fruit, isSliced: true };

      if (fruit.type === 'bomb') {
        addScoreEffect(fruit.x, fruit.y, "BOOM!", "text-red-500");
        setTimeout(() => onEnd({ 
          score: scoreRef.current, 
          slices: slicesRef.current, 
          correct: correctRef.current, 
          totalBonus: totalBonusRef.current, 
          hitBomb: true 
        }), 400);
      } else if (fruit.type === 'bonus') {
        addScoreEffect(fruit.x, fruit.y, "SURPRISE!", "text-amber-400");
        totalBonusRef.current++;
        setStats(s => ({ ...s, totalBonus: totalBonusRef.current }));
        isPaused.current = true;
        setCurrentQuiz(QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)]);
      } else {
        addScoreEffect(fruit.x, fruit.y, "+1", "text-emerald-400");
        scoreRef.current += 1;
        slicesRef.current += 1;
        setScore(scoreRef.current);
        setSlices(slicesRef.current);
      }

      return newFruits;
    });
  };

  const update = () => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();

    if (!isPaused.current) {
      setFruits(prev => prev.map(f => ({
        ...f,
        y: f.y + f.velocityY,
        x: f.x + f.velocityX,
        velocityY: f.velocityY + f.gravity
      })).filter(f => f.y < rect.height + 150));
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    spawnTimerRef.current = setInterval(spawnFruit, 800);
    gameTimerRef.current = setInterval(() => {
      if (!isPaused.current) {
        setTimeLeft(t => {
          if (t <= 1) {
            onEnd({ 
              score: scoreRef.current, 
              slices: slicesRef.current, 
              correct: correctRef.current, 
              totalBonus: totalBonusRef.current, 
              hitBomb: false 
            });
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, []);

  const handleQuizAnswer = (isCorrect: boolean) => {
    const points = isCorrect ? 10 : 5;
    if (isCorrect) {
      correctRef.current++;
      setStats(s => ({ ...s, correct: correctRef.current }));
    }
    
    // แสดงเอฟเฟกต์คะแนนจากการตอบคำถามตรงกลางจอ
    if (gameAreaRef.current) {
      addScoreEffect(
        gameAreaRef.current.clientWidth / 2, 
        gameAreaRef.current.clientHeight / 2, 
        `+${points}`, 
        isCorrect ? "text-emerald-400" : "text-amber-400"
      );
    }

    scoreRef.current += points;
    setScore(scoreRef.current);
    setCurrentQuiz(null);
    isPaused.current = false;
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900">
      <style>{`
        @keyframes floatUpFade {
          0% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -100px); opacity: 0; }
        }
        .score-effect {
          animation: floatUpFade 0.8s ease-out forwards;
          pointer-events: none;
        }
      `}</style>

      {/* HUD */}
      <div className="bg-slate-800 border-b-2 border-amber-500/50 p-3 flex justify-between items-center z-20">
        <div className="flex gap-4">
          <div className="bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/40">
            <span className="text-amber-400 font-bold">⭐ คะแนน:</span>
            <span className="text-white font-extrabold text-2xl ml-2">{score}</span>
          </div>
          <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/40 hidden md:block">
            <span className="text-emerald-400 font-bold">🎯 คลิก:</span>
            <span className="text-white font-extrabold text-2xl ml-2">{slices}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white font-bold">⏱️</span>
          <div className="w-32 md:w-48 h-4 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-red-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
          <span className="text-white font-bold text-xl min-w-[2ch]">{timeLeft}</span>
        </div>
      </div>

      {/* Game Area */}
      <div ref={gameAreaRef} className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_#1e3a5f_0%,_#0a1628_100%)]">
        {fruits.map(fruit => (
          <div
            key={fruit.id}
            onMouseDown={() => sliceFruit(fruit.id)}
            onTouchStart={(e) => { e.preventDefault(); sliceFruit(fruit.id); }}
            className={`absolute select-none cursor-crosshair transition-transform duration-200 ${
              fruit.isSliced ? 'scale-150 opacity-0 rotate-45 pointer-events-none' : 'hover:scale-110'
            } ${fruit.type === 'bonus' ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse' : ''}`}
            style={{
              left: fruit.x,
              bottom: fruit.y < 0 ? -100 : (gameAreaRef.current?.clientHeight || 0) - fruit.y,
              fontSize: fruit.type === 'bonus' ? '5rem' : '4rem',
              transform: `translate(-50%, 50%)`
            }}
          >
            {fruit.icon}
          </div>
        ))}

        {/* Score Effects Layer */}
        {scoreEffects.map(effect => (
          <div
            key={effect.id}
            className={`absolute z-30 font-black text-4xl score-effect pointer-events-none drop-shadow-lg ${effect.color}`}
            style={{
              left: effect.x,
              bottom: (gameAreaRef.current?.clientHeight || 0) - effect.y,
            }}
          >
            {effect.text}
          </div>
        ))}

        {!isPaused.current && fruits.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="text-center">
              <div className="text-6xl mb-4">👆</div>
              <p className="text-white text-3xl font-bold">คลิกที่ผลไม้!</p>
            </div>
          </div>
        )}
      </div>

      {currentQuiz && (
        <QuizModal 
          question={currentQuiz} 
          onAnswer={handleQuizAnswer} 
        />
      )}
    </div>
  );
};

export default GameScreen;
