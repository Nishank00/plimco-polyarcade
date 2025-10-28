import { useState, useEffect } from 'react';
import { GameSettings, GameState, BallResult, MULTIPLIERS } from '@/types/game';

const DEFAULT_SETTINGS: GameSettings = {
  rows: 12,
  riskLevel: 'medium',
};

const DEFAULT_GAME_STATE: GameState = {
  balance: 1000,
  currentBet: 10,
  totalWagered: 0,
  totalWon: 0,
  gamesPlayed: 0,
  isPlaying: false,
};

export const useGameState = () => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [recentResults, setRecentResults] = useState<BallResult[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('plinko-settings');
    const savedGameState = localStorage.getItem('plinko-game-state');
    const savedResults = localStorage.getItem('plinko-recent-results');

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }

    if (savedGameState) {
      try {
        setGameState(JSON.parse(savedGameState));
      } catch (e) {
        console.error('Failed to parse game state:', e);
      }
    }

    if (savedResults) {
      try {
        setRecentResults(JSON.parse(savedResults));
      } catch (e) {
        console.error('Failed to parse results:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('plinko-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('plinko-game-state', JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem('plinko-recent-results', JSON.stringify(recentResults));
  }, [recentResults]);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateBet = (amount: number) => {
    if (amount >= 1 && amount <= gameState.balance) {
      setGameState((prev) => ({ ...prev, currentBet: amount }));
    }
  };

  const placeBet = (): number => {
    if (gameState.currentBet > gameState.balance) {
      return 0;
    }

    const betAmount = gameState.currentBet;

    setGameState((prev) => ({
      ...prev,
      balance: prev.balance - betAmount,
      totalWagered: prev.totalWagered + betAmount,
      isPlaying: true,
    }));

    return betAmount;
  };

  const recordResult = (slotIndex: number, betAmount: number) => {
    const multipliers = MULTIPLIERS[settings.riskLevel][settings.rows];
    const multiplier = multipliers[slotIndex];

    let resultToReturn: BallResult | null = null;

    setGameState((prev) => {
      const winAmount = betAmount * multiplier; // Use the bet amount passed in

      const result: BallResult = {
        id: Date.now().toString(),
        multiplier,
        winAmount,
        slotIndex,
      };

      resultToReturn = result;
      setRecentResults((prevResults) => [result, ...prevResults].slice(0, 10));

      return {
        ...prev,
        balance: prev.balance + winAmount,
        totalWon: prev.totalWon + winAmount,
        gamesPlayed: prev.gamesPlayed + 1,
        isPlaying: false,
      };
    });

    return resultToReturn!;
  };

  const reset = () => {
    setGameState(DEFAULT_GAME_STATE);
    setRecentResults([]);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const getMultipliers = () => {
    return MULTIPLIERS[settings.riskLevel][settings.rows];
  };

  return {
    settings,
    gameState,
    recentResults,
    updateSettings,
    updateBet,
    placeBet,
    recordResult,
    reset,
    resetSettings,
    getMultipliers,
  };
};
