import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// Atalhos de aviso: "no dia às 8h" e "dia anterior às 20h"
export const ATALHOS_AVISO = ['no_dia_8h', 'dia_anterior_20h'] as const;

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;

  @IsDateString()
  data_evento!: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'hora_evento deve estar no formato HH:mm' })
  hora_evento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  localizacao?: string;

  // Avisos em horários exatos (horário de São Paulo): ["2026-11-19T08:00", ...]
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsDateString({}, { each: true, message: 'cada aviso deve ser uma data/hora, ex.: 2026-11-19T08:00' })
  avisos?: string[];

  // Ou um atalho: no_dia_8h | dia_anterior_20h
  @IsOptional()
  @IsIn(ATALHOS_AVISO, { message: 'avisar deve ser no_dia_8h ou dia_anterior_20h' })
  avisar?: (typeof ATALHOS_AVISO)[number];
}
