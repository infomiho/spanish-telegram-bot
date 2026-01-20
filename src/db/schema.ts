export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    chat_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    preferred_hour INTEGER DEFAULT 8 CHECK (preferred_hour >= 0 AND preferred_hour <= 23),
    timezone VARCHAR(50) DEFAULT 'UTC',
    difficulty VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    last_prompt TEXT,
    last_prompt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_users_preferred_hour ON users(preferred_hour);
`;
