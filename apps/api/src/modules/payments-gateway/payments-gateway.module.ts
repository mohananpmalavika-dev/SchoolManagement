import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsGatewayController } from './payments-gateway.controller';
import { PaymentsGatewayService } from './payments-gateway.service';
import { DatabaseModule } from '../../database/database.module';
import { FeesModule } from '../fees/fees.module';
import { SchoolPaymentAccountsService } from './school-payment-accounts.service';
import { EncryptionUtil } from '../../common/utils/encryption.util';
import { PaymentCallbackGuard } from '../../common/guards/payment-callback.guard';

@Module({
  imports: [ConfigModule, DatabaseModule, FeesModule],
  controllers: [PaymentsGatewayController],
  providers: [PaymentsGatewayService, SchoolPaymentAccountsService, EncryptionUtil, PaymentCallbackGuard],
  exports: [PaymentsGatewayService],
})
export class PaymentsGatewayModule {}

