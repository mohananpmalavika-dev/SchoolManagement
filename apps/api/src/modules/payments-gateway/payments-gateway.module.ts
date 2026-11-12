import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsGatewayController } from './payments-gateway.controller';
import { PaymentsGatewayService } from './payments-gateway.service';
import { DatabaseModule } from '../../database/database.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [ConfigModule, DatabaseModule, FeesModule],
  controllers: [PaymentsGatewayController],
  providers: [PaymentsGatewayService],
  exports: [PaymentsGatewayService],
})
export class PaymentsGatewayModule {}
