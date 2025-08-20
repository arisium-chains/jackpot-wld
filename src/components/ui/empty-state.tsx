import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { 
  Inbox, 
  Search, 
  Wifi, 
  Database, 
  FileX, 
  Users, 
  Trophy,
  Coins,
  History
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios
function NoTransactionsEmpty({ onDeposit }: { onDeposit?: () => void }) {
  return (
    <EmptyState
      icon={History}
      title="No transactions yet"
      description="Your transaction history will appear here once you start depositing or withdrawing."
      action={onDeposit ? {
        label: 'Make your first deposit',
        onClick: onDeposit,
      } : undefined}
    />
  );
}

function NoDepositsEmpty({ onDeposit }: { onDeposit?: () => void }) {
  return (
    <EmptyState
      icon={Coins}
      title="No deposits found"
      description="Start earning yield and participating in prize draws by making your first deposit."
      action={onDeposit ? {
        label: 'Deposit now',
        onClick: onDeposit,
      } : undefined}
    />
  );
}

function NoPrizesEmpty() {
  return (
    <EmptyState
      icon={Trophy}
      title="No prizes won yet"
      description="Keep your deposits active to participate in daily prize draws. The more you deposit, the higher your chances!"
    />
  );
}

function NoSearchResultsEmpty({ 
  searchTerm, 
  onClear 
}: { 
  searchTerm: string; 
  onClear?: () => void; 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${searchTerm}". Try adjusting your search terms.`}
      action={onClear ? {
        label: 'Clear search',
        onClick: onClear,
        variant: 'outline',
      } : undefined}
    />
  );
}

function ConnectionErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={Wifi}
      title="Connection error"
      description="Unable to load data. Please check your internet connection and try again."
      action={onRetry ? {
        label: 'Try again',
        onClick: onRetry,
      } : undefined}
    />
  );
}

function DataErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={Database}
      title="Failed to load data"
      description="Something went wrong while loading the data. Please try again."
      action={onRetry ? {
        label: 'Retry',
        onClick: onRetry,
      } : undefined}
    />
  );
}

function NotFoundEmpty({ 
  title = "Page not found", 
  description = "The page you're looking for doesn't exist or has been moved.",
  onGoHome 
}: { 
  title?: string;
  description?: string;
  onGoHome?: () => void; 
}) {
  return (
    <EmptyState
      icon={FileX}
      title={title}
      description={description}
      action={onGoHome ? {
        label: 'Go home',
        onClick: onGoHome,
      } : undefined}
    />
  );
}

function UnauthorizedEmpty({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Access restricted"
      description="You need to connect your wallet and verify with World ID to access this feature."
      action={onSignIn ? {
        label: 'Connect wallet',
        onClick: onSignIn,
      } : undefined}
    />
  );
}

export {
  EmptyState,
  NoTransactionsEmpty,
  NoDepositsEmpty,
  NoPrizesEmpty,
  NoSearchResultsEmpty,
  ConnectionErrorEmpty,
  DataErrorEmpty,
  NotFoundEmpty,
  UnauthorizedEmpty,
};