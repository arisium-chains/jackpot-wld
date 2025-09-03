'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { usePrizePool } from '../hooks/useContracts';
import { formatEther } from 'viem';
import { UPDATE_INTERVALS, NOTIFICATION_TIMING, ANIMATION_TIMING, DRAW_INTERVAL, formatTimeRemaining } from '../config/timing';

interface Winner {
  address: string;
  amount: string;
  drawId: number;
  timestamp: Date;
}

interface LotteryDrawManagerProps {
  className?: string;
}

const LotteryDrawManager: React.FC<LotteryDrawManagerProps> = ({
  className = ''
}) => {
  const { address } = useAccount();
  const { currentPrizeAmount, nextDrawTime } = usePrizePool();
  const [isDrawing, setIsDrawing] = useState(false);
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [timeUntilDraw, setTimeUntilDraw] = useState<string>('');
  const [showWinnerNotification, setShowWinnerNotification] = useState(false);
  const [latestWinner, setLatestWinner] = useState<Winner | null>(null);
  const [mockNextDrawTime, setMockNextDrawTime] = useState<number>(Date.now() + DRAW_INTERVAL.MILLISECONDS);

  // Mock recent winners data
  useEffect(() => {
    const mockWinners: Winner[] = [
      {
        address: '0x1234...5678',
        amount: '125.50',
        drawId: 1,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        address: '0xabcd...efgh',
        amount: '89.25',
        drawId: 2,
        timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000) // 26 hours ago
      },
      {
        address: '0x9876...4321',
        amount: '203.75',
        drawId: 3,
        timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000) // 50 hours ago
      }
    ];
    setRecentWinners(mockWinners);
  }, []);

  const handleAutomaticDraw = useCallback(async () => {
    if (isDrawing) return;
    
    setIsDrawing(true);
    
    try {
      // Simulate draw process
      await new Promise(resolve => setTimeout(resolve, ANIMATION_TIMING.DRAW_SIMULATION));
      
      // Mock winner selection
      const mockWinner: Winner = {
        address: address || '0x1234...5678',
        amount: currentPrizeAmount ? formatEther(currentPrizeAmount) : '150.00',
        drawId: Math.floor(Math.random() * 100) + 1,
        timestamp: new Date()
      };
      
      setLatestWinner(mockWinner);
      setRecentWinners(prev => [mockWinner, ...prev.slice(0, 4)]);
      
      // Show winner notification
      setShowWinnerNotification(true);
      setTimeout(() => setShowWinnerNotification(false), NOTIFICATION_TIMING.WINNER_DISPLAY_DURATION);
      
      // Set next draw time to 5 minutes from now
      setMockNextDrawTime(Date.now() + DRAW_INTERVAL.MILLISECONDS);
      
    } catch (error) {
      console.error('Draw failed:', error);
    } finally {
      setIsDrawing(false);
    }
  }, [isDrawing, setLatestWinner, setRecentWinners, setShowWinnerNotification, address, currentPrizeAmount]);

  const handleManualDraw = useCallback(() => {
    if (!isDrawing) {
      handleAutomaticDraw();
    }
  }, [isDrawing, handleAutomaticDraw]);

  // Calculate time until next draw
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const difference = mockNextDrawTime - now;

      if (difference > 0) {
        setTimeUntilDraw(formatTimeRemaining(difference));
      } else {
        setTimeUntilDraw('Draw in progress...');
        // Trigger automatic draw when time is up
        if (!isDrawing) {
          handleAutomaticDraw();
        }
      }
    };

    const interval = setInterval(updateCountdown, UPDATE_INTERVALS.COUNTDOWN);
    updateCountdown();

    return () => clearInterval(interval);
  }, [mockNextDrawTime, isDrawing, handleAutomaticDraw]);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Winner Notification */}
      {showWinnerNotification && latestWinner && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-lg shadow-lg max-w-sm animate-bounce">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎉</div>
            <div>
              <h4 className="font-bold text-lg">Winner Announced!</h4>
              <p className="text-sm opacity-90">
                {latestWinner.address === address ? 'You won' : 'Winner'}: {latestWinner.amount} WLD
              </p>
              <p className="text-xs opacity-75">
                Draw #{latestWinner.drawId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Draw Status Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lottery Draw Status</h3>
          <div className="flex items-center space-x-2">
            {isDrawing ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Drawing...</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Ready</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Current Prize */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Prize</p>
            <p className="text-2xl font-bold text-purple-600">
              {currentPrizeAmount ? `${parseFloat(formatEther(currentPrizeAmount)).toFixed(2)} WLD` : '0 WLD'}
            </p>
          </div>

          {/* Next Draw */}
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Next Draw In</p>
            <p className="text-xl font-bold text-green-600 font-mono">
              {timeUntilDraw || 'Loading...'}
            </p>
          </div>

          {/* Draw ID */}
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Draw</p>
            <p className="text-2xl font-bold text-orange-600">
              #1
            </p>
          </div>
        </div>

        {/* Manual Draw Button */}
        <div className="text-center">
          <button
            onClick={handleManualDraw}
            disabled={isDrawing}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isDrawing ? 'Drawing in Progress...' : 'Trigger Manual Draw'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            For testing purposes only
          </p>
        </div>
      </div>

      {/* Recent Winners */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Winners</h3>
        
        {recentWinners.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent winners</p>
        ) : (
          <div className="space-y-3">
            {recentWinners.map((winner, index) => (
              <div key={`${winner.drawId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {winner.address === address ? 'You' : winner.address}
                      </span>
                      {winner.address === address && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          You!
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Draw #{winner.drawId} • {formatTimestamp(winner.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    +{winner.amount} WLD
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LotteryDrawManager;