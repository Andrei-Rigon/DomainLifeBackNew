import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca uma rota como pública (sem X-API-Key). Usado só em GET /health. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
