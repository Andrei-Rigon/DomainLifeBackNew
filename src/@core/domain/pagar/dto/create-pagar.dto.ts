import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum StatusPagar {
  PENDENTE = 'Pendente',
  PAGA = 'Paga',
  ATRASADA = 'Atrasada',
}

export class CreatePagarDto {
  @Type(() => Number)
  @IsInt({ message: 'id_count deve ser o id de uma conta' })
  id_count!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numero_parcela?: number | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_parcela deve ter no máximo 2 casas decimais' })
  @Min(0)
  valor_parcela!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_pago deve ter no máximo 2 casas decimais' })
  @Min(0)
  valor_pago?: number | null;

  @IsDateString({}, { message: 'data_vencimento deve estar no formato YYYY-MM-DD' })
  @IsNotEmpty()
  data_vencimento!: string;

  @IsOptional()
  @IsDateString({}, { message: 'data_pagamento deve estar no formato YYYY-MM-DD' })
  data_pagamento?: string | null;

  // O service sempre recalcula (Paga / Atrasada / Pendente); aceito só por compatibilidade.
  @IsOptional()
  @IsEnum(StatusPagar, { message: 'status deve ser Pendente, Paga ou Atrasada' })
  status?: StatusPagar;
}
