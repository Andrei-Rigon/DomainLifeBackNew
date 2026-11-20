import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './@core/domain/shared/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Única rota sem X-API-Key: serve para checar se a API está no ar.
  @Public()
  @Get('health')
  health() {
    return { ok: true };
  }
}
