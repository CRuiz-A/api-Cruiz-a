// @ts-nocheck
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CaptchaPassGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Allow CORS preflight
    if (request.method === 'OPTIONS') {
      return true;
    }

    const url: string = request.originalUrl || request.url || '';

    // Whitelist paths that must remain open
    const whitelisted = [
      '/validate-captcha',
      '/api/validate-captcha',
      '/docs',
      '/api/docs',
      '/docs-json',
      '/api/docs-json',
      '/',
      '/favicon.ico',
    ];

    if (whitelisted.some((path) => url === path || url.startsWith(path + '/'))) {
      return true;
    }

    // Accept token from custom header or Authorization
    const headerToken: string | undefined = request.headers['x-captcha-token'] as string | undefined;
    const authHeader: string | undefined = request.headers['authorization'] as string | undefined;

    let token: string | undefined = headerToken;

    if (!token && authHeader) {
      const [scheme, value] = authHeader.split(' ');
      if (scheme && value && (scheme.toLowerCase() === 'captcha' || scheme.toLowerCase() === 'bearer')) {
        token = value;
      }
    }

    if (!token) {
      throw new ForbiddenException('Captcha requerido: falta token');
    }

    const secret = this.configService.get<string>('CAPTCHA_PASS_SECRET');
    if (!secret) {
      throw new ForbiddenException('Captcha no disponible: falta configuración del servidor');
    }

    try {
      const payload = this.jwtService.verify(token, { secret });
      if (payload && payload.kind === 'captcha-pass') {
        return true;
      }
      throw new ForbiddenException('Captcha inválido');
    } catch (err) {
      throw new ForbiddenException('Captcha inválido o expirado');
    }
  }
}


