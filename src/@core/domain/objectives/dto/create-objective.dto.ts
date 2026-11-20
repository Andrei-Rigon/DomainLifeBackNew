import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// O front antigo manda números e booleanos como string ("100", "true"); aceita os dois formatos.
const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' || value === true ? true : value === 'false' || value === false ? false : value;

export class CreateObjectiveDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(255)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;

  @IsOptional()
  @IsDateString({}, { message: 'prazo deve estar no formato YYYY-MM-DD' })
  prazo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_guardado deve ter no máximo 2 casas decimais' })
  @Min(0)
  valor_guardado?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_objetivo deve ter no máximo 2 casas decimais' })
  @Min(0)
  valor_objetivo?: number;

  // Quando valor_guardado e valor_objetivo existem, o service recalcula este campo.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  porcentagem?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'checked deve ser true ou false' })
  checked?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  prioridade?: string;

  @Type(() => Number)
  @IsInt({ message: 'id_categoria deve ser o id de uma categoria' })
  id_categoria!: number;
}
