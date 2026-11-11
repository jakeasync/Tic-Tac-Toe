"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, 
  Menu, 
  Moon, 
  Sun, 
  Contrast, 
  RotateCcw, 
  Heart, 
  Bot, 
  Users, 
  ArrowRight,
  Volume2,
  VolumeX,
  X
} from "lucide-react";

type ThemeMode = "system" | "light" | "dark";
type GameMode = "pvp" | "ai";
type Player = "Rabbit" | "Carrot" | null;

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
  const [isRabbitNext, setIsRabbitNext] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [gameMode, setGameMode] = useState<GameMode>("pvp");
  const [scores, setScores] = useState({ rabbit: 0, carrot: 0, draws: 0 });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(3142);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [winningInfo, setWinningInfo] = useState<WinningInfo | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [aiThinking, setAiThinking] = useState<boolean>(false);

  // Sound generator
  const playSound = useCallback((type: "click" | "win" | "draw" | "reset") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === "win") {
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.09 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.09);
          osc.stop(ctx.currentTime + idx * 0.09 + 0.2);
        });
      } else if (type === "draw" || type === "reset") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // AudioContext unavailable
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
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#ea580c", "#10b981", "#fbbf24", "#38bdf8"],
      });
    } catch {
      // fallback
    }
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || winningInfo || isDraw || (gameMode === "ai" && !isRabbitNext)) {
      return;
    }

    const newBoard = [...board];
    const currentPlayer = isRabbitNext ? "Rabbit" : "Carrot";
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    playSound("click");

    const win = checkWinner(newBoard);
    if (win) {
      setWinningInfo(win);
      setScores((prev) => ({
        ...prev,
        [win.winner === "Rabbit" ? "rabbit" : "carrot"]: prev[win.winner === "Rabbit" ? "rabbit" : "carrot"] + 1,
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

    setIsRabbitNext(!isRabbitNext);
  }, [board, winningInfo, isDraw, gameMode, isRabbitNext, playSound, triggerCelebration]);

  // AI Logic for vs Bot
  useEffect(() => {
    if (gameMode !== "ai" || isRabbitNext || winningInfo || isDraw) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      const empty = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (empty.length === 0) return;

      // 1. Can AI (Carrot) win?
      for (const idx of empty) {
        const test = [...board];
        test[idx] = "Carrot";
        if (checkWinner(test)) {
          executeAiMove(idx);
          return;
        }
      }

      // 2. Can player (Rabbit) win? Block!
      for (const idx of empty) {
        const test = [...board];
        test[idx] = "Rabbit";
        if (checkWinner(test)) {
          executeAiMove(idx);
          return;
        }
      }

      // 3. Center
      if (empty.includes(4)) {
        executeAiMove(4);
        return;
      }

      // 4. Corner
      const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
      if (corners.length > 0) {
        executeAiMove(corners[Math.floor(Math.random() * corners.length)]);
        return;
      }

      executeAiMove(empty[Math.floor(Math.random() * empty.length)]);
    }, 400);

    return () => clearTimeout(timer);
  }, [isRabbitNext, gameMode, board, winningInfo, isDraw]);

  const executeAiMove = (index: number) => {
    setAiThinking(false);
    const newBoard = [...board];
    newBoard[index] = "Carrot";
    setBoard(newBoard);
    playSound("click");

    const win = checkWinner(newBoard);
    if (win) {
      setWinningInfo(win);
      setScores((prev) => ({ ...prev, carrot: prev.carrot + 1 }));
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

    setIsRabbitNext(true);
  };

  const resetGame = () => {
    playSound("reset");
    setBoard(Array(9).fill(null));
    setIsRabbitNext(true);
    setWinningInfo(null);
    setIsDraw(false);
    setAiThinking(false);
  };

  const resetAllScores = () => {
    resetGame();
    setScores({ rabbit: 0, carrot: 0, draws: 0 });
    setIsMenuOpen(false);
  };

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  // Theme styles based on Nothing (R) Playground
  const isDark = themeMode === "dark";
  const isContrast = themeMode === "system";

  let bgClass = "bg-[#efede9] text-[#121212]";
  let cardClass = "bg-[#f5f4f0] border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.04)]";
  let boardBg = "bg-[#ebe9e4]";
  let cellClass = "bg-[#dedbd5] hover:bg-[#d6d3cc] text-[#1e1e1e]";
  let headerPillBg = "bg-[#e5e3de] text-[#1e1e1e]";
  let menuBtnBg = "bg-[#181818] text-white";

  if (isDark) {
    bgClass = "bg-[#121212] text-[#f0f0f0]";
    cardClass = "bg-[#1b1b1b] border-white/5 shadow-2xl";
    boardBg = "bg-[#181818]";
    cellClass = "bg-[#252525] hover:bg-[#2d2d2d] text-[#f0f0f0]";
    headerPillBg = "bg-[#222222] text-[#e0e0e0]";
    menuBtnBg = "bg-[#ffffff] text-[#121212]";
  } else if (isContrast) {
    // High-contrast / OLED monospaced look
    bgClass = "bg-[#000000] text-[#ffffff]";
    cardClass = "bg-[#0d0d0d] border border-white/20 shadow-none";
    boardBg = "bg-[#0a0a0a]";
    cellClass = "bg-[#1a1a1a] hover:bg-[#242424] text-white border border-white/10";
    headerPillBg = "bg-[#1a1a1a] text-white border border-white/20";
    menuBtnBg = "bg-white text-black";
  }

  // Status message
  let statusBanner = "";
  if (winningInfo) {
    statusBanner = winningInfo.winner === "Rabbit" ? "Winner: Rabbit 🐰" : "Winner: Carrot 🥕";
  } else if (isDraw) {
    statusBanner = "Game Drawn 🤝";
  } else if (aiThinking) {
    statusBanner = "Carrot AI is thinking...";
  } else {
    statusBanner = isRabbitNext ? "Next player: Rabbit 🐰" : "Next player: Carrot 🥕";
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between px-4 py-5 sm:p-6 transition-colors duration-300 font-sans ${bgClass}`}>
      {/* Top Navigation Bar: Exact Nothing (R) Playground header */}
      <header className="w-full max-w-md flex items-center justify-between pt-1 pb-3">
        {/* Left Branding */}
        <div className="flex flex-col">
          <div className="font-ndot text-sm sm:text-base font-bold tracking-wider leading-none">
            NOTHING (R)
          </div>
          <div className="font-ndot text-[11px] text-neutral-400 dark:text-neutral-500 font-medium tracking-widest mt-0.5">
            PLAYGROUND <span className="text-[9px] uppercase opacity-75">ALPHA</span>
          </div>
        </div>

        {/* Right Controls: 3 Theme Modes + Menu */}
        <div className="flex items-center gap-2">
          {/* Theme Selector Pill */}
          <div className={`flex items-center p-1 rounded-full gap-0.5 transition-colors ${headerPillBg}`}>
            {/* Contrast Mode */}
            <button
              onClick={() => setThemeMode("system")}
              title="High Contrast / OLED"
              className={`p-1.5 rounded-full transition-all ${
                themeMode === "system"
                  ? "bg-white/20 shadow-sm scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Contrast className="w-4 h-4" />
            </button>

            {/* Light Mode */}
            <button
              onClick={() => setThemeMode("light")}
              title="Light Mode"
              className={`p-1.5 rounded-full transition-all ${
                themeMode === "light"
                  ? "bg-black/10 dark:bg-white/20 shadow-sm scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => setThemeMode("dark")}
              title="Dark Mode"
              className={`p-1.5 rounded-full transition-all ${
                themeMode === "dark"
                  ? "bg-white/20 shadow-sm scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Drawer Toggle Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-14 h-9 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-sm cursor-pointer ${menuBtnBg}`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Slide-down / Dropdown Menu for Game Options */}
      {isMenuOpen && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-top-4 duration-200 mb-3">
          <div className={`p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-lg ${cardClass}`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <span className="font-ndot text-xs uppercase tracking-widest font-semibold">Game Settings</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-1.5 text-xs opacity-75 hover:opacity-100 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
                <span>{soundEnabled ? "Sound On" : "Muted"}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Mode</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setGameMode("pvp"); resetGame(); }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      gameMode === "pvp" ? "bg-amber-400 text-black font-semibold" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    2 Players
                  </button>
                  <button
                    onClick={() => { setGameMode("ai"); resetGame(); }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      gameMode === "ai" ? "bg-amber-400 text-black font-semibold" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 inline mr-1" />
                    Vs AI
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-medium">Scoreboard</span>
                <button
                  onClick={resetAllScores}
                  className="text-red-500 hover:text-red-600 font-semibold cursor-pointer"
                >
                  Reset Scores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back button row (Nothing Playground style) */}
      <div className="w-full max-w-md flex items-center justify-start py-1">
        <button
          onClick={resetGame}
          className="w-10 h-10 flex items-center justify-center rounded-full opacity-70 hover:opacity-100 active:scale-95 transition-all cursor-pointer"
          title="Restart round"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Large Card Container */}
      <div className={`w-full max-w-md p-6 sm:p-8 rounded-[36px] transition-all flex flex-col items-center my-auto ${cardClass}`}>
        
        {/* Game Arena / Board Rounded Inset Box */}
        <div className={`w-full aspect-square max-w-[320px] p-4 sm:p-5 rounded-[32px] flex items-center justify-center transition-all ${boardBg}`}>
          <div className="grid grid-cols-3 gap-3 w-full h-full">
            {board.map((cell, idx) => {
              const isWinningSquare = winningInfo?.line.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={Boolean(cell || winningInfo || isDraw || (gameMode === "ai" && !isRabbitNext))}
                  className={`w-full h-full rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-default select-none ${cellClass} ${
                    isWinningSquare
                      ? "ring-4 ring-amber-400 shadow-md scale-105 z-10"
                      : ""
                  }`}
                  aria-label={`Square ${idx + 1}`}
                >
                  {cell === "Rabbit" && (
                    <span className="text-3xl sm:text-4xl animate-in zoom-in-75 duration-150 drop-shadow-sm">
                      🐰
                    </span>
                  )}
                  {cell === "Carrot" && (
                    <span className="text-3xl sm:text-4xl animate-in zoom-in-75 duration-150 drop-shadow-sm">
                      🥕
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Turn / Winner Status Banner */}
        <div className="w-full text-center mt-5">
          <div
            className={`inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all ${
              winningInfo
                ? "bg-amber-400 text-black shadow-md scale-105"
                : isDraw
                ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                : "bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {statusBanner}
          </div>
        </div>

        {/* Scores Mini Pill */}
        <div className="flex items-center gap-4 mt-3 text-xs opacity-75 font-medium">
          <span>🐰 Rabbit: <strong>{scores.rabbit}</strong></span>
          <span>•</span>
          <span>Ties: <strong>{scores.draws}</strong></span>
          <span>•</span>
          <span>🥕 Carrot: <strong>{scores.carrot}</strong></span>
        </div>
      </div>

      {/* Bottom Info Section: Nothing Playground Typography */}
      <div className="w-full max-w-md flex flex-col items-center text-center mt-4">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-serif tracking-normal text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          Karen&apos;s Tic-tac-toe
        </h1>

        {/* Like & Play Stats Badge */}
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 mt-1 cursor-pointer transition-all"
        >
          <span className="font-ndot">[{(likeCount / 1000).toFixed(1)}K]</span>
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        {/* Description paragraph in dot-matrix / monospaced aesthetic */}
        <p className="font-ndot text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mt-4 max-w-sm px-2">
          Simple design, instant gameplay, and endless mini matches. Play Karen&apos;s classic right on your screen – line up three marks to win.
        </p>

        {/* Yellow Action Button (Nothing Playground CTA) */}
        <div className="w-full px-2 mt-5 mb-2">
          <button
            onClick={resetGame}
            className="w-full bg-[#f5b838] hover:bg-[#eab02e] active:scale-[0.98] text-[#1a1a1a] font-ndot font-bold text-sm tracking-wide py-3.5 px-6 rounded-2xl flex items-center justify-between shadow-md transition-all cursor-pointer"
          >
            <span>Restart Game</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Sub-text footer */}
        <div className="text-[11px] text-neutral-400 dark:text-neutral-600 font-ndot mt-2">
          ground.nothing.tech • React 19 • Geist Font
        </div>
      </div>
    </div>
  );
}
