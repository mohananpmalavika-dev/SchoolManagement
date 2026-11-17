import {NestFactory} from '@nestjs/core';
import {ValidationPipe,Logger} from '@nestjs/common';
import {DocumentBuilder,SwaggerModule} from '@nestjs/swagger';
import {ConfigService} from '@nestjs/config';
import {AppModule} from './app.module';
import {HttpExceptionFilter} from './common/filters/http-exception.filter';
import {TransformInterceptor} from './common/interceptors/transform.interceptor';
import {LoggingInterceptor} from './common/interceptors/logging.interceptor';
async function bootstrap(){
 const app=await NestFactory.create(AppModule,{rawBody:true,logger:['error','warn','log']});const config=app.get(ConfigService);
 const production=config.get('NODE_ENV')==='production';
 app.getHttpAdapter().getInstance().disable('x-powered-by');
 app.enableShutdownHooks();
 app.use((_req:any,res:any,next:()=>void)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');if(production)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');next();});
 app.enableCors({origin:String(config.get('CORS_ORIGIN','http://localhost:3000')).split(',').map(o=>o.trim()),credentials:false});
 app.setGlobalPrefix('api/v1');
 app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true,transformOptions:{enableImplicitConversion:true}}));
 app.useGlobalFilters(new HttpExceptionFilter());
 app.useGlobalInterceptors(new TransformInterceptor(),new LoggingInterceptor());
 if(!production||config.get('ENABLE_API_DOCS')==='true'){const doc=SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('Krypton School ERP API').setVersion('2.0').addBearerAuth().build());SwaggerModule.setup('api/docs',app,doc);}
 await app.listen(Number(config.get('PORT',config.get('API_PORT',3001))),'0.0.0.0');
 Logger.log('Krypton API listening on port '+config.get('PORT',3001));
}
bootstrap().catch(error=>{Logger.error('API startup failed',error);process.exitCode=1;});
