import { Transform, Type } from 'class-transformer';
import { paraBooleano } from '../../shared/contabilizar';
import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, IsBoolean } from 'class-validator';

export const TIPOS_LANCAMENTO = ['despesa', 'receita', 'transferencia'] as const;
export const FORMAS_PAGAMENTO = ['pix', 'debito', 'credito', 'dinheiro', 'outro'] as const;
export const ORIGENS = ['manual', 'ciel', 'whatsapp', 'importacao'] as const;

export class CreateLancamentoDto {
  @IsIn(TIPOS_LANCAMENTO, { message: 'tipo deve ser despesa, receita ou transferencia' })
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

  // Contabilizar no caixa. Se não vier: true (ou o padrão da conta, nas parcelas).
  @IsOptional()
  @Transform(paraBooleano)
  @IsBoolean({ message: 'contabilizar deve ser true ou false' })
  contabilizar?: boolean;

  // Conta bancária (opcional). Na transferência é obrigatória: é a conta de ORIGEM.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'id_conta_bancaria deve ser o id de uma conta bancária' })
  id_conta_bancaria?: number | null;

  // Só na transferência (obrigatória): conta de DESTINO.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'id_conta_destino deve ser o id de uma conta bancária' })
  id_conta_destino?: number | null;
}

export class UpdateLancamentoDto extends PartialType(CreateLancamentoDto) {}
