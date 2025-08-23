# Automation System

## Overview

The Jackpot WLD system includes a comprehensive automation framework that handles lottery draws, yield harvesting, and system maintenance operations. The automation system ensures reliable, timely operations without manual intervention while providing monitoring and error recovery capabilities.

## Core Components

### 1. Draw Automation Script (`draw-tick.ts`)

The main automation script handles lottery draw scheduling and execution.

#### Key Responsibilities

- **Draw condition validation** - Check prerequisites for lottery draws
- **Randomness request management** - Coordinate with Chainlink VRF
- **Winner selection processing** - Execute winner selection logic
- **Prize distribution** - Ensure prizes are distributed correctly
- **Error handling and recovery** - Handle failures gracefully
- **Logging and monitoring** - Provide detailed operation logs

#### Script Architecture

```typescript
interface DrawTickConfig {
  poolContract: Address;
  prizePool: Address;
  vrfConsumer: Address;
  minPrizeThreshold: bigint;
  maxParticipants: number;
  drawInterval: number;
}

class DrawTick {
  private config: DrawTickConfig;
  private logger: Logger;
  private metrics: MetricsCollector;

  async executeDraw(): Promise<DrawResult> {
    try {
      // 1. Validate draw conditions
      const canDraw = await this.validateDrawConditions();
      if (!canDraw) return { success: false, reason: "Conditions not met" };

      // 2. Initiate draw process
      const drawId = await this.initiateDraw();

      // 3. Monitor VRF response
      const randomness = await this.waitForRandomness(drawId);

      // 4. Execute winner selection
      const winner = await this.selectWinner(randomness);

      // 5. Distribute prize
      await this.distributePrize(winner);

      return { success: true, winner, drawId };
    } catch (error) {
      await this.handleError(error);
      return { success: false, error };
    }
  }
}
```

### 2. Shell Automation Wrapper (`draw-automation.sh`)

Provides system-level integration and error recovery mechanisms.

```bash
#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/logs/draw-automation.log"
PID_FILE="${SCRIPT_DIR}/automation.pid"
MAX_RETRIES=3
RETRY_DELAY=30

# Function: Execute draw with retry logic
execute_draw() {
    local retries=0

    while [ $retries -lt $MAX_RETRIES ]; do
        echo "$(date): Attempting draw execution (attempt $((retries + 1)))" >> "$LOG_FILE"

        if npm run draw:tick; then
            echo "$(date): Draw execution successful" >> "$LOG_FILE"
            return 0
        else
            echo "$(date): Draw execution failed (attempt $((retries + 1)))" >> "$LOG_FILE"
            retries=$((retries + 1))

            if [ $retries -lt $MAX_RETRIES ]; then
                echo "$(date): Retrying in ${RETRY_DELAY} seconds..." >> "$LOG_FILE"
                sleep $RETRY_DELAY
            fi
        fi
    done

    echo "$(date): All retry attempts failed" >> "$LOG_FILE"
    return 1
}

# Function: Health check
health_check() {
    # Check if contracts are responsive
    if ! npm run health:check; then
        echo "$(date): Health check failed" >> "$LOG_FILE"
        return 1
    fi

    return 0
}

# Main execution
main() {
    # Ensure only one instance is running
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "$(date): Automation already running" >> "$LOG_FILE"
        exit 1
    fi

    # Store PID
    echo $$ > "$PID_FILE"

    # Perform health check
    if ! health_check; then
        echo "$(date): Health check failed, aborting" >> "$LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi

    # Execute draw
    execute_draw
    local exit_code=$?

    # Cleanup
    rm -f "$PID_FILE"
    exit $exit_code
}

# Trap signals for graceful shutdown
trap 'rm -f "$PID_FILE"; exit 130' INT TERM

main "$@"
```

### 3. Cron Job Configuration

Scheduled execution of automation scripts with proper error handling.

#### Example Cron Configuration (`cron-example.txt`)

```cron
# Run lottery draw every day at 12:00 UTC
0 12 * * * /path/to/project/scripts/draw-automation.sh >> /var/log/lottery-draw.log 2>&1

# Run yield harvest every 4 hours
0 */4 * * * /path/to/project/scripts/harvest-automation.sh >> /var/log/yield-harvest.log 2>&1

# Health check every 15 minutes
*/15 * * * * /path/to/project/scripts/health-check.sh >> /var/log/health-check.log 2>&1

# Log rotation weekly
0 0 * * 0 /usr/sbin/logrotate /path/to/project/config/logrotate.conf
```

## Automation Features

### 1. Draw Condition Validation

#### Prerequisites Check

```typescript
async validateDrawConditions(): Promise<boolean> {
  const checks = [
    this.checkMinimumPrize(),
    this.checkParticipantCount(),
    this.checkTimingInterval(),
    this.checkContractStatus(),
    this.checkVRFAvailability()
  ];

  const results = await Promise.all(checks);
  return results.every(result => result === true);
}

// Individual validation functions
async checkMinimumPrize(): Promise<boolean> {
  const currentPrize = await this.prizePool.getCurrentPrize();
  return currentPrize >= this.config.minPrizeThreshold;
}

async checkParticipantCount(): Promise<boolean> {
  const participantCount = await this.prizePool.getParticipantCount();
  return participantCount > 0 && participantCount <= this.config.maxParticipants;
}

async checkTimingInterval(): Promise<boolean> {
  const lastDrawTime = await this.prizePool.getLastDrawTime();
  const timeSinceLastDraw = Date.now() - lastDrawTime;
  return timeSinceLastDraw >= this.config.drawInterval;
}
```

### 2. Error Handling and Recovery

#### Automatic Recovery Mechanisms

```typescript
class ErrorHandler {
  async handleDrawError(error: Error): Promise<void> {
    const errorType = this.classifyError(error);

    switch (errorType) {
      case "VRF_TIMEOUT":
        await this.retryVRFRequest();
        break;

      case "INSUFFICIENT_GAS":
        await this.adjustGasPrice();
        break;

      case "CONTRACT_PAUSED":
        await this.notifyAdministrators();
        break;

      case "NETWORK_ERROR":
        await this.switchRPCProvider();
        break;

      default:
        await this.escalateToManualIntervention();
    }
  }

  private classifyError(error: Error): ErrorType {
    if (error.message.includes("timeout")) return "VRF_TIMEOUT";
    if (error.message.includes("gas")) return "INSUFFICIENT_GAS";
    if (error.message.includes("paused")) return "CONTRACT_PAUSED";
    if (error.message.includes("network")) return "NETWORK_ERROR";
    return "UNKNOWN";
  }
}
```

### 3. Monitoring and Alerting

#### Metrics Collection

```typescript
interface DrawMetrics {
  drawId: string;
  timestamp: number;
  participantCount: number;
  prizeAmount: bigint;
  winner: Address;
  vrfRequestTime: number;
  vrfFulfillmentTime: number;
  totalExecutionTime: number;
  gasUsed: bigint;
  success: boolean;
  errorReason?: string;
}

class MetricsCollector {
  async recordDrawMetrics(metrics: DrawMetrics): Promise<void> {
    // Store in database
    await this.database.saveDrawMetrics(metrics);

    // Send to monitoring service
    await this.monitoring.sendMetrics(metrics);

    // Update dashboards
    await this.updateDashboards(metrics);
  }

  async generateHealthReport(): Promise<HealthReport> {
    const recentDraws = await this.getRecentDraws(24); // Last 24 hours
    const successRate = this.calculateSuccessRate(recentDraws);
    const avgExecutionTime = this.calculateAverageExecutionTime(recentDraws);

    return {
      successRate,
      avgExecutionTime,
      totalDraws: recentDraws.length,
      lastDraw: recentDraws[0],
      alerts: this.generateAlerts(recentDraws),
    };
  }
}
```

## Yield Harvesting Automation

### 1. Harvest Scheduling

#### Automatic Trigger Conditions

- **Threshold-based**: When accumulated yield exceeds minimum threshold
- **Time-based**: Regular harvesting at specified intervals
- **Event-based**: Triggered by deposits or withdrawals
- **Manual**: Administrative override capability

```typescript
class YieldHarvestAutomation {
  async checkHarvestConditions(): Promise<boolean> {
    const conditions = await Promise.all([
      this.checkYieldThreshold(),
      this.checkTimeInterval(),
      this.checkGasPrice(),
      this.checkAdapterHealth(),
    ]);

    return conditions.every((condition) => condition);
  }

  async executeHarvest(): Promise<HarvestResult> {
    try {
      // 1. Calculate expected yield
      const expectedYield = await this.yieldAdapter.getHarvestableAmount();

      // 2. Execute harvest
      const tx = await this.yieldAdapter.harvest();

      // 3. Verify harvest amount
      const actualYield = await this.verifyHarvestAmount(tx);

      // 4. Fund prize pool
      await this.fundPrizePool(actualYield);

      return { success: true, amount: actualYield, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### 2. Yield Optimization

#### Dynamic Strategy Adjustment

```typescript
class YieldOptimizer {
  async optimizeStrategy(): Promise<void> {
    const currentAPY = await this.getCurrentAPY();
    const marketConditions = await this.analyzeMarketConditions();

    if (this.shouldRebalance(currentAPY, marketConditions)) {
      await this.rebalancePositions();
    }
  }

  private shouldRebalance(apy: number, conditions: MarketConditions): boolean {
    return (
      apy < this.config.minAPY ||
      conditions.volatility > this.config.maxVolatility ||
      conditions.liquidity < this.config.minLiquidity
    );
  }
}
```

## CLI Tools

### 1. Administrative Commands

#### Draw Management

```bash
# Manual draw execution
npm run draw:execute

# Check draw conditions
npm run draw:check

# View draw history
npm run draw:history

# Cancel pending draw
npm run draw:cancel
```

#### Yield Management

```bash
# Manual harvest
npm run harvest:execute

# Check harvest conditions
npm run harvest:check

# View yield statistics
npm run harvest:stats

# Optimize yield strategy
npm run harvest:optimize
```

### 2. System Monitoring

#### Health Check Commands

```bash
# Overall system health
npm run health:check

# Contract status
npm run health:contracts

# External service status
npm run health:services

# Performance metrics
npm run health:metrics
```

## Configuration

### 1. Automation Configuration

```typescript
interface AutomationConfig {
  draws: {
    interval: number; // Seconds between draws
    minPrize: bigint; // Minimum prize for draw
    maxRetries: number;
    vrfTimeout: number;
  };
  harvesting: {
    threshold: bigint; // Minimum yield to harvest
    interval: number; // Maximum time between harvests
    gasPrice: {
      max: bigint; // Maximum gas price
      strategy: "fixed" | "dynamic";
    };
  };
  monitoring: {
    healthCheckInterval: number;
    alertThresholds: {
      successRate: number; // Minimum success rate
      avgExecutionTime: number; // Maximum execution time
    };
  };
}
```

### 2. Environment Variables

```bash
# Automation Settings
AUTO_DRAW_ENABLED=true
AUTO_HARVEST_ENABLED=true
DRAW_INTERVAL=86400  # 24 hours
HARVEST_THRESHOLD=1000000000000000000  # 1 WLD

# Monitoring
HEALTH_CHECK_INTERVAL=900  # 15 minutes
ALERT_WEBHOOK_URL=https://your-monitoring-service.com/webhook

# Error Recovery
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY=30
ESCALATION_THRESHOLD=5
```

## Deployment and Management

### 1. Setup Instructions

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Deploy automation scripts
npm run deploy:automation

# Setup cron jobs
npm run setup:cron
```

### 2. Monitoring Setup

```bash
# Start monitoring services
npm run start:monitoring

# View real-time logs
npm run logs:tail

# Generate reports
npm run reports:generate
```

This automation system ensures reliable, efficient operation of the lottery system while providing comprehensive monitoring, error recovery, and administrative control capabilities.
