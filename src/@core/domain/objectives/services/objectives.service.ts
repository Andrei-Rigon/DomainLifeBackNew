import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateObjectiveDto } from '../dto/create-objective.dto';
import { UpdateObjectiveDto } from '../dto/update-objective.dto';
import type { ObjectivesRepositoryInterface } from '../repositories/objectives.repositories';
import type { ObjectivesCategoriesInterface } from '../../objectives_categories/repositories/objectiver_categories.repositories';
import { ObjectivesCategories } from '../../objectives_categories/entities/objectives_category.entity';

export interface FiltroObjectives {
  id_categoria?: number;
  checked?: boolean;
}

@Injectable()
export class ObjectivesService {
  constructor(
    @Inject('OBJECTIVES_REPOSITORY')
    private readonly objectivesRepository: ObjectivesRepositoryInterface,
    @Inject('OBJECTIVES_CATEGORIES_REPOSITORY')
    private readonly categoriesRepository: ObjectivesCategoriesInterface,
  ) {}

  async create(createObjectiveDto: CreateObjectiveDto) {
    await this.garantirCategoria(createObjectiveDto.id_categoria);
    return this.objectivesRepository.create({
      ...createObjectiveDto,
      porcentagem: this.calcularPorcentagem(createObjectiveDto),
    });
  }

  findAll(filtro: FiltroObjectives = {}) {
    const where: Record<string, unknown> = {};
    if (filtro.id_categoria) where.id_categoria = filtro.id_categoria;
    if (filtro.checked !== undefined) where.checked = filtro.checked;

    return this.objectivesRepository.findAll({
      where,
      include: [{ model: ObjectivesCategories, required: false }],
      order: [
        ['checked', 'ASC'],
        ['prazo', 'ASC NULLS LAST'],
        ['id', 'ASC'],
      ],
    });
  }

  async findOne(id: number) {
    const objetivo = await this.objectivesRepository.findOne({
      where: { id },
      include: [{ model: ObjectivesCategories, required: false }],
    });
    if (!objetivo) throw new NotFoundException(`Objetivo ${id} não encontrado.`);
    return objetivo;
  }

  async update(id: number, updateObjectiveDto: UpdateObjectiveDto) {
    const atual = await this.findOne(id);

    if (updateObjectiveDto.id_categoria && updateObjectiveDto.id_categoria !== Number(atual.id_categoria)) {
      await this.garantirCategoria(updateObjectiveDto.id_categoria);
    }

    const valores: UpdateObjectiveDto = { ...updateObjectiveDto };
    const mexeuNosValores =
      updateObjectiveDto.valor_guardado !== undefined || updateObjectiveDto.valor_objetivo !== undefined;
    if (mexeuNosValores) {
      valores.porcentagem = this.calcularPorcentagem({
        valor_guardado: updateObjectiveDto.valor_guardado ?? atual.valor_guardado,
        valor_objetivo: updateObjectiveDto.valor_objetivo ?? atual.valor_objetivo,
        porcentagem: updateObjectiveDto.porcentagem ?? atual.porcentagem,
      });
    }

    await this.objectivesRepository.update(valores, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.objectivesRepository.destroy({ where: { id } });
    return { deleted: true };
  }

  private async garantirCategoria(id_categoria: number) {
    const categoria = await this.categoriesRepository.findOne({ where: { id: id_categoria } });
    if (!categoria) throw new NotFoundException(`Categoria ${id_categoria} não encontrada.`);
    return categoria;
  }

  // porcentagem é derivada: guardado / objetivo (limitada a 100). Sem os dois valores, mantém o informado.
  private calcularPorcentagem(dados: {
    valor_guardado?: number | null;
    valor_objetivo?: number | null;
    porcentagem?: number | null;
  }): number | undefined {
    const guardado = Number(dados.valor_guardado ?? 0);
    const alvo = Number(dados.valor_objetivo ?? 0);
    if (alvo > 0) return Math.min(100, Math.round((guardado / alvo) * 100));
    return dados.porcentagem ?? undefined;
  }
}
