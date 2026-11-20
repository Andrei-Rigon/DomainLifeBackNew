import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCountDto } from '../dto/create-count.dto';
import { UpdateCountDto } from '../dto/update-count.dto';
import { CategoriaConta } from '../entities/count.entity';
import type {
  CategoriaContaRepositoryInterface,
  CountsRepositoryInterface,
} from '../repositories/counts.repository.interface';

@Injectable()
export class CountsService {
  constructor(
    @Inject('COUNT_REPOSITORY')
    private readonly countRepository: CountsRepositoryInterface,
    @Inject('CATEGORIA_CONTA_REPOSITORY')
    private readonly categoriaRepository: CategoriaContaRepositoryInterface,
  ) {}

  async create(createCountDto: CreateCountDto) {
    await this.garantirCategoria(createCountDto.id_categoria_conta);
    return this.countRepository.create(createCountDto);
  }

  findAll() {
    return this.countRepository.findAll({
      include: [{ model: CategoriaConta, required: false }],
      order: [['nome', 'ASC']],
    });
  }

  async findOne(id: number) {
    const conta = await this.countRepository.findOne({
      where: { id },
      include: [{ model: CategoriaConta, required: false }],
    });
    if (!conta) throw new NotFoundException(`Conta ${id} não encontrada.`);
    return conta;
  }

  async update(id: number, updateCountDto: UpdateCountDto) {
    await this.findOne(id);
    await this.garantirCategoria(updateCountDto.id_categoria_conta);
    await this.countRepository.update(updateCountDto, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.countRepository.destroy({ where: { id } });
    return { deleted: true };
  }

  private async garantirCategoria(id?: number | null) {
    if (id == null) return;
    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoria de conta ${id} não encontrada.`);
  }
}
