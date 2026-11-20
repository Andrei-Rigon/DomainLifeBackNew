import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';

/**
 * Nas rotas /ciel, TODO erro sai como { ok: false, mensagem } em português,
 * sem stack trace. Erros inesperados viram 500 com mensagem genérica
 * (o detalhe vai só para o log do servidor).
 */
@Catch()
export class CielExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Ciel');

  catch(erro: unknown, host: ArgumentsHost) {
    const resposta = host.switchToHttp().getResponse();
    let status = 500;
    let mensagem = 'Não consegui fazer isso agora. Tente de novo daqui a pouco.';

    if (erro instanceof HttpException) {
      status = erro.getStatus();
      const corpo = erro.getResponse() as any;
      const texto = typeof corpo === 'string' ? corpo : (corpo?.message ?? erro.message);
      mensagem = Array.isArray(texto) ? texto.join(' ') : String(texto);
    } else {
      this.logger.error((erro as Error)?.stack ?? String(erro));
    }

    resposta.status(status).json({ ok: false, mensagem });
  }
}
