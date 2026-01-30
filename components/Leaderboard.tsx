
import React from 'react';
import { GameRecord } from '../types';

interface LeaderboardProps {
  records: GameRecord[];
  onBack: () => void;
  currentPlayerCode?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ records, onBack, currentPlayerCode }) => {
  // Aggregate best score per player
  // Fix: Explicitly type the accumulator and initial value to resolve "Untyped function calls may not accept type arguments" and "unknown" errors
  const playerStats = records.reduce((acc: Record<string, GameRecord>, curr: GameRecord) => {
    if (!acc[curr.player_code] || curr.score > acc[curr.player_code].score) {
      acc[curr.player_code] = curr;
    }
    return acc;
  }, {} as Record<string, GameRecord>);

  // Fix: Explicitly cast Object.values to GameRecord[] to resolve "unknown[]" inference issues in some environments
  const sortedPlayers: GameRecord[] = (Object.values(playerStats) as GameRecord[]).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-full w-full bg-[#0a1628] flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">🏆 ตารางคะแนน</h1>
          <p className="text-amber-400 text-lg">คะแนนสูงสุดของแต่ละคน (Google Sheets)</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-800">
              <tr className="text-amber-400 font-bold uppercase text-sm">
                <th className="p-4">อันดับ</th>
                <th className="p-4">รหัสผู้เล่น</th>
                <th className="p-4 text-center">คะแนนสูงสุด</th>
                <th className="p-4 text-center hidden sm:table-cell">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player, idx) => {
                  const rank = idx + 1;
                  const isCurrent = player.player_code === currentPlayerCode;
                  
                  let rankColor = 'bg-slate-700';
                  if (rank === 1) rankColor = 'bg-amber-500';
                  else if (rank === 2) rankColor = 'bg-slate-400';
                  else if (rank === 3) rankColor = 'bg-orange-600';

                  return (
                    <tr key={player.player_code + idx} className={`${isCurrent ? 'bg-amber-500/10' : 'hover:bg-white/5'} transition-colors`}>
                      <td className="p-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${rankColor}`}>
                          {rank}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${isCurrent ? 'text-amber-400' : 'text-white'}`}>
                          {player.player_code}
                        </span>
                        {isCurrent && <span className="ml-2 text-xs text-amber-500 px-2 py-0.5 border border-amber-500 rounded-full">คุณ</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-2xl font-black text-white">{player.score}</span>
                      </td>
                      <td className="p-4 text-center hidden sm:table-cell text-white/40 text-sm">
                        {new Date(player.timestamp).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-white/50">
                    <div className="text-6xl mb-4">🌑</div>
                    <p>ยังไม่มีข้อมูลคะแนนในขณะนี้</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={onBack}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-12 rounded-full shadow-lg transition-all"
          >
            กลับสู่เมนู
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
