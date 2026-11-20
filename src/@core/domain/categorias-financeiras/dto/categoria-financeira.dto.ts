import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const TIPOS_CATEGORIA = ['despesa', 'receita', 'ambos'] as const;

export class CreateCategoriaFinanceiraDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(100)
  nome!: string;

  @IsOptional()
  @IsIn(TIPOS_CATEGORIA, { message: 'tipo deve ser despesa, receita ou ambos' })
  tipo?: (typeof TIPOS_CATEGORIA)[number];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icone?: string;
}

export class UpdateCategoriaFinanceiraDto extends PartialType(CreateCategoriaFinanceiraDto) {}
