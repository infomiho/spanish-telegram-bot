import pg from "pg";
import { CREATE_USERS_TABLE, CREATE_INDEXES } from "./schema.js";
import type {
  User,
  CreateUserInput,
  UpdateUserSettings,
  Difficulty,
} from "../types/index.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function initializeDatabase(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(CREATE_USERS_TABLE);
    await client.query(CREATE_INDEXES);
    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const result = await getPool().query<User>(
    `INSERT INTO users (chat_id, username)
     VALUES ($1, $2)
     ON CONFLICT (chat_id) DO UPDATE SET username = $2
     RETURNING *`,
    [input.chat_id, input.username]
  );
  return result.rows[0];
}

export async function getUser(chatId: number): Promise<User | null> {
  const result = await getPool().query<User>(
    "SELECT * FROM users WHERE chat_id = $1",
    [chatId]
  );
  return result.rows[0] || null;
}

export async function updateUserSettings(
  chatId: number,
  settings: UpdateUserSettings
): Promise<User | null> {
  const updates: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (settings.preferred_hour !== undefined) {
    updates.push(`preferred_hour = $${paramIndex++}`);
    values.push(settings.preferred_hour);
  }
  if (settings.timezone !== undefined) {
    updates.push(`timezone = $${paramIndex++}`);
    values.push(settings.timezone);
  }
  if (settings.difficulty !== undefined) {
    updates.push(`difficulty = $${paramIndex++}`);
    values.push(settings.difficulty);
  }

  if (updates.length === 0) {
    return getUser(chatId);
  }

  values.push(chatId);
  const result = await getPool().query<User>(
    `UPDATE users SET ${updates.join(", ")} WHERE chat_id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function updateLastPrompt(
  chatId: number,
  prompt: string
): Promise<void> {
  await getPool().query(
    "UPDATE users SET last_prompt = $1, last_prompt_at = CURRENT_TIMESTAMP WHERE chat_id = $2",
    [prompt, chatId]
  );
}

export async function getUsersDueForPrompt(hour: number): Promise<User[]> {
  const result = await getPool().query<User>(
    `SELECT * FROM users
     WHERE preferred_hour = $1
     AND (last_prompt_at IS NULL OR last_prompt_at < CURRENT_DATE)`,
    [hour]
  );
  return result.rows;
}

export async function getAllUsers(): Promise<User[]> {
  const result = await getPool().query<User>("SELECT * FROM users");
  return result.rows;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
