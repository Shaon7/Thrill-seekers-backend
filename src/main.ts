import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app =
    await NestFactory.create(
      AppModule,
    );

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3001',
    'http://localhost:3000',
  ].filter(
    (
      origin,
    ): origin is string =>
      Boolean(origin),
  );

  app.enableCors({
    origin:
      allowedOrigins,

    credentials: true,
  });

  await app.listen(
    process.env.PORT ?? 3000,
  );
}

bootstrap();