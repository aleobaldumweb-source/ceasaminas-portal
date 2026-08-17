import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { MailService } from './mail.service.js';
import { Client } from 'ldapts';
import { DIRECTORY_CLIENT_FACTORY, DirectoryAuthService } from './directory-auth.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    {
      provide: DIRECTORY_CLIENT_FACTORY,
      useValue: (options: ConstructorParameters<typeof Client>[0]) => new Client(options),
    },
    DirectoryAuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
