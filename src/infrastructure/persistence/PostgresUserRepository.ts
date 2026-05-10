import { Pool } from 'pg';

import { User, UserRole } from '#domain/entities/User.js';
import { UserRepository } from '#domain/repositories/userRepository.js';

interface UserRow {
  created_at: Date;
  email: string;
  first_name: string;
  id: string;
  last_name: string | null;
  password_hash: string;
  role: string;
}

function rowToUser(row: UserRow): User {
  return new User(row.id, row.email, row.password_hash, row.first_name, row.last_name, row.role as UserRole, row.created_at);
}

export class PostgresUserRepository implements UserRepository {
  constructor(private pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, first_name, last_name, role, email, password_hash, created_at
       FROM "user" WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) return null;
    return rowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, first_name, last_name, role, email, password_hash, created_at
       FROM "user" WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return rowToUser(result.rows[0]);
  }
}
