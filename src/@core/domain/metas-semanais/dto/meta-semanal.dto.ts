import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateMetaSemanalDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(255)
  titulo!: string;

  // Qualquer dia da semana: o service guarda a segunda-feira. Padrão: semana atual.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'semana deve estar no formato YYYY-MM-DD' })
  semana?: string;

  @IsOptional()
  @IsBoolean()
  concluida?: boolean;
}

export class UpdateMetaSemanalDto extends PartialType(CreateMetaSemanalDto) {}
