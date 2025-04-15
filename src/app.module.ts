import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { DbModule } from './db/db.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [{
          ttl: configService.get<number>('RATE_LIMIT_TTL'),
          limit: configService.get<number>('RATE_LIMIT_MAX'),
        }]
      }),
      inject: [ConfigService],
    }),
    DbModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
