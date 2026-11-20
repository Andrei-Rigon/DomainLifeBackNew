import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // GET /dashboard -> agenda, tarefas, lembretes, financeiro, parcelas, metas e peso num só JSON
  @Get()
  montar() {
    return this.service.montar();
  }
}
