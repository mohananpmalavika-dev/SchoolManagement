import { SchoolRecordAccessGuard } from '../../common/guards/school-record-access.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsGatewayService } from './payments-gateway.service';
import {
  InitiatePaymentDto,
  ManualReconciliationDto,
  PaymentWebhookDto,
  QueryGatewayStatusDto,
  QueryUnmatchedTransactionsDto,
  VerifyPaymentDto,
} from './dto/gateway-payment.dto';
import { PaymentCallbackGuard } from '../../common/guards/payment-callback.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('payments-gateway')
@Controller('payments-gateway')
export class PaymentsGatewayController {
  constructor(private readonly gatewayService: PaymentsGatewayService) {}

  @Get('options')
  @Roles(UserRole.PARENT, UserRole.SUPER_ADMIN, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  options() { return this.gatewayService.options(); }

  @Post('initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, SchoolRecordAccessGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate Indian payment order (Razorpay or UPI Intent)' })
  @ApiResponse({ status: 201, description: 'Payment order or UPI intent created' })
  initiate(@Body() dto: InitiatePaymentDto, @CurrentUser() user: any) {
    return this.gatewayService.initiatePayment(dto, user?.userId || user?.id);
  }

  @Post('verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, SchoolRecordAccessGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay checkout signature and record fee payment' })
  verify(@Body() dto: VerifyPaymentDto) {
    return this.gatewayService.verifyRazorpayCheckout(dto);
  }

  @Post('webhook')
  @Public()
  @UseGuards(PaymentCallbackGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment gateway webhook callback endpoint' })
  handleWebhook(@Body() payload: PaymentWebhookDto) {
    return this.gatewayService.handleWebhook(payload);
  }

  @Post('status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, SchoolRecordAccessGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Query gateway transaction status' })
  queryStatus(@Body() dto: QueryGatewayStatusDto) {
    return this.gatewayService.queryStatus(dto);
  }

  @Get('transactions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, SchoolRecordAccessGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'List gateway payment transactions for reconciliation' })
  getTransactions(@Query() query: QueryUnmatchedTransactionsDto) {
    return this.gatewayService.getTransactions(query);
  }

  @Post('reconcile/manual')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, SchoolRecordAccessGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Manually reconcile an unmatched gateway transaction to an invoice' })
  manualReconcile(@Body() dto: ManualReconciliationDto, @CurrentUser() user: any) {
    return this.gatewayService.manualReconcile(dto, user?.userId || user?.id);
  }
}

