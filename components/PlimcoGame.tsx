'use client';

import { useRef, useState } from 'react';
import { usePlimcoPhysics } from '@/hooks/usePlimcoPhysics';
import { useGameState } from '@/hooks/useGameState';

export default function PlimcoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, stats, balance, updateSettings, recordPrize, resetStats } = useGameState();
  const [showSettings, setShowSettings] = useState(false);
  const [lastPrize, setLastPrize] = useState<number | null>(null);

  const handleBallLanded = (prizeIndex: number) => {
    recordPrize(prizeIndex);
    setLastPrize(settings.prizes[prizeIndex]);

    if (settings.soundEnabled) {
      playSound(prizeIndex);
    }

    setTimeout(() => setLastPrize(null), 2000);
  };

  const { isReady, dropBall } = usePlimcoPhysics(canvasRef, settings, handleBallLanded);

  const playSound = (prizeIndex: number) => {
    // Simple audio feedback using Web Audio API
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Higher frequency for better prizes
    oscillator.frequency.value = 200 + prizeIndex * 50;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-6xl font-black text-white drop-shadow-lg mb-2 animate-bounce"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            🎮 PLIMCO GAME! 🎮
          </h1>
          <p className="text-2xl text-white font-bold drop-shadow-md">
            Drop the ball and win prizes!
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Panel */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-yellow-400">
            <h2 className="text-3xl font-bold text-purple-600 mb-4 flex items-center gap-2">
              💰 Stats
            </h2>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-200 to-green-300 rounded-2xl p-4 border-3 border-green-500">
                <p className="text-lg font-semibold text-green-800">Balance</p>
                <p className="text-3xl font-black text-green-900">${balance}</p>
              </div>

              <div className="bg-gradient-to-r from-blue-200 to-blue-300 rounded-2xl p-4 border-3 border-blue-500">
                <p className="text-lg font-semibold text-blue-800">Total Drops</p>
                <p className="text-3xl font-black text-blue-900">{stats.totalDrops}</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-2xl p-4 border-3 border-yellow-500">
                <p className="text-lg font-semibold text-yellow-800">Total Winnings</p>
                <p className="text-3xl font-black text-yellow-900">${stats.winnings}</p>
              </div>

              {stats.history.length > 0 && (
                <div className="bg-gray-100 rounded-2xl p-4">
                  <p className="text-lg font-semibold text-gray-700 mb-2">Recent Wins</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.history.map((prize, i) => (
                      <span
                        key={i}
                        className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold"
                      >
                        ${prize}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={resetStats}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-2xl transform hover:scale-105 transition-all border-4 border-red-700 shadow-lg"
              >
                🔄 Reset Stats
              </button>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="lg:col-span-1 relative">
            <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-blue-400">
              <div className="relative bg-gradient-to-b from-sky-200 to-sky-100 rounded-2xl border-4 border-sky-400 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  style={{ maxHeight: '600px' }}
                />

                {/* Prize labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-around p-2 bg-black bg-opacity-50">
                  {settings.prizes.map((prize, i) => (
                    <div
                      key={i}
                      className="text-white font-bold text-xs sm:text-sm text-center"
                      style={{ flex: 1 }}
                    >
                      ${prize}
                    </div>
                  ))}
                </div>

                {/* Last prize notification */}
                {lastPrize !== null && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 border-4 border-yellow-600 rounded-2xl p-6 shadow-2xl animate-pulse">
                    <p className="text-4xl font-black text-yellow-900">
                      +${lastPrize}! 🎉
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => dropBall()}
                disabled={!isReady}
                className="w-full mt-4 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black text-2xl py-4 px-8 rounded-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4 border-green-700 shadow-lg"
              >
                🎯 DROP BALL!
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-pink-400">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold text-pink-600 flex items-center gap-2">
                ⚙️ Settings
              </h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-2xl transform hover:rotate-180 transition-transform"
              >
                {showSettings ? '▲' : '▼'}
              </button>
            </div>

            {showSettings && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🎨 Ball Color
                  </label>
                  <input
                    type="color"
                    value={settings.ballColor}
                    onChange={(e) => updateSettings({ ballColor: e.target.value })}
                    className="w-full h-12 rounded-lg cursor-pointer border-4 border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📏 Ball Size: {settings.ballSize}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={settings.ballSize}
                    onChange={(e) => updateSettings({ ballSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🎯 Peg Color
                  </label>
                  <input
                    type="color"
                    value={settings.pegColor}
                    onChange={(e) => updateSettings({ pegColor: e.target.value })}
                    className="w-full h-12 rounded-lg cursor-pointer border-4 border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📊 Peg Rows: {settings.pegRows}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="12"
                    value={settings.pegRows}
                    onChange={(e) => updateSettings({ pegRows: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🌍 Gravity: {settings.gravity.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.gravity}
                    onChange={(e) => updateSettings({ gravity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                      className="w-6 h-6 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-700">🔊 Sound Effects</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    💵 Prize Values (comma separated)
                  </label>
                  <input
                    type="text"
                    value={settings.prizes.join(',')}
                    onChange={(e) => {
                      const prizes = e.target.value
                        .split(',')
                        .map((v) => parseInt(v.trim()))
                        .filter((v) => !isNaN(v));
                      if (prizes.length > 0) {
                        updateSettings({ prizes });
                      }
                    }}
                    className="w-full px-4 py-2 border-4 border-gray-300 rounded-lg font-mono"
                    placeholder="100,50,25,10,5,10,25,50,100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-white">
          <p className="text-lg font-bold drop-shadow-md">
            🎲 Made with Next.js • Offline Ready • Have Fun! 🎲
          </p>
        </footer>
      </div>
    </div>
  );
}
