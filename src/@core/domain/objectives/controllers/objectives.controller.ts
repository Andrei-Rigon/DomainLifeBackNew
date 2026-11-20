import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ObjectivesService } from '../services/objectives.service';
import { CreateObjectiveDto } from '../dto/create-objective.dto';
import { UpdateObjectiveDto } from '../dto/update-objective.dto';

@Controller('objectives')
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  @Post()
  create(@Body() createObjectiveDto: CreateObjectiveDto) {
    return this.objectivesService.create(createObjectiveDto);
  }

  @Get()
  findAll(@Query('id_categoria') idCategoria?: string, @Query('checked') checked?: string) {
    return this.objectivesService.findAll({
      id_categoria: idCategoria ? +idCategoria : undefined,
      checked: checked === undefined ? undefined : checked === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.objectivesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateObjectiveDto: UpdateObjectiveDto) {
    return this.objectivesService.update(+id, updateObjectiveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.objectivesService.remove(+id);
  }
}
