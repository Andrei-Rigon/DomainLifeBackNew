import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateAniversarioDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(150)
  nome!: string;

  // "1990-11-19" ou, se o ano é desconhecido, só "11-19"
  @Matches(/^(\d{4}-)?\d{2}-\d{2}$/, { message: 'data_nascimento deve ser YYYY-MM-DD ou MM-DD (sem o ano)' })
  data_nascimento!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string;

  // Texto do parabéns
  @IsOptional()
  @IsString()
  mensagem?: string;
}

export class UpdateAniversarioDto extends PartialType(CreateAniversarioDto) {}
