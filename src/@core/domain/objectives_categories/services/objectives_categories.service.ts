import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateObjectivesCategoryDto } from '../dto/create-objectives_category.dto';
import { UpdateObjectivesCategoryDto } from '../dto/update-objectives_category.dto';
import type { ObjectivesCategoriesInterface } from '../repositories/objectiver_categories.repositories';
import type { ObjectivesRepositoryInterface } from '../../objectives/repositories/objectives.repositories';

@Injectable()
export class ObjectivesCategoriesService {
  constructor(
    @Inject('OBJECTIVES_CATEGORIES_REPOSITORY')
    private readonly objectivesCategoriesRepository: ObjectivesCategoriesInterface,
    @Inject('OBJECTIVES_REPOSITORY')
    private readonly objectivesRepository: ObjectivesRepositoryInterface,
  ) {}

  create(createObjectivesCategoryDto: CreateObjectivesCategoryDto) {
    return this.objectivesCategoriesRepository.create(createObjectivesCategoryDto);
  }

  findAll() {
    return this.objectivesCategoriesRepository.findAll({ order: [['titulo', 'ASC']] });
  }

  async findOne(id: number) {
    const categoria = await this.objectivesCategoriesRepository.findOne({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoria ${id} não encontrada.`);
    return categoria;
  }

  async update(id: number, updateObjectivesCategoryDto: UpdateObjectivesCategoryDto) {
    await this.findOne(id);
    await this.objectivesCategoriesRepository.update(updateObjectivesCategoryDto, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    const emUso = await this.objectivesRepository.count({ where: { id_categoria: id } });
    if (emUso > 0) {
      throw new ConflictException('Essa categoria ainda tem objetivos vinculados.');
    }

    await this.objectivesCategoriesRepository.destroy({ where: { id } });
    return { deleted: true };
  }
}
