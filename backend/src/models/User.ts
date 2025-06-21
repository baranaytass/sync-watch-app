import { Pool } from 'pg';
import { User } from '@sync-watch-app/shared-types';

export class UserModel {
  constructor(private db: Pool) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    const query = `
      SELECT 
        id, google_id as "googleId", email, name, avatar, 
        created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE google_id = $1
    `;
    
    const result = await this.db.query(query, [googleId]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT 
        id, google_id as "googleId", email, name, avatar, 
        created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT 
        id, google_id as "googleId", email, name, avatar, 
        created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE email = $1
    `;
    
    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  async create(userData: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<User> {
    const query = `
      INSERT INTO users (google_id, email, name, avatar)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, google_id as "googleId", email, name, avatar, 
        created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await this.db.query(query, [
      userData.googleId,
      userData.email,
      userData.name,
      userData.avatar || null,
    ]);
    
    return result.rows[0];
  }

  async update(id: string, userData: Partial<{
    email: string;
    name: string;
    avatar: string;
  }>): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (userData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }
    
    if (userData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(userData.name);
    }
    
    if (userData.avatar !== undefined) {
      fields.push(`avatar = $${paramCount++}`);
      values.push(userData.avatar);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, google_id as "googleId", email, name, avatar, 
        created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }
} 