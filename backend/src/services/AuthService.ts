import { Pool } from 'pg';
import { UserModel } from '../models/User';
import { User } from '@sync-watch-app/shared-types';
import axios from 'axios';
import { randomUUID } from 'crypto';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export class AuthService {
  private userModel: UserModel;

  constructor(db: Pool) {
    this.userModel = new UserModel(db);
  }

  async findOrCreateUser(googleUserInfo: GoogleUserInfo): Promise<User> {
    // First, try to find user by Google ID
    let user = await this.userModel.findByGoogleId(googleUserInfo.id);
    
    if (user) {
      // Update user info if it has changed
      const updateData: Partial<{
        email: string;
        name: string;
        avatar: string;
      }> = {};

      if (user.email !== googleUserInfo.email) {
        updateData.email = googleUserInfo.email;
      }
      
      if (user.name !== googleUserInfo.name) {
        updateData.name = googleUserInfo.name;
      }
      
      if (googleUserInfo.picture && user.avatar !== googleUserInfo.picture) {
        updateData.avatar = googleUserInfo.picture;
      }

      if (Object.keys(updateData).length > 0) {
        user = await this.userModel.update(user.id, updateData);
      }

      return user!;
    }

    // Check if user exists with same email (account linking)
    const existingUser = await this.userModel.findByEmail(googleUserInfo.email);
    if (existingUser) {
      // Link Google account to existing user
      const updateData: Partial<{
        email: string;
        name: string;
        avatar: string;
      }> = {
        name: googleUserInfo.name,
      };
      
      if (googleUserInfo.picture) {
        updateData.avatar = googleUserInfo.picture;
      }
      
      const updatedUser = await this.userModel.update(existingUser.id, updateData);
      return updatedUser!;
    }

    // Create new user
    const createData: {
      googleId: string;
      email: string;
      name: string;
      avatar?: string;
    } = {
      googleId: googleUserInfo.id,
      email: googleUserInfo.email,
      name: googleUserInfo.name,
    };
    
    if (googleUserInfo.picture) {
      createData.avatar = googleUserInfo.picture;
    }
    
    const newUser = await this.userModel.create(createData);

    return newUser;
  }

  async findOrCreateGuestUser(): Promise<User> {
    const guestEmail = 'guest@example.com';
    let guestUser = await this.userModel.findByEmail(guestEmail);

    if (guestUser) {
      return guestUser;
    }

    const newGuest = await this.userModel.create({
      googleId: `guest_${Date.now()}`,
      email: guestEmail,
      name: 'Misafir Kullanıcı',
    });

    return newGuest;
  }

  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data as GoogleUserInfo;
    } catch (error) {
      console.error('Failed to fetch Google user info:', error);
      throw new Error('Failed to fetch user information from Google');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findByEmail(email);
  }

  async createGuestUser(name: string = 'Guest User'): Promise<User> {
    // Generate unique identifiers for guest user
    const uuid = randomUUID();

    const guestGoogleId = `guest_${uuid}`;
    const guestEmail = `guest_${uuid}@guest.local`;

    // Create a new guest user record
    const guestUser = await this.userModel.create({
      googleId: guestGoogleId,
      email: guestEmail,
      name,
      avatar: '',
    });

    return guestUser;
  }
} 