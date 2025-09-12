-- Migration script to add proof_image column to transactions table and create user_wallets table
-- Run this script on your Railway database

-- Add proof_image column to transactions table
ALTER TABLE transactions 
ADD COLUMN proof_image VARCHAR(255) NULL AFTER description;

-- Update transactions table status enum to include verified and rejected
ALTER TABLE transactions 
MODIFY COLUMN status ENUM('pending', 'completed', 'failed', 'cancelled', 'verified', 'rejected') DEFAULT 'completed';

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_wallet (user_id),
    INDEX idx_user_id (user_id)
);

-- Initialize user_wallets for existing users
INSERT INTO user_wallets (user_id, balance)
SELECT user_id, account_balance 
FROM users 
WHERE user_id NOT IN (SELECT user_id FROM user_wallets);

-- Create uploads directory structure (this needs to be done manually on the server)
-- mkdir -p /uploads/proofs/
-- chmod 755 /uploads/proofs/
