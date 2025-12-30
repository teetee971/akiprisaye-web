/**
 * User Model
 * Minimal data collection - only what's strictly necessary
 */

export interface User {
  id: string;
  email: string;
  territory: string;
  role: 'citizen' | 'pro' | 'org';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  territory: string;
  role: 'citizen' | 'pro' | 'org';
}

// In-memory store for demo (replace with actual database)
const users: Map<string, User> = new Map();

export class UserModel {
  static async create(data: CreateUserDTO): Promise<User> {
    const id = `user_${Date.now()}`;
    const user: User = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    users.set(id, user);
    return user;
  }

  static async findByEmail(email: string): Promise<User | null> {
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  static async findById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }

  static async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = users.get(id);
    if (!user) return null;

    const updated: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };
    
    users.set(id, updated);
    return updated;
  }
}

export default UserModel;
