import { Transform, Type } from 'class-transformer';
import { paraBooleano } from '../../shared/contabilizar';
import { IsDateString, IsInt, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';

export class GerarParcelasDto {
  @Type(() => Number)
  @IsInt({ message: 'id_count deve ser o id de uma conta' })
  id_count!: number;

  @IsDateString({}, { message: 'data_primeiro_vencimento deve estar no formato YYYY-MM-DD' })
  data_primeiro_vencimento!: string;

  // Se não vier: usa qtde_parceladas da conta; sem isso, Recorrente/Assinatura = 12 e Conta = 1.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  qtde_parceladas?: number;

  // Se não vier, usa valor_esperado da conta.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor_parcela?: number;

  // Contabilizar no caixa. Se não vier: true (ou o padrão da conta, nas parcelas).
  @IsOptional()
  @Transform(paraBooleano)
  @IsBoolean({ message: 'contabilizar deve ser true ou false' })
  contabilizar?: boolean;
}
