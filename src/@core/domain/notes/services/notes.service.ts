import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import type { NotesRepositoryInterface } from '../repositories/notes.repositories';

@Injectable()
export class NotesService {
  constructor(
    @Inject('NOTES_REPOSITORY')
    private readonly notesRepository: NotesRepositoryInterface,
  ) {}

  create(createNoteDto: CreateNoteDto) {
    return this.notesRepository.create(createNoteDto);
  }

  findAll() {
    return this.notesRepository.findAll({
      order: [['created_at', 'ASC']],
    });
  }

  async findOne(id: number) {
    const nota = await this.notesRepository.findOne({ where: { id } });
    if (!nota) throw new NotFoundException(`Nota ${id} não encontrada.`);
    return nota;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto) {
    await this.findOne(id);
    await this.notesRepository.update(updateNoteDto, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.notesRepository.destroy({ where: { id } });
    return { deleted: true };
  }
}
