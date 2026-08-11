import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { prisma } from '@ceasaminas/database';
import { Role, type AuthUser, type JwtPayload } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { BootstrapAdminDto } from './dto/bootstrap-admin.dto.js';
import type { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import { MailService } from './mail.service.js';

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') return { accepted: true };

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const record = await prisma.$transaction(async (transaction) => {
      await transaction.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      return transaction.passwordResetToken.create({
        data: { userId: user.id, tokenHash: this.hashToken(token), expiresAt },
        select: { id: true },
      });
    });

    try {
      if (!this.mailService) throw new Error('Serviço de e-mail indisponível.');
      await this.mailService.sendPasswordReset(user.email, user.name, token);
    } catch {
      await prisma.passwordResetToken.deleteMany({ where: { id: record.id } });
      this.logger.error({ event: 'password_reset_delivery_failed' });
    }
    return { accepted: true };
  }

  async resetPassword(dto: ResetPasswordDto, meta: RequestMeta) {
    const tokenHash = this.hashToken(dto.token);
    const token = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!token) throw new UnauthorizedException('Link de redefinição inválido ou expirado.');
    const passwordHash = await hash(dto.password, 12);

    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new UnauthorizedException('Link de redefinição inválido ou expirado.');
      }
      await transaction.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await transaction.authSession.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          userId: token.userId,
          action: 'AUTH_PASSWORD_RESET',
          resource: 'USER',
          resourceId: token.userId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });
    return { success: true };
  }

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

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      current: session.id === currentSessionId,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    actorSessionId: string,
    meta: RequestMeta,
  ) {
    const result = await prisma.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count !== 1)
      throw new UnauthorizedException('Sessão não encontrada ou já revogada.');

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AUTH_SESSION_REVOKED',
        resource: 'SESSION',
        resourceId: sessionId,
        metadata: { self: sessionId === actorSessionId },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    return { success: true, current: sessionId === actorSessionId };
  }

  async revokeOtherSessions(userId: string, currentSessionId: string, meta: RequestMeta) {
    const result = await prisma.authSession.updateMany({
      where: { userId, id: { not: currentSessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AUTH_OTHER_SESSIONS_REVOKED',
        resource: 'SESSION',
        resourceId: currentSessionId,
        metadata: { count: result.count },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    return { success: true, count: result.count };
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
      jwtid: randomUUID(),
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
