import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, pass: string) {
    // 1. Tìm user trong DB
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu'); // Error handling 401
    }

    // 2. So sánh mật khẩu (dùng bcrypt để so sánh chuỗi mã hóa)
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // 3. Tạo JWT Token
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role.name,
    };

    // TODO: Bổ sung Logger tại đây để ghi nhận đăng nhập thành công

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role.name,
      },
    };
  }
}
