import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export const TIPOS_LANCAMENTO = ['despesa', 'receita'] as const;
export const FORMAS_PAGAMENTO = ['pix', 'debito', 'credito', 'dinheiro', 'outro'] as const;
export const ORIGENS = ['manual', 'ciel', 'whatsapp', 'importacao'] as const;

export class CreateLancamentoDto {
  @IsIn(TIPOS_LANCAMENTO, { message: 'tipo deve ser despesa ou receita' })
  tipo!: (typeof TIPOS_LANCAMENTO)[number];

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor deve ter no máximo 2 casas decimais' })
  @Min(0.01, { message: 'valor deve ser maior que zero' })
  valor!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'id_categoria deve ser o id de uma categoria' })
  id_categoria?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;

  // Padrão: hoje (fuso de São Paulo)
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'data deve estar no formato YYYY-MM-DD' })
  data?: string;

  @IsOptional()
  @IsIn(FORMAS_PAGAMENTO, { message: 'forma_pagamento deve ser pix, debito, credito, dinheiro ou outro' })
  forma_pagamento?: (typeof FORMAS_PAGAMENTO)[number];

  @IsOptional()
  @IsIn(ORIGENS, { message: 'origem deve ser manual, ciel, whatsapp ou importacao' })
  origem?: (typeof ORIGENS)[number];

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class UpdateLancamentoDto extends PartialType(CreateLancamentoDto) {}
