import { Transform, Type } from 'class-transformer';
import { paraBooleano } from '../../shared/contabilizar';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, IsBoolean } from 'class-validator';

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export class CreateReceberDto {
  @IsString()
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @MaxLength(255)
  descricao!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'id_categoria deve ser o id de uma categoria' })
  id_categoria?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numero_parcela?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor deve ter no máximo 2 casas decimais' })
  @Min(0.01, { message: 'valor deve ser maior que zero' })
  valor!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor_recebido?: number;

  @Matches(DATA, { message: 'data_vencimento deve estar no formato YYYY-MM-DD' })
  data_vencimento!: string;

  @IsOptional()
  @Matches(DATA, { message: 'data_recebimento deve estar no formato YYYY-MM-DD' })
  data_recebimento?: string;

  // Contabilizar no caixa. Se não vier: true (ou o padrão da conta, nas parcelas).
  @IsOptional()
  @Transform(paraBooleano)
  @IsBoolean({ message: 'contabilizar deve ser true ou false' })
  contabilizar?: boolean;
}

export class UpdateReceberDto extends PartialType(CreateReceberDto) {}

/** Gera uma ou várias cobranças mensais (ex.: salário dos próximos 12 meses). */
export class GerarReceberDto {
  @IsString()
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @MaxLength(255)
  descricao!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @Matches(DATA, { message: 'primeiro_vencimento deve estar no formato YYYY-MM-DD' })
  primeiro_vencimento!: string;

  // Quantos meses gerar (padrão 1, máximo 60)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  qtde?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_categoria?: number;

  // Contabilizar no caixa. Se não vier: true (ou o padrão da conta, nas parcelas).
  @IsOptional()
  @Transform(paraBooleano)
  @IsBoolean({ message: 'contabilizar deve ser true ou false' })
  contabilizar?: boolean;
}
