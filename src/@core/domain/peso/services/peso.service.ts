import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { BaseCrudService } from '../../shared/base-crud.service';
import { dataValida, fimDoMes, hoje, inicioDoMes, mesAtual } from '../../shared/date.helper';
import { arredondar2 } from '../../shared/money';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { Peso } from '../entities/peso.entity';

@Injectable()
export class PesoService extends BaseCrudService<Peso> {
  protected readonly entidade = 'Registro de peso';
  protected ordem: any[] = [['data', 'DESC']];

  constructor(
    @Inject('PESO_REPOSITORY')
    protected readonly repo: BaseRepository<Peso>,
  ) {
    super();
  }

  listarFiltrado(start: string | undefined, end: string | undefined, pagina: Paginacao) {
    const where: Record<string, any> = {};
    if (start && end) where.data = { [Op.between]: [start, end] };
    else if (start) where.data = { [Op.gte]: start };
    else if (end) where.data = { [Op.lte]: end };
    return this.listar(where, pagina);
  }

  /** Um registro por dia: se a data já tem peso, atualiza em vez de duplicar. */
  async registrar(dto: { data?: string; peso_kg: number }) {
    const data = dto.data ?? hoje();
    this.validarData(data);

    const existente = await this.repo.findOne({ where: { data } });
    if (!existente) return this.repo.create({ data, peso_kg: dto.peso_kg } as any);

    await this.repo.update({ peso_kg: dto.peso_kg }, { where: { id: existente.id } });
    return this.buscar(existente.id);
  }

  protected async antesDeAtualizar(dto: any, atual: Peso) {
    if (dto.data === undefined) return dto;
    this.validarData(dto.data);
    const outro = await this.repo.findOne({ where: { data: dto.data } });
    if (outro && Number(outro.id) !== Number(atual.id)) throw new ConflictException('Já existe peso registrado nessa data.');
    return dto;
  }

  /** Último registro com data <= `ate` (para comparar com a semana passada, etc.). */
  async ultimoAte(ate: string) {
    const registros = await this.repo.findAll({ where: { data: { [Op.lte]: ate } }, order: [['data', 'DESC']], limit: 1 } as any);
    return registros[0] ?? null;
  }

  /** inicial, final, variação, média, mínimo e máximo do mês (YYYY-MM). */
  async resumo(mes: string = mesAtual()) {
    const registros = await this.repo.findAll({
      where: { data: { [Op.between]: [inicioDoMes(mes), fimDoMes(mes)] } },
      order: [['data', 'ASC']],
    });
    if (!registros.length) {
      return { mes, registros: 0, inicial: null, final: null, variacao_kg: null, media_kg: null, minimo_kg: null, maximo_kg: null };
    }

    const pesos = registros.map((r) => Number(r.peso_kg));
    const primeiro = registros[0];
    const ultimo = registros[registros.length - 1];
    return {
      mes,
      registros: registros.length,
      inicial: { data: primeiro.data, peso_kg: Number(primeiro.peso_kg) },
      final: { data: ultimo.data, peso_kg: Number(ultimo.peso_kg) },
      variacao_kg: arredondar2(Number(ultimo.peso_kg) - Number(primeiro.peso_kg)),
      media_kg: arredondar2(pesos.reduce((a, b) => a + b, 0) / pesos.length),
      minimo_kg: Math.min(...pesos),
      maximo_kg: Math.max(...pesos),
    };
  }

  private validarData(data: string) {
    if (!dataValida(data)) throw new BadRequestException('data inválida. Use YYYY-MM-DD.');
  }
}
