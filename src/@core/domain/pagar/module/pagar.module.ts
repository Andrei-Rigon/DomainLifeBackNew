import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Pagar } from '../entities/pagar.entity';
import { Counts } from '../../counts/entities/count.entity';
import { PagarService } from '../services/pagar.service';
import { PagarController } from '../controller/pagar.controller';
import { PagarProvider } from '../providers/pagar.providers';

@Module({
  imports: [SequelizeModule.forFeature([Pagar, Counts])],
  controllers: [PagarController],
  providers: [PagarService, ...PagarProvider],
  exports: [PagarService],
})
export class PagarModule {}
