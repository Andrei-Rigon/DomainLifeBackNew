import { PartialType } from '@nestjs/mapped-types';
import { CreatePagarDto } from './create-pagar.dto';

export class UpdatePagarDto extends PartialType(CreatePagarDto) {}
