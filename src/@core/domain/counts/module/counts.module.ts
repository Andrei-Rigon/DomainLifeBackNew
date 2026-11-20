import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Counts, CategoriaConta } from '../entities/count.entity';
import { CountsService } from '../services/counts.service';
import { CategoriaContaService } from '../services/categoria-conta.service';
import { CountsController } from '../controllers/counts.controller';
import { CategoriaContaController } from '../controllers/categoria-conta.controller';
import { CountsProvider } from '../providers/counts.providers';

@Module({
  imports: [SequelizeModule.forFeature([Counts, CategoriaConta])],
  controllers: [CountsController, CategoriaContaController],
  providers: [CountsService, CategoriaContaService, ...CountsProvider],
  exports: [CountsService],
})
export class CountsModule {}
