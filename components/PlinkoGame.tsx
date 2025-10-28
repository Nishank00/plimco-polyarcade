'use client';

import { useRef, useState, useEffect } from 'react';
import { usePlinkoPhysics } from '@/hooks/usePlinkoPhysics';
import { useGameState } from '@/hooks/useGameState';
import { RiskLevel } from '@/types/game';
import Confetti from './Confetti';

export default function PlinkoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    settings,
    gameState,
    recentResults,
    updateSettings,
    updateBet,
    placeBet,
    recordResult,
    reset,
    getMultipliers,
  } = useGameState();

  const [lastWin, setLastWin] = useState<{multiplier: number; amount: number} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const multipliers = getMultipliers();

  const handleBallLanded = (slotIndex: number, betAmount: number) => {
    const result = recordResult(slotIndex, betAmount);
    setLastWin({ multiplier: result.multiplier, amount: result.winAmount });

    if (result.multiplier >= 10) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }

    playWinSound(result.multiplier);
    setTimeout(() => setLastWin(null), 2000);
  };

  const { isReady, dropBall } = usePlinkoPhysics(
    canvasRef,
    settings,
    multipliers,
    handleBallLanded
  );

  const playWinSound = (multiplier: number) => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400 + Math.min(multiplier * 20, 800);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Silent fail
    }
  };

  const handleDropBall = () => {
    // Allow dropping multiple balls - just check if we can afford it
    const betAmount = placeBet();
    if (betAmount > 0) {
      dropBall(betAmount);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Confetti show={showConfetti} />

      <div className="container mx-auto px-3 py-4 max-w-6xl">
        {/* Compact Header */}
        <header className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-1">
            PLINKO
          </h1>
          <p className="text-sm text-purple-300">Drop • Bounce • Win!</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Controls - Compact */}
          <div className="lg:col-span-3 space-y-3">
            {/* Balance */}
            <div className="glass-dark rounded-xl p-3 border border-purple-500/30">
              <p className="text-xs text-gray-400 mb-1">Balance</p>
              <p className="text-2xl font-bold text-green-400">${gameState.balance.toFixed(2)}</p>
              <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs">
                <span className="text-gray-400">Profit:</span>
                <span className={gameState.totalWon - gameState.totalWagered >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {gameState.totalWon - gameState.totalWagered >= 0 ? '+' : ''}${(gameState.totalWon - gameState.totalWagered).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Bet Amount - Improved */}
            <div className="glass-dark rounded-xl p-4 border border-gray-700">
              <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-yellow-400">💰</span> Bet Amount
              </p>

              {/* Custom Bet Input */}
              <div className="relative mb-3">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-bold text-xl">$</div>
                <input
                  type="number"
                  value={gameState.currentBet}
                  onChange={(e) => updateBet(parseFloat(e.target.value) || 0)}
                  disabled={gameState.isPlaying}
                  min="1"
                  step="0.01"
                  className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white text-2xl font-black py-3 pl-8 pr-4 rounded-lg border-2 border-green-500/50 text-center disabled:opacity-50 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition-all shadow-inner"
                  placeholder="0.00"
                />
              </div>

              {/* Quick Adjust Buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => updateBet(gameState.currentBet / 2)}
                  disabled={gameState.isPlaying || gameState.currentBet < 2}
                  className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white py-2 px-3 rounded-lg text-sm font-bold disabled:opacity-50 transition-all shadow-md"
                >
                  ½ Half
                </button>
                <button
                  onClick={() => updateBet(gameState.currentBet * 2)}
                  disabled={gameState.isPlaying || gameState.currentBet * 2 > gameState.balance}
                  className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white py-2 px-3 rounded-lg text-sm font-bold disabled:opacity-50 transition-all shadow-md"
                >
                  2× Double
                </button>
              </div>

              {/* Chip Buttons */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-400 mb-1.5">Quick Chips:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 25, color: 'from-blue-600 to-blue-700', hoverColor: 'hover:from-blue-500 hover:to-blue-600' },
                    { value: 50, color: 'from-purple-600 to-purple-700', hoverColor: 'hover:from-purple-500 hover:to-purple-600' },
                    { value: 75, color: 'from-pink-600 to-pink-700', hoverColor: 'hover:from-pink-500 hover:to-pink-600' },
                    { value: 100, color: 'from-orange-600 to-orange-700', hoverColor: 'hover:from-orange-500 hover:to-orange-600' },
                  ].map(chip => (
                    <button
                      key={chip.value}
                      onClick={() => updateBet(chip.value)}
                      disabled={gameState.isPlaying || chip.value > gameState.balance}
                      className={`bg-gradient-to-br ${chip.color} ${chip.hoverColor} text-white py-2.5 px-4 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs opacity-75">$</span>
                        <span className="text-lg leading-none">{chip.value}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Bet Button */}
              <button
                onClick={() => updateBet(gameState.balance)}
                disabled={gameState.isPlaying || gameState.balance === 0}
                className="w-full mt-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white py-2 px-4 rounded-lg text-xs font-bold disabled:opacity-50 transition-all shadow-md"
              >
                MAX (${gameState.balance.toFixed(2)})
              </button>
            </div>

            {/* Risk Level - Compact */}
            <div className="glass-dark rounded-xl p-3 border border-gray-700">
              <p className="text-xs font-bold text-white mb-2">Risk Level</p>
              <div className="space-y-1">
                {(['low', 'medium', 'high'] as RiskLevel[]).map((risk) => (
                  <button
                    key={risk}
                    onClick={() => updateSettings({ riskLevel: risk })}
                    disabled={gameState.isPlaying}
                    className={`w-full py-2 px-3 rounded text-xs font-bold uppercase transition ${
                      settings.riskLevel === risk
                        ? risk === 'low'
                          ? 'bg-green-600 text-white'
                          : risk === 'medium'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    } disabled:opacity-50`}
                  >
                    {risk} {settings.riskLevel === risk && '✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows - Compact */}
            <div className="glass-dark rounded-xl p-3 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-white">Rows</p>
                <span className="text-lg font-bold text-purple-400">{settings.rows}</span>
              </div>
              <input
                type="range"
                min="8"
                max="16"
                value={settings.rows}
                onChange={(e) => updateSettings({ rows: parseInt(e.target.value) })}
                disabled={gameState.isPlaying}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8</span>
                <span>16</span>
              </div>
            </div>

            {/* Stats - Compact */}
            <div className="glass-dark rounded-xl p-3 border border-gray-700">
              <p className="text-xs font-bold text-white mb-2">Statistics</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Games:</span>
                  <span className="text-white font-bold">{gameState.gamesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wagered:</span>
                  <span className="text-orange-400 font-bold">${gameState.totalWagered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Won:</span>
                  <span className="text-green-400 font-bold">${gameState.totalWon.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white py-1 rounded text-xs font-bold transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Center - Game Board */}
          <div className="lg:col-span-6">
            <div className="glass-dark rounded-xl p-3 border border-purple-500/30">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[6/7] max-w-[500px] mx-auto">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={700}
                  className="w-full h-full"
                />

                {/* Multiplier Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex bg-gradient-to-t from-gray-900 to-transparent pt-6 pb-1">
                  {multipliers.map((mult, i) => (
                    <div key={i} className="flex-1 text-center px-0.5">
                      <div className={`text-[10px] font-bold rounded-full py-0.5 ${
                        mult >= 50 ? 'bg-pink-600 text-white' :
                        mult >= 10 ? 'bg-orange-500 text-white' :
                        mult >= 1 ? 'bg-green-500 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {mult}x
                      </div>
                    </div>
                  ))}
                </div>

                {/* Win Popup */}
                {lastWin && (
                  <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className={`${
                      lastWin.multiplier >= 50 ? 'bg-gradient-to-r from-pink-600 to-purple-600' :
                      lastWin.multiplier >= 10 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                      'bg-gradient-to-r from-green-500 to-emerald-500'
                    } rounded-2xl p-6 shadow-2xl animate-win-celebration`}>
                      <p className="text-4xl font-black text-white">{lastWin.multiplier}x</p>
                      <p className="text-xl font-bold text-white">+${lastWin.amount.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Drop Button */}
              <button
                onClick={handleDropBall}
                disabled={!isReady || gameState.currentBet > gameState.balance || gameState.balance === 0}
                className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xl py-3 rounded-lg shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {gameState.balance === 0 ? 'NO BALANCE' :
                 gameState.currentBet > gameState.balance ? 'INSUFFICIENT FUNDS' :
                 !isReady ? 'LOADING...' : 'DROP BALL'}
              </button>
            </div>
          </div>

          {/* Right - Recent Results */}
          <div className="lg:col-span-3 space-y-3">
            {/* Recent Drops */}
            <div className="glass-dark rounded-xl p-3 border border-gray-700 max-h-[600px] overflow-y-auto">
              <p className="text-xs font-bold text-white mb-2 sticky top-0 bg-gray-900/90 backdrop-blur pb-2">Recent Drops</p>
              <div className="space-y-2">
                {recentResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-2">🎰</p>
                    <p className="text-xs text-gray-500">No drops yet</p>
                  </div>
                ) : (
                  recentResults.map((result) => (
                    <div
                      key={result.id}
                      className={`rounded-lg p-2 border ${
                        result.multiplier >= 50 ? 'bg-pink-900/20 border-pink-500/30' :
                        result.multiplier >= 10 ? 'bg-orange-900/20 border-orange-500/30' :
                        result.multiplier >= 1 ? 'bg-green-900/20 border-green-500/30' :
                        'bg-gray-800/20 border-gray-600/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-lg font-black ${
                            result.multiplier >= 50 ? 'text-pink-400' :
                            result.multiplier >= 10 ? 'text-orange-400' :
                            result.multiplier >= 1 ? 'text-green-400' :
                            'text-gray-400'
                          }`}>
                            {result.multiplier}x
                          </p>
                          <p className="text-xs text-gray-500">Slot {result.slotIndex + 1}</p>
                        </div>
                        <p className="text-lg font-bold text-green-400">
                          +${result.winAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Multipliers Chart */}
            <div className="glass-dark rounded-xl p-3 border border-gray-700">
              <p className="text-xs font-bold text-white mb-2">Multipliers</p>
              <div className="space-y-0.5 max-h-48 overflow-y-auto text-xs">
                {multipliers.map((mult, i) => {
                  const maxMult = Math.max(...multipliers);
                  const percentage = (mult / maxMult) * 100;

                  return (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-gray-500 w-4 text-xs">{i + 1}</span>
                      <div className="flex-1 bg-gray-900/50 h-4 rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            mult >= 50 ? 'bg-pink-600' :
                            mult >= 10 ? 'bg-orange-500' :
                            mult >= 1 ? 'bg-green-500' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`w-12 text-right font-bold ${
                        mult >= 50 ? 'text-pink-400' :
                        mult >= 10 ? 'text-orange-400' :
                        mult >= 1 ? 'text-green-400' :
                        'text-gray-400'
                      }`}>
                        {mult}x
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
