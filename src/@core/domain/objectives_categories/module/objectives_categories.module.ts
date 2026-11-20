import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ObjectivesCategoriesService } from '../services/objectives_categories.service';
import { ObjectivesCategoriesController } from '../controllers/objectives_categories.controller';
import { ObjectivesCategories } from '../entities/objectives_category.entity';
import { Objectives } from '../../objectives/entities/objectives.entity';
import { ObjectivesCategoriesProvider } from '../providers/objectives_categories.providers';

@Module({
  imports: [SequelizeModule.forFeature([ObjectivesCategories, Objectives])],
  controllers: [ObjectivesCategoriesController],
  providers: [ObjectivesCategoriesService, ...ObjectivesCategoriesProvider],
})
export class ObjectivesCategoriesModule {}
