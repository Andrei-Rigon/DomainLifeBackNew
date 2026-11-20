import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AniversariosService } from '../services/aniversarios.service';
import { AniversariosController } from '../controllers/aniversarios.controller';
import { AniversariosProvider } from '../providers/aniversarios.providers';
import { Aniversario } from '../entities/aniversario.entity';

@Module({
  imports: [SequelizeModule.forFeature([Aniversario])],
  controllers: [AniversariosController],
  providers: [AniversariosService, ...AniversariosProvider],
  exports: [AniversariosService],
})
export class AniversariosModule {}
