"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { 
  RotateCcw, 
  RefreshCw, 
  Trophy, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bot, 
  Users, 
  Flame,
  Swords
} from "lucide-react";

type ThemeType = "classic" | "bunny";
type GameMode = "pvp" | "ai";
type Player = "X" | "O" | null;

interface WinningLine {
  line: number[];
  direction: "row-0" | "row-1" | "row-2" | "col-0" | "col-1" | "col-2" | "diag-main" | "diag-anti";
}

const WINNING_COMBOS: { combo: number[]; direction: WinningLine["direction"] }[] = [
  // Rows
  { combo: [0, 1, 2], direction: "row-0" },
  { combo: [3, 4, 5], direction: "row-1" },
  { combo: [6, 7, 8], direction: "row-2" },
  // Cols
  { combo: [0, 3, 6], direction: "col-0" },
  { combo: [1, 4, 7], direction: "col-1" },
  { combo: [2, 5, 8], direction: "col-2" },
  // Diagonals
  { combo: [0, 4, 8], direction: "diag-main" },
  { combo: [2, 4, 6], direction: "diag-anti" },
];

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [theme, setTheme] = useState<ThemeType>("classic");
  const [gameMode, setGameMode] = useState<GameMode>("pvp");
  const [scores, setScores] = useState<{ X: number; O: number; draws: number }>({
    X: 0,
    O: 0,
    draws: 0,
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [winningInfo, setWinningInfo] = useState<WinningLine | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [aiThinking, setAiThinking] = useState<boolean>(false);

  // Sound synthesis via Web Audio API
  const playSound = useCallback((type: "click" | "win" | "draw" | "reset") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "win") {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.25);
        });
      } else if (type === "draw") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "reset") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  }, [soundEnabled]);

  const checkWinner = (squares: Player[]) => {
    for (const item of WINNING_COMBOS) {
      const [a, b, c] = item.combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {
          winner: squares[a],
          line: item.combo,
          direction: item.direction,
        };
      }
    }
    return null;
  };

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: theme === "bunny" 
          ? ["#f97316", "#a855f7", "#ec4899", "#84cc16"] 
          : ["#2563eb", "#ef4444", "#3b82f6", "#10b981"],
      });
    } catch {
      // Confetti fallback
    }
  }, [theme]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || winningInfo || isDraw || (gameMode === "ai" && !isXNext)) {
      return;
    }

    const newBoard = [...board];
    const currentPlayer = isXNext ? "X" : "O";
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    playSound("click");

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinningInfo({ line: winResult.line, direction: winResult.direction });
      setScores((prev) => ({
        ...prev,
        [winResult.winner!]: prev[winResult.winner!] + 1,
      }));
      playSound("win");
      triggerCelebration();
      return;
    }

    if (newBoard.every((cell) => cell !== null)) {
      setIsDraw(true);
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      playSound("draw");
      return;
    }

    setIsXNext(!isXNext);
  }, [board, winningInfo, isDraw, gameMode, isXNext, playSound, triggerCelebration]);

  // AI turn logic
  useEffect(() => {
    if (gameMode !== "ai" || isXNext || winningInfo || isDraw) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      // Smart AI move
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length === 0) return;

      // 1. Can AI (O) win in 1 move?
      for (const idx of emptyIndices) {
        const testBoard = [...board];
        testBoard[idx] = "O";
        if (checkWinner(testBoard)) {
          executeAiMove(idx);
          return;
        }
      }

      // 2. Can player (X) win in 1 move? Block them!
      for (const idx of emptyIndices) {
        const testBoard = [...board];
        testBoard[idx] = "X";
        if (checkWinner(testBoard)) {
          executeAiMove(idx);
          return;
        }
      }

      // 3. Take center if available
      if (emptyIndices.includes(4)) {
        executeAiMove(4);
        return;
      }

      // 4. Take corners
      const corners = [0, 2, 6, 8].filter((i) => emptyIndices.includes(i));
      if (corners.length > 0) {
        const randomCorner = corners[Math.floor(Math.random() * corners.length)];
        executeAiMove(randomCorner);
        return;
      }

      // 5. Take whatever is left
      const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      executeAiMove(randomIdx);
    }, 450);

    return () => clearTimeout(timer);
  }, [isXNext, gameMode, board, winningInfo, isDraw]);

  const executeAiMove = (index: number) => {
    setAiThinking(false);
    const newBoard = [...board];
    newBoard[index] = "O";
    setBoard(newBoard);
    playSound("click");

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinningInfo({ line: winResult.line, direction: winResult.direction });
      setScores((prev) => ({
        ...prev,
        O: prev.O + 1,
      }));
      playSound("win");
      triggerCelebration();
      return;
    }

    if (newBoard.every((cell) => cell !== null)) {
      setIsDraw(true);
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      playSound("draw");
      return;
    }

    setIsXNext(true);
  };

  const resetGame = () => {
    playSound("reset");
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinningInfo(null);
    setIsDraw(false);
    setAiThinking(false);
  };

  const resetAll = () => {
    resetGame();
    setScores({ X: 0, O: 0, draws: 0 });
  };

  // Label helpers based on theme
  const getPlayerLabel = (p: "X" | "O") => {
    if (theme === "bunny") {
      return p === "X" ? "Rabbit 🐰" : "Carrot 🥕";
    }
    return `Player ${p}`;
  };

  const renderCellContent = (val: Player) => {
    if (!val) return null;
    if (theme === "bunny") {
      return val === "X" ? (
        <span className="text-4xl md:text-5xl select-none animate-in zoom-in-50 duration-200">🐰</span>
      ) : (
        <span className="text-4xl md:text-5xl select-none animate-in zoom-in-50 duration-200">🥕</span>
      );
    }
    return val === "X" ? (
      <span className="text-5xl md:text-6xl font-black text-blue-600 select-none animate-in zoom-in-50 duration-150">
        X
      </span>
    ) : (
      <span className="text-5xl md:text-6xl font-black text-red-500 select-none animate-in zoom-in-50 duration-150">
        O
      </span>
    );
  };

  // Status message
  let statusText = "";
  if (winningInfo) {
    const winnerPlayer = board[winningInfo.line[0]] as "X" | "O";
    statusText = `Winner: ${getPlayerLabel(winnerPlayer)}`;
  } else if (isDraw) {
    statusText = "It's a Draw! 🤝";
  } else {
    if (gameMode === "ai" && !isXNext) {
      statusText = "AI is thinking...";
    } else {
      statusText = theme === "bunny" 
        ? `Next player: ${isXNext ? "Rabbit 🐰" : "Carrot 🥕"}` 
        : `Player ${isXNext ? "X" : "O"}'s turn`;
    }
  }

  const isBunny = theme === "bunny";

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-between p-4 md:p-8 transition-colors duration-500 ${
        isBunny
          ? "bg-gradient-to-b from-[#d9f99d]/60 via-[#bbf7d0]/40 to-[#86efac]/30 text-stone-800"
          : "bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-slate-100 text-slate-800"
      }`}
    >
      {/* Top Header / Nav Options */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 pb-4">
        {/* Theme Picker */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-black/5">
          <button
            onClick={() => setTheme("classic")}
            className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              !isBunny
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Classic (Demo 2)
          </button>
          <button
            onClick={() => setTheme("bunny")}
            className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              isBunny
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Karen&apos;s Bunny 🐰🥕 (Demo 1)
          </button>
        </div>

        {/* Mode & Sound controls */}
        <div className="flex items-center gap-2">
          {/* Game Mode */}
          <div className="flex items-center bg-white/80 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-black/5">
            <button
              onClick={() => {
                setGameMode("pvp");
                resetGame();
              }}
              title="2-Player PvP"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-xl transition-all ${
                gameMode === "pvp"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">2 Players</span>
            </button>
            <button
              onClick={() => {
                setGameMode("ai");
                resetGame();
              }}
              title="Play vs AI"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-xl transition-all ${
                gameMode === "ai"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Vs AI</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 rounded-2xl shadow-sm border border-black/5 transition-all"
            title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="text-center my-2 md:my-4">
        {isBunny ? (
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-700 tracking-wide drop-shadow-sm flex items-center justify-center gap-2">
            <span>Karen&apos;s Tic-tac-toe</span>
            <span className="text-3xl">🌿</span>
          </h1>
        ) : (
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Tic-Tac-Toe
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-1">
              Challenge your friends in this classic game!
            </p>
          </div>
        )}
      </div>

      {/* Main Game Arena */}
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 my-auto py-2">
        {/* Left Side: Game Grid */}
        <div
          className={`relative p-5 md:p-7 rounded-3xl transition-all duration-300 ${
            isBunny
              ? "bg-white/85 shadow-2xl shadow-emerald-500/10 border-4 border-emerald-100/80 backdrop-blur-lg"
              : "bg-white shadow-xl shadow-slate-200/70 border border-slate-100 rounded-2xl"
          }`}
        >
          {/* Subtle background glow for bunny theme */}
          {isBunny && (
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl -z-10 pointer-events-none" />
          )}

          {/* Grid Container */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-68 h-68 sm:w-80 sm:h-80 md:w-92 md:h-92">
            {board.map((cell, idx) => {
              const isWinningSquare = winningInfo?.line.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={Boolean(cell || winningInfo || isDraw || (gameMode === "ai" && !isXNext))}
                  className={`relative flex items-center justify-center rounded-2xl md:rounded-3xl transition-all duration-200 select-none font-bold outline-none cursor-pointer disabled:cursor-default
                    ${
                      isBunny
                        ? "border-2 border-emerald-200/90 bg-emerald-50/40 hover:bg-emerald-100/50 active:scale-95 shadow-sm"
                        : "border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 active:scale-95 shadow-sm"
                    }
                    ${
                      isWinningSquare
                        ? isBunny
                          ? "bg-gradient-to-br from-amber-100 to-orange-100 !border-orange-400 ring-4 ring-orange-300/50 scale-105 z-10"
                          : "bg-blue-50/90 !border-blue-500 ring-4 ring-blue-300/50 scale-105 z-10"
                        : ""
                    }
                    ${cell === "O" && isBunny ? "!border-orange-300 bg-orange-50/40" : ""}
                    ${cell === "X" && isBunny ? "!border-purple-300 bg-purple-50/40" : ""}
                  `}
                >
                  {renderCellContent(cell)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Turn Banner, Scoreboard & Actions */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Turn / Winner Status Banner */}
          <div
            className={`p-4 md:p-5 rounded-2xl text-center font-bold text-lg md:text-xl transition-all duration-300 ${
              winningInfo
                ? isBunny
                  ? "bg-gradient-to-r from-emerald-500/80 via-teal-500 to-purple-500 text-white shadow-lg shadow-purple-500/20 scale-102"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 scale-102"
                : isDraw
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : isBunny
                ? "bg-white/80 border border-emerald-200 text-emerald-800 shadow-sm"
                : "bg-white border border-slate-200 text-blue-600 shadow-sm"
            }`}
          >
            {aiThinking ? (
              <span className="flex items-center justify-center gap-2">
                <Bot className="w-5 h-5 animate-spin" />
                Thinking...
              </span>
            ) : (
              statusText
            )}
          </div>

          {/* Score Board */}
          <div
            className={`p-5 rounded-2xl shadow-sm border transition-all ${
              isBunny
                ? "bg-white/80 backdrop-blur-md border-emerald-200"
                : "bg-white border-slate-200"
            }`}
          >
            <h2 className="text-sm uppercase tracking-wider font-bold text-slate-400 text-center mb-4 flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              Score Board
            </h2>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Player X / Rabbit */}
              <div className="flex flex-col items-center">
                <div
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border mb-1.5 ${
                    isBunny
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  {isBunny ? "Rabbit 🐰" : "Player X"}
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-800">
                  {scores.X}
                </div>
              </div>

              {/* Draws */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-50 border-amber-200 text-amber-600 mb-1.5">
                  Draws
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-800">
                  {scores.draws}
                </div>
              </div>

              {/* Player O / Carrot */}
              <div className="flex flex-col items-center">
                <div
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border mb-1.5 ${
                    isBunny
                      ? "bg-orange-50 border-orange-200 text-orange-600"
                      : "bg-red-50 border-red-200 text-red-500"
                  }`}
                >
                  {isBunny ? "Carrot 🥕" : gameMode === "ai" ? "AI (O)" : "Player O"}
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-800">
                  {scores.O}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={resetGame}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
                isBunny
                  ? "bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-orange-500/20"
                  : "bg-slate-600 hover:bg-slate-700 text-white shadow-slate-600/20"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              {isBunny ? "Restart Game" : "New Game"}
            </button>

            <button
              onClick={resetAll}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm border shadow-sm transition-all active:scale-95 cursor-pointer ${
                isBunny
                  ? "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Footer attribution matching candidate specs */}
      <footer className="text-center text-xs text-slate-400 mt-8 mb-2">
        Built with React 19, Next.js 16, Tailwind CSS, and shadcn/ui inspiration
      </footer>
    </main>
  );
}
