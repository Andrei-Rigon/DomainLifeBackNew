import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ObjectivesService } from '../services/objectives.service';
import { ObjectivesController } from '../controllers/objectives.controller';
import { ObjectivesProvider } from '../providers/objectives.providers';
import { Objectives } from '../entities/objectives.entity';
import { ObjectivesCategories } from '../../objectives_categories/entities/objectives_category.entity';

@Module({
  imports: [SequelizeModule.forFeature([Objectives, ObjectivesCategories])],
  controllers: [ObjectivesController],
  providers: [ObjectivesService, ...ObjectivesProvider],
  exports: [ObjectivesService],
})
export class ObjectivesModule {}
