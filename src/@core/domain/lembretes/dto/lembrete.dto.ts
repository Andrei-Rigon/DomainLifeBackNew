import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPETICOES = ['nao', 'diario', 'semanal', 'mensal'] as const;

export class CreateLembreteDto {
  @IsString()
  @IsNotEmpty({ message: 'O texto é obrigatório.' })
  @MaxLength(500)
  texto!: string;

  // Data e hora no horário de São Paulo, ex.: "2026-11-19T09:00"
  @IsDateString({}, { message: 'lembrar_em deve ser uma data/hora, ex.: 2026-11-19T09:00' })
  lembrar_em!: string;

  @IsOptional()
  @IsIn(REPETICOES, { message: 'repetir deve ser nao, diario, semanal ou mensal' })
  repetir?: (typeof REPETICOES)[number];

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateLembreteDto extends PartialType(CreateLembreteDto) {}
