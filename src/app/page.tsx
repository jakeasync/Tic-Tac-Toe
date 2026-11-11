"use client";

import React, { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { BotAvatar } from "bot-avatars";
import { 
  ArrowLeft, 
  Menu, 
  Moon, 
  Sun, 
  Contrast, 
  ArrowRight,
  Volume2,
  VolumeX,
  X
} from "lucide-react";

type ThemeMode = "system" | "light" | "dark";
type Player = "Flower" | "Star" | null;

interface WinningInfo {
  winner: Player;
  line: number[];
}

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isFlowerNext, setIsFlowerNext] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [scores, setScores] = useState({ flower: 0, star: 0, draws: 0 });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [winningInfo, setWinningInfo] = useState<WinningInfo | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [activeCell, setActiveCell] = useState<number | null>(null);

  useEffect(() => {
    if (activeCell !== null) {
      const timer = setTimeout(() => {
        setActiveCell(null);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [activeCell]);

  const playSound = useCallback((type: "click" | "win" | "draw" | "reset") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === "win") {
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.22);
        });
      } else if (type === "draw" || type === "reset") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
    }
  }, [soundEnabled]);

  const checkWinner = (squares: Player[]) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {
          winner: squares[a],
          line: combo,
        };
      }
    }
    return null;
  };

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#ea580c", "#10b981", "#fbbf24", "#38bdf8"],
      });
    } catch {
    }
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || winningInfo || isDraw) {
      return;
    }

    const newBoard = [...board];
    const currentPlayer = isFlowerNext ? "Flower" : "Star";
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setActiveCell(index);
    playSound("click");

    const win = checkWinner(newBoard);
    if (win) {
      setWinningInfo(win);
      setScores((prev) => ({
        ...prev,
        [win.winner === "Flower" ? "flower" : "star"]: prev[win.winner === "Flower" ? "flower" : "star"] + 1,
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

    setIsFlowerNext(!isFlowerNext);
  }, [board, winningInfo, isDraw, isFlowerNext, playSound, triggerCelebration]);

  const resetGame = () => {
    playSound("reset");
    setBoard(Array(9).fill(null));
    setIsFlowerNext(true);
    setWinningInfo(null);
    setIsDraw(false);
    setActiveCell(null);
  };

  const resetAllScores = () => {
    resetGame();
    setScores({ flower: 0, star: 0, draws: 0 });
    setIsMenuOpen(false);
  };

  const isDark = themeMode === "dark";
  const isContrast = themeMode === "system";

  let bgClass = "bg-[#efede9] text-[#121212]";
  let cardClass = "bg-[#f5f4f0] border border-black/5 shadow-none";
  let boardBg = "bg-[#ebe9e4]";
  let cellClass = "bg-[#dedbd5] hover:bg-[#d6d3cc] text-[#1e1e1e]";
  let headerPillBg = "bg-[#e5e3de] text-[#1e1e1e]";
  let menuBtnBg = "bg-[#181818] text-white";

  if (isDark) {
    bgClass = "bg-[#121212] text-[#f0f0f0]";
    cardClass = "bg-[#1b1b1b] border-white/5 shadow-none";
    boardBg = "bg-[#181818]";
    cellClass = "bg-[#252525] hover:bg-[#2d2d2d] text-[#f0f0f0]";
    headerPillBg = "bg-[#222222] text-[#e0e0e0]";
    menuBtnBg = "bg-[#ffffff] text-[#121212]";
  } else if (isContrast) {
    bgClass = "bg-[#000000] text-[#ffffff]";
    cardClass = "bg-[#0d0d0d] border border-white/20 shadow-none";
    boardBg = "bg-[#0a0a0a]";
    cellClass = "bg-[#1a1a1a] hover:bg-[#242424] text-white border border-white/10";
    headerPillBg = "bg-[#1a1a1a] text-white border border-white/20";
    menuBtnBg = "bg-white text-black";
  }

  let statusBanner = "";
  if (winningInfo) {
    statusBanner = winningInfo.winner === "Flower" ? "Winner: Flower 🌸" : "Winner: Star ⭐";
  } else if (isDraw) {
    statusBanner = "Game Drawn 🤝";
  } else {
    statusBanner = isFlowerNext ? "Next player: Flower 🌸" : "Next player: Star ⭐";
  }

  return (
    <div className={`h-screen w-full flex flex-col justify-between px-3 sm:px-6 py-3 overflow-hidden transition-colors duration-300 font-sans ${bgClass}`}>
      <main className="w-full flex-1 flex flex-col items-center justify-center my-auto py-1 max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-3">
          <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
            Tic-Tac-Toe
          </h1>
        </div>

        <div className={`w-[325px] sm:w-[355px] flex items-center justify-between px-5 py-3 rounded-2xl transition-all ${boardBg} mb-3.5`}>
          <div className="flex items-center gap-1.5">
            <BotAvatar type="flower" color="#22c55e" size={24} jumpEvery={0} turn={0} interactive={false} />
            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[13px] font-medium">Flower</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-base">{scores.flower}</span>
          </div>

          <span className="text-neutral-300 dark:text-neutral-600 font-mono">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[13px] font-medium">Draws</span>
            <span className="font-bold font-mono text-neutral-600 dark:text-neutral-300 text-base">{scores.draws}</span>
          </div>

          <span className="text-neutral-300 dark:text-neutral-600 font-mono">•</span>

          <div className="flex items-center gap-1.5">
            <BotAvatar type="star" color="#8d5b4c" size={24} jumpEvery={0} turn={0} interactive={false} />
            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[13px] font-medium">Star</span>
            <span className="font-bold font-mono text-amber-700 dark:text-amber-500 text-base">{scores.star}</span>
          </div>
        </div>

        <div className={`w-[325px] h-[325px] sm:w-[355px] sm:h-[355px] p-2.5 sm:p-3 rounded-[30px] flex items-center justify-center transition-all ${boardBg}`}>
          <div className="grid grid-cols-3 gap-2.5 w-full h-full">
            {board.map((cell, idx) => {
              const isWinningSquare = winningInfo?.line.includes(idx);
              const isActive = activeCell === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={Boolean(cell || winningInfo || isDraw)}
                  className={`w-full h-full rounded-2xl flex items-center justify-center overflow-hidden select-none cursor-pointer disabled:cursor-default ${cellClass} ${
                    isWinningSquare
                      ? "ring-3 ring-amber-400 z-10"
                      : ""
                  }`}
                  aria-label={`Square ${idx + 1}`}
                >
                  {cell === "Flower" && (
                    <div className="pointer-events-none flex items-center justify-center w-full h-full">
                      <BotAvatar
                        type="flower"
                        color="#22c55e"
                        state={isActive ? "working" : "default"}
                        size={75}
                        jumpEvery={0}
                        turn={isActive ? 1 : 0}
                        interactive={false}
                      />
                    </div>
                  )}
                  {cell === "Star" && (
                    <div className="pointer-events-none flex items-center justify-center w-full h-full">
                      <BotAvatar
                        type="star"
                        color="#8d5b4c"
                        state={isActive ? "working" : "default"}
                        size={75}
                        jumpEvery={0}
                        turn={isActive ? 1 : 0}
                        interactive={false}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3.5 mb-1.5">
          <div
            className={`inline-block px-5 py-2 rounded-full text-[13px] font-mono font-semibold tracking-wide transition-all ${
              winningInfo
                ? "bg-amber-400 text-black"
                : isDraw
                ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                : "bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {statusBanner}
          </div>
        </div>

        <div className="w-[325px] sm:w-[355px] mt-2.5 mb-2 flex gap-2.5">
          <button
            onClick={resetGame}
            className="flex-1 bg-[#f5b838] hover:bg-[#eab02e] active:scale-[0.98] text-[#1a1a1a] font-mono font-bold text-sm tracking-wide py-4 px-5 rounded-2xl flex items-center justify-center transition-all cursor-pointer"
          >
            <span>New Game</span>
          </button>

          <button
            onClick={resetAllScores}
            className={`px-7 py-4 rounded-2xl font-mono text-sm font-semibold opacity-80 hover:opacity-100 transition-all border ${cardClass} cursor-pointer`}
            title="Reset scores"
          >
            Clear
          </button>
        </div>
      </main>
    </div>
  );
}
