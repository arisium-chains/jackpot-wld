#!/bin/bash

# Draw Automation Wrapper Script
# This script can be scheduled via cron to automatically check and execute draws
# Usage: ./scripts/draw-automation.sh [--dry-run] [--network NETWORK] [--log-file LOG_FILE]

set -e

# Default configuration
NETWORK="local"
LOG_FILE="/tmp/draw-automation.log"
DRY_RUN_ONLY=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN_ONLY=true
            shift
            ;;
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --log-file)
            LOG_FILE="$2"
            shift 2
            ;;
        *)
            # For backward compatibility, treat first positional arg as network
            if [ "$NETWORK" = "local" ]; then
                NETWORK="$1"
            fi
            shift
            ;;
    esac
done

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if required environment variables are set
check_env() {
    if [ "$NETWORK" != "local" ] && [ -z "$PRIVATE_KEY" ]; then
        error_exit "PRIVATE_KEY environment variable is required for non-local networks"
    fi
    
    if [ "$NETWORK" = "sepolia" ] && [ -z "$NEXT_PUBLIC_WORLDCHAIN_SEPOLIA_RPC_URL" ]; then
        error_exit "NEXT_PUBLIC_WORLDCHAIN_SEPOLIA_RPC_URL environment variable is required for sepolia network"
    fi
}

# Main automation logic
main() {
    log "Starting draw automation for network: $NETWORK"
    
    # Change to project directory
    cd "$PROJECT_DIR" || error_exit "Failed to change to project directory: $PROJECT_DIR"
    
    # Check environment
    check_env
    
    # Load environment variables if .env exists
    if [ -f ".env" ]; then
        log "Loading environment variables from .env"
        set -a
        source .env
        set +a
    fi
    
    # First, do a dry run to check conditions
    log "Performing dry run check..."
    if ! pnpm draw:tick --network "$NETWORK" --dry-run 2>&1 | tee -a "$LOG_FILE"; then
        error_exit "Dry run failed"
    fi
    
    # If this is a dry-run-only execution, exit here
    if [ "$DRY_RUN_ONLY" = true ]; then
        log "Dry run completed successfully (dry-run-only mode)"
        return 0
    fi
    
    # Check if draw is actually needed by parsing the dry run output
    DRY_RUN_OUTPUT=$(pnpm draw:tick --network "$NETWORK" --dry-run 2>&1)
    
    if echo "$DRY_RUN_OUTPUT" | grep -q "Draw conditions met!"; then
        log "Draw conditions met! Executing draw..."
        
        # Execute the actual draw
        if pnpm draw:tick --network "$NETWORK" 2>&1 | tee -a "$LOG_FILE"; then
            log "Draw executed successfully!"
            
            # Optional: Send notification (uncomment and configure as needed)
            # notify_success
        else
            error_exit "Draw execution failed"
        fi
    elif echo "$DRY_RUN_OUTPUT" | grep -q "Draw not yet due\|No participants\|No prize balance"; then
        log "Draw not needed at this time"
    else
        log "Unexpected dry run output, please check manually"
    fi
    
    log "Draw automation completed successfully"
}

# Optional notification functions (customize as needed)
notify_success() {
    # Example: Send Slack notification
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"🎉 Draw executed successfully on '$NETWORK' network!"}' \
    #   "$SLACK_WEBHOOK_URL"
    
    # Example: Send email
    # echo "Draw executed successfully on $NETWORK network at $(date)" | \
    #   mail -s "Prize Pool Draw Executed" "$NOTIFICATION_EMAIL"
    
    log "Notification sent (if configured)"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    # Add any cleanup logic here
}

# Set up signal handlers
trap cleanup EXIT
trap 'error_exit "Script interrupted"' INT TERM

# Run main function
main "$@"