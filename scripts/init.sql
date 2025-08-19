-- Database initialization script for PoolTogether Worldcoin Miniapp
-- This script will be executed when the PostgreSQL container starts

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)

-- Create tables for application data (optional - can be used for analytics/caching)
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL UNIQUE,
    total_deposited DECIMAL(78, 0) DEFAULT 0,
    total_withdrawn DECIMAL(78, 0) DEFAULT 0,
    lottery_wins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lottery_draws (
    id SERIAL PRIMARY KEY,
    draw_id INTEGER NOT NULL UNIQUE,
    prize_amount DECIMAL(78, 0) NOT NULL,
    winner_address VARCHAR(42),
    participants_count INTEGER DEFAULT 0,
    draw_time TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    user_address VARCHAR(42) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdraw', 'prize_won'
    amount DECIMAL(78, 0) NOT NULL,
    block_number BIGINT,
    timestamp TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_stats_address ON user_stats(user_address);
CREATE INDEX IF NOT EXISTS idx_lottery_draws_draw_id ON lottery_draws(draw_id);
CREATE INDEX IF NOT EXISTS idx_lottery_draws_time ON lottery_draws(draw_time);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_stats table
CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON user_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();