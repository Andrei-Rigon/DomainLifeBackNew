import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { paraBooleano } from '../../shared/contabilizar';

export const TIPOS_CONTA_BANCARIA = ['corrente', 'investimento', 'cartao'] as const;

export class CreateContaBancariaDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(100)
  nome!: string;

  @IsOptional()
  @IsIn(TIPOS_CONTA_BANCARIA, { message: 'tipo deve ser corrente, investimento ou cartao' })
  tipo?: (typeof TIPOS_CONTA_BANCARIA)[number];

  // Pode ser negativo (ex.: cartão com fatura em aberto)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'saldo_inicial deve ter no máximo 2 casas decimais' })
  saldo_inicial?: number;

  @IsOptional()
  @Transform(paraBooleano)
  @IsBoolean({ message: 'ativa deve ser true ou false' })
  ativa?: boolean;
}

export class UpdateContaBancariaDto extends PartialType(CreateContaBancariaDto) {}
