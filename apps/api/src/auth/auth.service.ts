import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '@ceasaminas/database';
import { Role, type AuthUser, type JwtPayload } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { BootstrapAdminDto } from './dto/bootstrap-admin.dto.js';

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async bootstrap(dto: BootstrapAdminDto, bootstrapToken: string | undefined, meta: RequestMeta) {
    const expectedToken = process.env.BOOTSTRAP_ADMIN_TOKEN;

    if (!expectedToken || bootstrapToken !== expectedToken) {
      throw new ForbiddenException('Token de instalação inválido.');
    }

    const passwordHash = await hash(dto.password, 12);

    return prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('ceasaminas-bootstrap-admin'))`;

      const users = await transaction.user.count();
      if (users > 0) {
        throw new ConflictException('O administrador inicial já foi configurado.');
      }

      const user = await transaction.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          passwordHash,
          role: Role.ADMIN,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_BOOTSTRAP_ADMIN',
          resource: 'USER',
          resourceId: user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      return { user };
    });
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const email = dto.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const passwordIsValid = await compare(dto.password, user.passwordHash);
    if (!passwordIsValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const sessionId = randomUUID();
    const refreshToken = await this.signRefreshToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      sessionId,
    });

    await prisma.$transaction([
      prisma.authSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          refreshTokenHash: this.hashToken(refreshToken),
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress,
          expiresAt: this.refreshExpirationDate(),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN',
          resource: 'SESSION',
          resourceId: sessionId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      }),
    ]);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };

    return {
      accessToken: await this.signAccessToken(authUser, sessionId),
      refreshToken,
      user: authUser,
    };
  }

  async refresh(refreshToken: string | undefined, meta: RequestMeta) {
    if (!refreshToken) {
      throw new UnauthorizedException('Sessão não encontrada.');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Sessão expirada ou inválida.');
    }

    const session = await prisma.authSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.user.status !== 'ACTIVE' ||
      session.refreshTokenHash !== this.hashToken(refreshToken)
    ) {
      throw new UnauthorizedException('Sessão expirada ou revogada.');
    }

    const nextRefreshToken = await this.signRefreshToken({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as Role,
      sessionId: session.id,
    });

    const rotation = await prisma.authSession.updateMany({
      where: {
        id: session.id,
        userId: session.user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        refreshTokenHash: this.hashToken(nextRefreshToken),
        userAgent: meta.userAgent ?? session.userAgent,
        ipAddress: meta.ipAddress ?? session.ipAddress,
        expiresAt: this.refreshExpirationDate(),
      },
    });

    if (rotation.count !== 1) {
      throw new UnauthorizedException('Sessão expirada ou revogada.');
    }

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as Role,
    };

    return {
      accessToken: await this.signAccessToken(user, session.id),
      refreshToken: nextRefreshToken,
      user,
    };
  }

  async logout(userId: string, sessionId: string, meta: RequestMeta) {
    await prisma.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AUTH_LOGOUT',
        resource: 'SESSION',
        resourceId: sessionId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return { success: true };
  }

  private async signAccessToken(user: AuthUser, sessionId: string) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sessionId,
      } satisfies JwtPayload,
      {
        secret: this.accessSecret(),
        expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as JwtSignOptions['expiresIn'],
      },
    );
  }

  private async signRefreshToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      secret: this.refreshSecret(),
      expiresIn: `${this.refreshDays()}d`,
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshExpirationDate() {
    const date = new Date();
    date.setDate(date.getDate() + this.refreshDays());
    return date;
  }

  private refreshDays() {
    return Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7);
  }

  private accessSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET inválido.');
    }
    return secret;
  }

  private refreshSecret() {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET inválido.');
    }
    return secret;
  }
}
