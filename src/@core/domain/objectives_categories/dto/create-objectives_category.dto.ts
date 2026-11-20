import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateObjectivesCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(255, { message: 'O título deve ter no máximo 255 caracteres.' })
  titulo!: string;
}
