import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHash, timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Guard global (registrado como APP_GUARD): toda rota exige o header
 * `X-API-Key` igual a `API_KEY` do .env, exceto as marcadas com @Public().
 * Se API_KEY não estiver configurada, NADA passa (falha fechada).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) return true;

    const esperada = this.config.get<string>('API_KEY');
    if (!esperada) {
      this.logger.error('API_KEY não está configurada no .env: todas as rotas protegidas estão bloqueadas.');
      throw new UnauthorizedException('Servidor sem API_KEY configurada.');
    }

    const recebida = context.switchToHttp().getRequest().headers['x-api-key'];
    if (typeof recebida !== 'string' || !this.iguais(recebida, esperada)) {
      throw new UnauthorizedException('X-API-Key ausente ou inválida.');
    }
    return true;
  }

  // Compara hashes com timingSafeEqual (não vaza o tamanho/posição do erro pelo tempo de resposta)
  private iguais(a: string, b: string): boolean {
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  }
}
