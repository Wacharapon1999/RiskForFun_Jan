
import React, { useState, useEffect } from 'react';
import { GameView, GameRecord } from './types';
import { fetchRecords, saveRecord } from './services/sheetsService';
import GameScreen from './components/GameScreen';
import Leaderboard from './components/Leaderboard';

const App: React.FC = () => {
  const [view, setView] = useState<GameView>(GameView.CODE_ENTRY);
  const [playerCode, setPlayerCode] = useState('');
  const [allRecords, setAllRecords] = useState<GameRecord[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [lastGameStats, setLastGameStats] = useState<{
    score: number;
    slices: number;
    correct: number;
    totalBonus: number;
    hitBomb: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchRecords();
      setAllRecords(data);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อ Google Sheets ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = playerCode.trim().toUpperCase();
    if (!code) return;

    const playerRounds = allRecords.filter(r => r.player_code === code);
    if (playerRounds.length >= 2) {
      alert(`รหัส "${code}" เล่นครบ 2 รอบแล้ว! ขอบคุณที่ร่วมสนุกครับ`);
      return;
    }

    setPlayerCode(code);
    setCurrentRound(playerRounds.length + 1);
    setView(GameView.START_SCREEN);
  };

  const handleGameEnd = async (stats: any) => {
    setLastGameStats(stats);
    setIsSaving(true);
    setView(GameView.RESULT);

    const newRecord: GameRecord = {
      player_code: playerCode,
      round: currentRound,
      score: stats.score,
      slices: stats.slices,
      correct_answers: stats.correct,
      total_questions: stats.totalBonus,
      timestamp: new Date().toISOString()
    };

    await saveRecord(newRecord);
    
    setTimeout(async () => {
      try {
        const data = await fetchRecords();
        setAllRecords(data);
      } catch (e) {
        console.warn("Could not refresh leaderboard after save");
      }
      setIsSaving(false);
    }, 2000);
  };

  const getBestScore = () => {
    const playerRounds = allRecords.filter(r => r.player_code === playerCode);
    if (playerRounds.length === 0) return 0;
    return Math.max(...playerRounds.map(r => r.score));
  };

  return (
    <div className="h-screen w-screen overflow-hidden text-white bg-[#0a1628] font-['Prompt']">
      {view === GameView.CODE_ENTRY && (
        <div className="h-full flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="text-8xl mb-6 animate-bounce">🎮</div>
            <h1 className="text-5xl font-black mb-4 tracking-tighter">RISK FOR FUN</h1>
            <p className="text-xl text-amber-400 mb-10 font-bold tracking-widest">กรอกรหัสของคุณเพื่อเริ่มเกม</p>
            
            {fetchError ? (
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl mb-8">
                <p className="text-red-400 font-bold mb-4">❌ เกิดข้อผิดพลาดในการเชื่อมต่อ</p>
                <div className="text-white/70 text-sm mb-6 space-y-2">
                  <p>{fetchError}</p>
                  <p className="text-xs opacity-50 italic">โปรดตรวจสอบว่าตั้งค่า 'Who has access' เป็น 'Anyone' ใน Google Apps Script แล้ว</p>
                </div>
                <button 
                  onClick={loadData}
                  className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-full text-sm font-bold transition-all border border-white/20"
                >
                  ลองใหม่อีกครั้ง 🔄
                </button>
              </div>
            ) : (
              <form onSubmit={handleStartLogin} className="space-y-6">
                <div className="text-left">
                  <label className="block text-white/60 text-sm font-bold mb-2 ml-1 uppercase">รหัสพนักงาน</label>
                  <input 
                    type="text" 
                    value={playerCode}
                    onChange={(e) => setPlayerCode(e.target.value)}
                    className="w-full bg-slate-800/50 border-2 border-white/10 rounded-2xl p-5 text-3xl text-center font-black focus:border-amber-500 outline-none transition-all placeholder:text-white/5"
                    placeholder="รหัสของคุณ"
                    maxLength={10}
                    required
                    disabled={isLoading}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 disabled:opacity-50 transition-all py-5 rounded-2xl text-2xl font-black shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  ) : 'เริ่มเล่นเกม 🚀'}
                </button>
              </form>
            )}

            <button 
              onClick={() => { loadData(); setView(GameView.LEADERBOARD); }}
              className="mt-8 text-white/40 hover:text-amber-400 font-bold flex items-center justify-center gap-2 w-full transition-colors"
            >
              🏆 ดูอันดับคะแนนทั้งหมด
            </button>
          </div>
        </div>
      )}

      {view === GameView.START_SCREEN && (
        <div className="h-full flex flex-col items-center justify-center p-6">
          <div className="text-center w-full max-w-md">
            <div className="text-8xl mb-6 animate-pulse">🍉</div>
            <h1 className="text-3xl font-black mb-2">ยินดีต้อนรับ, <span className="text-amber-400">{playerCode}</span></h1>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-10 inline-block">
              <p className="text-amber-400 font-bold text-lg">สิทธิ์การเล่น: รอบที่ {currentRound} / 2</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 mb-10 space-y-6 text-left">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-3xl">🍎</div>
                <div>
                  <p className="font-bold text-white">ผลไม้ทั่วไป</p>
                  <p className="text-sm text-white/50">ได้รับ 1 คะแนนต่อลูก</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-3xl">🎁</div>
                <div>
                  <p className="font-bold text-amber-400">ของขวัญความเสี่ยง</p>
                  <p className="text-sm text-white/50">ตอบคำถาม รับสูงสุด 10 คะแนน!</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setView(GameView.GAMEPLAY)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 py-6 rounded-2xl text-2xl font-black shadow-2xl transition-all active:scale-95"
            >
              เข้าสู่โหมดสไลซ์! ⚔️
            </button>
          </div>
        </div>
      )}

      {view === GameView.GAMEPLAY && (
        <GameScreen onEnd={handleGameEnd} />
      )}

      {view === GameView.RESULT && lastGameStats && (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="text-center w-full max-w-md py-10">
            <div className="text-9xl mb-6 drop-shadow-2xl">🏁</div>
            <h2 className="text-5xl font-black mb-2 leading-none">เวลาหมด!</h2>
            <p className="text-amber-400 text-lg font-bold mb-10 uppercase tracking-widest">การประเมินความเสี่ยงสิ้นสุดลง</p>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl italic font-black">ROUND {currentRound}</div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5 text-left">
                  <p className="text-white/30 text-xs font-bold uppercase mb-1">Total Slices</p>
                  <p className="text-3xl font-black text-emerald-400">{lastGameStats.slices}</p>
                </div>
                <div className="bg-slate-800/50 p-5 rounded-3xl border border-white/5 text-left">
                  <p className="text-white/30 text-xs font-bold uppercase mb-1">Quiz Score</p>
                  <p className="text-3xl font-black text-amber-400">{lastGameStats.correct} / {lastGameStats.totalBonus}</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10">
                <p className="text-white/40 text-sm font-bold mb-1 uppercase">Final Score</p>
                <p className="text-8xl font-black text-white">{lastGameStats.score}</p>
              </div>
            </div>

            {isSaving ? (
              <div className="flex flex-col items-center gap-4 bg-amber-500/10 p-6 rounded-3xl border border-amber-500/30 mb-6">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-amber-400 animate-pulse">กำลังบันทึกคะแนนลง Google Sheets...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentRound < 2 ? (
                  <button 
                    onClick={() => { setView(GameView.START_SCREEN); setCurrentRound(2); }}
                    className="w-full bg-amber-500 hover:bg-amber-400 py-5 rounded-2xl text-xl font-black shadow-xl transition-all"
                  >
                    เล่นรอบแก้ตัว (รอบที่ 2) 🔄
                  </button>
                ) : (
                  <div className="bg-emerald-500/10 p-6 border border-emerald-500/30 rounded-3xl mb-4">
                    <p className="text-emerald-400 font-black text-xl mb-1">ภารกิจเสร็จสิ้น! ✨</p>
                    <p className="text-white/60 font-medium">คะแนนที่ดีที่สุดของคุณคือ: <span className="text-white font-bold">{getBestScore()}</span></p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setView(GameView.LEADERBOARD)}
                    className="bg-slate-700 hover:bg-slate-600 py-4 rounded-2xl font-bold transition-all"
                  >
                    Leaderboard
                  </button>
                  <button 
                    onClick={() => { setView(GameView.CODE_ENTRY); setPlayerCode(''); }}
                    className="bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-all"
                  >
                    หน้าแรก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === GameView.LEADERBOARD && (
        <Leaderboard 
          records={allRecords} 
          currentPlayerCode={playerCode} 
          onBack={() => setView(GameView.CODE_ENTRY)} 
        />
      )}
    </div>
  );
};

export default App;
