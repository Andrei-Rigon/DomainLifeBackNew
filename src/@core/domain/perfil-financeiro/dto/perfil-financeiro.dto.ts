import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SalvarPerfilFinanceiroDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'salario_liquido deve ter no máximo 2 casas decimais' })
  @Min(0)
  salario_liquido?: number;

  // Pode ser negativo (começou devendo)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'saldo_inicial deve ter no máximo 2 casas decimais' })
  saldo_inicial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dias_trabalhados_mes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(24)
  horas_por_dia?: number;
}
