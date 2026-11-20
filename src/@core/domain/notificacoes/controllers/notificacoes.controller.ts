import { Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { NotificacoesService } from '../services/notificacoes.service';
import { lerPaginacao } from '../../shared/pagination';

@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly service: NotificacoesService) {}

  // GET /notificacoes/pendentes -> tudo que já devia ter sido avisado e não foi
  @Get('pendentes')
  pendentes(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.pendentes(lerPaginacao(limit, offset));
  }

  // POST /notificacoes/lembrete/12/enviado
  // tipo: aviso_agendamento | lembrete | parcela | aniversario
  @Post(':tipo/:id/enviado')
  enviado(@Param('tipo') tipo: string, @Param('id', ParseIntPipe) id: number) {
    return this.service.marcarEnviado(tipo, id);
  }
}
