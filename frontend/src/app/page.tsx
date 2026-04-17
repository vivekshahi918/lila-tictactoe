"use client";
import { useState, useRef } from "react";
import { client, authenticate } from "@/lib/nakama";
import { Trophy, User, Circle, X as XIcon, Loader2, Play, Zap } from "lucide-react";

export default function TicTacToe() {
  const [session, setSession] = useState<any>(null);
  const [matchId, setMatchId] = useState<string>("");
  const [gameState, setGameState] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "playing">("idle");
  const socketRef = useRef<any>(null);

  const startBattle = async () => {
    if (status !== "idle") return;
    setStatus("connecting");

    try {
      // 1. Authenticate
      const session = await authenticate();
      setSession(session);

      // 2. Call RPC to get a valid Match ID (Fast & Reliable)
      const rpcRes = await client.rpc(session, "find_match", {});
      const targetMatchId = rpcRes.payload;
      console.log("RPC Found Match:", targetMatchId);

      // 3. Connect Socket
      const socket = client.createSocket(false, false);
      await socket.connect(session, true);
      socketRef.current = socket;

      // 4. Setup Listener
      socket.onmatchdata = (result: any) => {
        if (result.op_code === 2) {
          setGameState(JSON.parse(new TextDecoder().decode(result.data)));
          setStatus("playing");
        }
      };

      // 5. Join the Match directly
      await socket.send({ join_match: { match_id: targetMatchId } });
      setMatchId(targetMatchId);
      
    } catch (e) {
      console.error("Netcode Failure:", e);
      alert("NETWORK ERROR: Port 7350 is unresponsive. Check Docker logs.");
      setStatus("idle");
    }
  };

  const makeMove = (index: number) => {
    if (!gameState || gameState.board[index] !== null || gameState.nextTurn !== session.user_id) return;
    socketRef.current.sendMatchData(matchId, 1, new TextEncoder().encode(JSON.stringify({ index })));
  };

  // UI remains the same as before...
  if (status !== "playing") return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
      <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20">
        <Zap className="text-blue-500 fill-blue-500" size={48} />
      </div>
      <h1 className="text-7xl font-black italic mb-2 tracking-tighter uppercase leading-none">LILA<br/><span className="text-blue-500 font-black">GAMES</span></h1>
      <p className="text-slate-500 font-mono text-[10px] mb-12 tracking-[0.5em] uppercase">V1.0.9 - Fast_Sync_Protocol</p>
      
      <button 
        onClick={startBattle}
        disabled={status === "connecting"}
        className="group relative bg-blue-600 hover:bg-blue-500 text-white px-20 py-6 rounded-[2rem] font-black text-2xl transition-all shadow-[0_20px_60px_rgba(37,99,235,0.3)] disabled:opacity-50"
      >
        {status === "connecting" ? "SYNCING..." : "START BATTLE"}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8 px-4">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">LILA <span className="text-blue-500 font-black">GAMES</span></h1>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl text-[10px] font-mono text-slate-500">
                MATCH_ID: {matchId.substring(0, 6)}
            </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-6 mb-8 flex justify-between items-center border border-white/5 shadow-2xl">
          <div className={`flex items-center gap-4 ${gameState?.nextTurn === session?.user_id ? 'text-green-400' : 'text-slate-500'}`}>
            <div className={`p-3 rounded-2xl ${gameState?.nextTurn === session?.user_id ? 'bg-green-400/20' : 'bg-slate-800'}`}>
              <User size={28} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">Turn State</p>
                <p className="font-black text-lg uppercase tracking-tighter">
                    {gameState?.nextTurn === session?.user_id ? "Your Action" : "Opponent"}
                </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-slate-900/40 p-5 rounded-[3.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
          {gameState?.board.map((cell: any, i: number) => (
            <button
              key={i}
              onClick={() => makeMove(i)}
              disabled={gameState?.nextTurn !== session?.user_id || cell !== null}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] flex items-center justify-center text-5xl transition-all duration-300
                ${cell === null ? 'bg-slate-800/60 hover:bg-slate-700/80 cursor-pointer shadow-inner' : 'bg-slate-950'}
                ${gameState?.nextTurn === session?.user_id && cell === null ? 'ring-2 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}
              `}
            >
              {cell === 'X' && <XIcon size={48} className="text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]" />}
              {cell === 'O' && <Circle size={48} className="text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" />}
            </button>
          ))}
        </div>
      </div>
      {gameState?.winner && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center p-6 backdrop-blur-2xl z-50">
            <div className="bg-slate-900 p-16 rounded-[4rem] text-center border border-white/10 shadow-2xl">
                <Trophy size={80} className="text-yellow-500 mx-auto mb-10 shadow-yellow-500/20" />
                <h2 className="text-6xl font-black mb-12 tracking-tighter uppercase italic">
                    {gameState.winner === session.user_id ? "Win" : "Loss"}
                </h2>
                <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white px-12 py-6 rounded-3xl font-black uppercase shadow-xl">Rematch</button>
            </div>
        </div>
      )}
    </main>
  );
}