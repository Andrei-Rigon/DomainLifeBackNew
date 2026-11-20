import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PesoService } from '../services/peso.service';
import { PesoController } from '../controllers/peso.controller';
import { PesoProvider } from '../providers/peso.providers';
import { Peso } from '../entities/peso.entity';

@Module({
  imports: [SequelizeModule.forFeature([Peso])],
  controllers: [PesoController],
  providers: [PesoService, ...PesoProvider],
  exports: [PesoService],
})
export class PesoModule {}
