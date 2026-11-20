import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';

export class CreatePesoDto {
  // Padrão: hoje. Um registro por dia: se já existe, é atualizado.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'data deve estar no formato YYYY-MM-DD' })
  data?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'peso_kg deve ter no máximo 2 casas decimais' })
  @Min(1, { message: 'peso_kg inválido' })
  @Max(500, { message: 'peso_kg inválido' })
  peso_kg!: number;
}

export class UpdatePesoDto extends PartialType(CreatePesoDto) {}
