import { Transform, Type } from 'class-transformer';
import { paraBooleano } from '../../shared/contabilizar';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, IsBoolean } from 'class-validator';
import { TipoConta } from '../enums/tipo-conta.enum';

export { TipoConta };

export class CreateCountDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(255)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_esperado deve ter no máximo 2 casas decimais' })
  @Min(0)
  valor_esperado?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_pago deve ter no máximo 2 casas decimais' })
  @Min(0)
  valor_pago?: number | null;

  @IsEnum(TipoConta, { message: 'tipo deve ser Recorrente, Conta ou Assinatura' })
  tipo!: TipoConta;

  // Só faz sentido para o tipo "Conta" (ex.: TV em 6x). Recorrente/Assinatura usam 12.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  qtde_parceladas?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_categoria_conta?: number | null;

  // Contabilizar no caixa. Se não vier: true (ou o padrão da conta, nas parcelas).
  @IsOptional()
  @Transform(paraBooleano)
  @IsBoolean({ message: 'contabilizar deve ser true ou false' })
  contabilizar?: boolean;
}
