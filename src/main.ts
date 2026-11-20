import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Origens liberadas por padrão quando CORS_ORIGINS não está no .env
const ORIGENS_PADRAO = ['http://localhost:5173', 'http://127.0.0.1:5174'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // CORS: só as origens da lista (CORS_ORIGINS, separadas por vírgula).
  // Chamadas servidor-a-servidor (Ciel) não mandam Origin e não são afetadas.
  const configuradas = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origens = configuradas.length ? configuradas : [config.get<string>('FRONTEND_URL'), ...ORIGENS_PADRAO].filter(Boolean);

  app.enableCors({
    origin: origens as string[],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(config.get<string>('PORT') ?? 3000, '0.0.0.0');
}
bootstrap();
