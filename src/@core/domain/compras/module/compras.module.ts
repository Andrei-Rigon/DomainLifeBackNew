import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ComprasService } from '../services/compras.service';
import { ComprasController } from '../controllers/compras.controller';
import { ComprasProvider } from '../providers/compras.providers';
import { Compra } from '../entities/compra.entity';

@Module({
  imports: [SequelizeModule.forFeature([Compra])],
  controllers: [ComprasController],
  providers: [ComprasService, ...ComprasProvider],
  exports: [ComprasService],
})
export class ComprasModule {}
