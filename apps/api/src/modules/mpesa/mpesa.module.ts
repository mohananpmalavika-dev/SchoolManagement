import { PaymentCallbackGuard } from '../../common/guards/payment-callback.guard';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';
import { DatabaseModule } from '../../database/database.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [DatabaseModule, FeesModule, HttpModule],
  controllers: [MpesaController],
  providers: [MpesaService, PaymentCallbackGuard],
  exports: [MpesaService],
})
export class MpesaModule {}
