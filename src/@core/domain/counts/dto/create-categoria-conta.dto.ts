import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoriaContaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(255)
  nome!: string;
}

export class UpdateCategoriaContaDto extends PartialType(CreateCategoriaContaDto) {}
