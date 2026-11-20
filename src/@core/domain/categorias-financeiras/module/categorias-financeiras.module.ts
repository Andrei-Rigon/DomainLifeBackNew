import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoriasFinanceirasService } from '../services/categorias-financeiras.service';
import { CategoriasFinanceirasController } from '../controllers/categorias-financeiras.controller';
import { CategoriasFinanceirasProvider } from '../providers/categorias-financeiras.providers';
import { CategoriaFinanceira } from '../entities/categoria-financeira.entity';
import { Lancamento } from '../../lancamentos/entities/lancamento.entity';

@Module({
  imports: [SequelizeModule.forFeature([CategoriaFinanceira, Lancamento])],
  controllers: [CategoriasFinanceirasController],
  providers: [CategoriasFinanceirasService, ...CategoriasFinanceirasProvider],
  exports: [CategoriasFinanceirasService],
})
export class CategoriasFinanceirasModule {}
