import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoriaContaDto, UpdateCategoriaContaDto } from '../dto/create-categoria-conta.dto';
import type {
  CategoriaContaRepositoryInterface,
  CountsRepositoryInterface,
} from '../repositories/counts.repository.interface';

@Injectable()
export class CategoriaContaService {
  constructor(
    @Inject('CATEGORIA_CONTA_REPOSITORY')
    private readonly categoriaRepository: CategoriaContaRepositoryInterface,
    @Inject('COUNT_REPOSITORY')
    private readonly countRepository: CountsRepositoryInterface,
  ) {}

  create(dto: CreateCategoriaContaDto) {
    return this.categoriaRepository.create(dto);
  }

  findAll() {
    return this.categoriaRepository.findAll({ order: [['nome', 'ASC']] });
  }

  async findOne(id: number) {
    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoria ${id} não encontrada.`);
    return categoria;
  }

  async update(id: number, dto: UpdateCategoriaContaDto) {
    await this.findOne(id);
    await this.categoriaRepository.update(dto, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    const emUso = await this.countRepository.count({ where: { id_categoria_conta: id } });
    if (emUso > 0) {
      throw new ConflictException('Essa categoria ainda tem contas vinculadas.');
    }

    await this.categoriaRepository.destroy({ where: { id } });
    return { deleted: true };
  }
}
