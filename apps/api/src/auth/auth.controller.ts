import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from './auth.types.js';
import { authCookiePath } from '../config/runtime-config.js';
import { LoginDto } from './dto/login.dto.js';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto.js';

const REFRESH_COOKIE = 'ceasa_refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('bootstrap')
  @ApiOperation({ summary: 'Cria o primeiro administrador' })
  bootstrap(
    @Body() dto: BootstrapAdminDto,
    @Headers('x-bootstrap-token') bootstrapToken: string | undefined,
    @Req() request: Request,
  ) {
    return this.authService.bootstrap(dto, bootstrapToken, this.meta(request));
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Inicia uma sessão administrativa' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto, this.meta(request));
    this.setRefreshCookie(response, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Renova a sessão administrativa' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.refresh(
      request.cookies?.[REFRESH_COOKIE] as string | undefined,
      this.meta(request),
    );

    this.setRefreshCookie(response, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Encerra a sessão atual' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(user.id, user.sessionId, this.meta(request));

    response.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: authCookiePath(),
    });

    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthenticatedUser) {
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: authCookiePath(),
      maxAge: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7) * 24 * 60 * 60 * 1000,
    });
  }

  private meta(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }
}
