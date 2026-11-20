import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../shared/base-crud.service';
import { combinarDataHora, dataHoraSP, dataSP, horaSP, hoje, somarMeses } from '../../shared/date.helper';
import type { BaseRepository } from '../../shared/repository.interface';
import { Lembrete } from '../entities/lembrete.entity';

const DIA_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LembretesService extends BaseCrudService<Lembrete> {
  protected readonly entidade = 'Lembrete';
  protected ordem: any[] = [
    ['lembrar_em', 'ASC'],
    ['id', 'ASC'],
  ];

  constructor(
    @Inject('LEMBRETES_REPOSITORY')
    protected readonly repo: BaseRepository<Lembrete>,
  ) {
    super();
  }

  listarFiltrado(ativo: string | undefined, pagina: { limit: number; offset: number }) {
    return this.listar(ativo === undefined ? {} : { ativo: ativo === 'true' }, pagina);
  }

  protected async antesDeCriar(dto: any) {
    return { ...dto, lembrar_em: this.lerDataHora(dto.lembrar_em), repetir: dto.repetir ?? 'nao', ativo: dto.ativo ?? true };
  }

  protected async antesDeAtualizar(dto: any) {
    // Mudou o horário: precisa voltar a ser avisado no novo horário
    return dto.lembrar_em === undefined ? dto : { ...dto, lembrar_em: this.lerDataHora(dto.lembrar_em), enviado_em: null };
  }

  /** Lembretes ativos que caem na data (YYYY-MM-DD, fuso de São Paulo). */
  async doDia(dia: string = hoje()) {
    const ativos = await this.repo.findAll({ where: { ativo: true }, order: this.ordem });
    return ativos.filter((l) => dataSP(new Date(l.lembrar_em)) === dia);
  }

  /** Já deviam ter sido avisados e ainda não foram. */
  async pendentes(agora: Date) {
    const ativos = await this.repo.findAll({ where: { ativo: true }, order: this.ordem });
    return ativos.filter((l) => {
      const quando = new Date(l.lembrar_em);
      return quando <= agora && (!l.enviado_em || new Date(l.enviado_em) < quando);
    });
  }

  /**
   * Marca como avisado. Se o lembrete repete, agenda a próxima ocorrência
   * (a primeira depois de agora); se não, ele só fica com enviado_em preenchido.
   */
  async marcarEnviado(id: number) {
    const lembrete = await this.buscar(id);
    const agora = new Date();
    const dados: Record<string, any> = { enviado_em: agora };

    if (lembrete.repetir !== 'nao') {
      let proximo = new Date(lembrete.lembrar_em);
      let tentativas = 0;
      do {
        proximo = this.proximaOcorrencia(proximo, lembrete.repetir);
      } while (proximo <= agora && ++tentativas < 1000);
      dados.lembrar_em = proximo;
    }

    await this.repo.update(dados, { where: { id } });
    return this.buscar(id);
  }

  private proximaOcorrencia(atual: Date, repetir: string): Date {
    if (repetir === 'diario') return new Date(atual.getTime() + DIA_MS);
    if (repetir === 'semanal') return new Date(atual.getTime() + 7 * DIA_MS);
    // mensal: mesmo dia/hora do mês seguinte (31/01 -> 28/02)
    return combinarDataHora(somarMeses(dataSP(atual), 1), horaSP(atual));
  }

  private lerDataHora(texto: string): Date {
    const data = dataHoraSP(texto);
    if (!data) throw new BadRequestException('lembrar_em inválido. Use, por exemplo, 2026-11-19T09:00.');
    return data;
  }
}
