import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const STATUS_TAREFA = ['a_fazer', 'em_andamento', 'feito'] as const;
export const PRIORIDADES = ['baixa', 'media', 'alta'] as const;

export class CreateTarefaDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(255)
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsIn(STATUS_TAREFA, { message: 'status deve ser a_fazer, em_andamento ou feito' })
  status?: (typeof STATUS_TAREFA)[number];

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'prazo deve estar no formato YYYY-MM-DD' })
  prazo?: string;

  @IsOptional()
  @IsIn(PRIORIDADES, { message: 'prioridade deve ser baixa, media ou alta' })
  prioridade?: (typeof PRIORIDADES)[number];
}

export class UpdateTarefaDto extends PartialType(CreateTarefaDto) {}
