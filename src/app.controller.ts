import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

interface TurnstileValidationDto {
  captchaToken: string;
  action?: string;
  timestamp?: number;
}

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('captcha-protected-ping')
  pingProtected() {
    return { ok: true, message: 'pong (captcha-pass requerido)' };
  }

  @Post('validate-captcha')
  async validateCaptcha(@Body() body: TurnstileValidationDto) {
    const { captchaToken, action, timestamp } = body;

    if (!captchaToken) {
      throw new HttpException(
        { success: false, message: 'Token de CAPTCHA es requerido' },
        HttpStatus.BAD_REQUEST
      );
    }

    // Tu clave secreta de Turnstile (desde variables de entorno o fallback)
    const secretKey = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAABnyQAC0I2WRq8rXOGQKSmPZuy8';

    try {
      // Crear URLSearchParams para una mejor compatibilidad
      const params = new URLSearchParams();
      params.append('secret', secretKey);
      params.append('response', captchaToken);
      
      // Validar con la API de Cloudflare
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result: TurnstileResponse = await response.json();

      if (result.success) {
        const passSecret = this.configService.get<string>('CAPTCHA_PASS_SECRET');
        const passTtl = this.configService.get<string>('CAPTCHA_PASS_TTL') || '10m';
        if (!passSecret) {
          throw new HttpException({ success: false, message: 'Servidor mal configurado: falta CAPTCHA_PASS_SECRET' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Emit a short-lived JWT that represents a captcha pass
        const captchaPassToken = await this.jwtService.signAsync(
          { kind: 'captcha-pass' },
          { secret: passSecret, expiresIn: passTtl }
        );

        return {
          success: true,
          message: 'CAPTCHA validado exitosamente',
          challenge_ts: result.challenge_ts,
          hostname: result.hostname,
          action: result.action || action,
          captchaPassToken,
          expiresIn: passTtl,
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: 'CAPTCHA inválido',
            errors: result['error-codes']
          },
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      console.error('Error validando CAPTCHA:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        { success: false, message: 'Error interno del servidor al validar CAPTCHA' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
