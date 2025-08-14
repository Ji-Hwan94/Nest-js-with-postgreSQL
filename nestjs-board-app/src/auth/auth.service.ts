import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentialDto: AuthCredentialDto): Promise<void> {
    return this.userRepository.createUser(authCredentialDto);
  }

  async signIn(
    authCredentialDto: AuthCredentialDto,
  ): Promise<{ accessToken: string }> {
    const result = await this.userRepository.signIn(authCredentialDto);

    if (!result) {
      throw new UnauthorizedException('login failed');
    }

    // 토큰 생성 (Secret + Payload)
    // 토큰 payload에 넣을 데이터
    const payload = { username: authCredentialDto.username };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
