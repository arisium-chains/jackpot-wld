'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NoTransactionsEmpty, NoSearchResultsEmpty } from './ui/empty-state';
import { TableSkeleton } from './ui/skeleton';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trophy, 
  Coins, 
  Search, 
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-react';
import { formatEther } from 'viem';
import { useToast } from '@/hooks/useToast';

export interface EventHistoryItem {
  id: string;
  type: 'deposit' | 'withdraw' | 'prize_won' | 'harvest' | 'draw';
  amount?: bigint;
  hash?: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  description?: string;
  blockNumber?: number;
}

interface EventHistoryProps {
  events: EventHistoryItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const EVENT_ICONS = {
  deposit: ArrowUpCircle,
  withdraw: ArrowDownCircle,
  prize_won: Trophy,
  harvest: Coins,
  draw: Coins,
} as const;

const EVENT_COLORS = {
  deposit: 'text-green-600',
  withdraw: 'text-red-600',
  prize_won: 'text-yellow-600',
  harvest: 'text-blue-600',
  draw: 'text-purple-600',
} as const;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
} as const;

function formatEventType(type: EventHistoryItem['type']): string {
  switch (type) {
    case 'deposit':
      return 'Deposit';
    case 'withdraw':
      return 'Withdraw';
    case 'prize_won':
      return 'Prize Won';
    case 'harvest':
      return 'Yield Harvest';
    case 'draw':
      return 'Prize Draw';
    default:
      return 'Unknown';
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

export function EventHistory({ 
  events, 
  isLoading = false, 
  onRefresh,
  className 
}: EventHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EventHistoryItem['type'] | 'all'>('all');
  const [filteredEvents, setFilteredEvents] = useState<EventHistoryItem[]>(events);
  const { info } = useToast();

  // Filter events based on search and filter criteria
  useEffect(() => {
    let filtered = events;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        formatEventType(event.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.hash?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredEvents(filtered);
  }, [events, searchTerm, filterType]);

  const handleViewTransaction = (hash: string) => {
    window.open(`https://worldscan.org/tx/${hash}`, '_blank');
    info('Opening transaction in explorer');
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilterType('all');
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Event History</h3>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <TableSkeleton rows={5} columns={1} />
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Event History</h3>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EventHistoryItem['type'] | 'all')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Events</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
            <option value="prize_won">Prizes</option>
            <option value="harvest">Harvests</option>
            <option value="draw">Draws</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          searchTerm || filterType !== 'all' ? (
            <NoSearchResultsEmpty 
              searchTerm={searchTerm || `${filterType} events`}
              onClear={clearSearch}
            />
          ) : (
            <NoTransactionsEmpty />
          )
        ) : (
          filteredEvents.map((event) => {
            const Icon = EVENT_ICONS[event.type];
            const iconColor = EVENT_COLORS[event.type];
            const statusColor = STATUS_COLORS[event.status];

            return (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {formatEventType(event.type)}
                      </span>
                      <Badge className={statusColor}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.description || 'No description'}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(event.timestamp)}
                      </div>
                      {event.blockNumber && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Block {event.blockNumber.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {event.amount && (
                    <div className="text-right">
                      <div className="font-medium">
                        {event.type === 'withdraw' ? '-' : '+'}
                        {parseFloat(formatEther(event.amount)).toFixed(4)} WLD
                      </div>
                    </div>
                  )}
                  {event.hash && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTransaction(event.hash!)}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}