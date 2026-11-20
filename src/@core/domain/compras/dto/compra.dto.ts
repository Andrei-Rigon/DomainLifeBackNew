import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export const LISTAS_COMPRAS = ['mercado', 'online'] as const;

export class CreateCompraDto {
  @IsString()
  @IsNotEmpty({ message: 'O item é obrigatório.' })
  @MaxLength(255)
  item!: string;

  // Texto livre: "2", "1 caixa", "500g"
  @IsOptional()
  @Type(() => String)
  @IsString()
  @MaxLength(50)
  quantidade?: string;

  @IsOptional()
  @IsIn(LISTAS_COMPRAS, { message: 'lista deve ser mercado ou online' })
  lista?: (typeof LISTAS_COMPRAS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'preco_estimado deve ter no máximo 2 casas decimais' })
  @Min(0)
  preco_estimado?: number;

  @IsOptional()
  @IsBoolean()
  comprado?: boolean;
}

export class UpdateCompraDto extends PartialType(CreateCompraDto) {}
