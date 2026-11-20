import { BaseRepository } from '../../shared/repository.interface';
import { CreateNoteDto } from '../dto/create-note.dto';
import { Notes } from '../entities/notes.entity';

export interface NotesRepositoryInterface extends BaseRepository<Notes, CreateNoteDto> {}
