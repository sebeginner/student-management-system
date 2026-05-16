import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser, JwtPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      access_token: accessToken,
      tokenType: 'Bearer',
      expiresIn: 8 * 60 * 60,
      user: this.toAuthenticatedUser(user),
    };
  }

  logout() {
    return { message: 'Logout success' };
  }

  getProfile(user: AuthenticatedUser) {
    return user;
  }

  private toAuthenticatedUser(user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: { name: string };
    studentId: number | null;
    teacherId: number | null;
  }): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      studentId: user.studentId,
      teacherId: user.teacherId,
    };
  }
}
