import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/exceptions/http-exception.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  /* CORS setup */
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  /* Swagger setup */
  const config = new DocumentBuilder()
    .setTitle('Marketplace Platform')
    .setDescription('Multi vendor marketplace platform API')
    .setVersion('1.0')
    .addTag('Marketplace Platform')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  /* Global Pipes/Interceptors */
  app.useGlobalPipes(CustomValidationPipe);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  /* api versioning */
  app.setGlobalPrefix('api/v1');

  /* listen to the port 8000 */
  await app.listen(process.env.PORT ?? 8000);
}
void bootstrap();
