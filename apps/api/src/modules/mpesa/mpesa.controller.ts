import { PaymentCallbackGuard } from '../../common/guards/payment-callback.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MpesaService } from './mpesa.service';
import {
  InitiateSTKPushDto,
  STKPushCallbackDto,
  QuerySTKStatusDto,
} from './dto/stk-push.dto';
import {
  C2BCallbackDto,
  C2BValidationDto,
  C2BValidationResponseDto,
  C2BConfirmationResponseDto,
} from './dto/c2b-callback.dto';
import {
  ReconcileTransactionDto,
  QueryUnmatchedTransactionsDto,
  ManualReconciliationDto,
} from './dto/reconciliation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('mpesa')
@Controller('mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  // ==================== STK PUSH ====================

  @Post('stk-push')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
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
  @ApiOperation({ summary: 'Initiate STK Push payment request' })
  @ApiResponse({ status: 201, description: 'STK Push initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or invoice status' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  initiateSTKPush(
    @Body() dto: InitiateSTKPushDto,
    @CurrentUser() user: any,
  ) {
    return this.mpesaService.initiateSTKPush(dto, user?.id);
  }

  @Post('stk-push/callback')
  @Public()
  @UseGuards(PaymentCallbackGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'M-Pesa STK Push callback endpoint (internal use)',
  })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  handleSTKCallback(@Body() callback: STKPushCallbackDto) {
    return this.mpesaService.handleSTKCallback(callback);
  }

  @Post('stk-push/query')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Query STK Push transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved' })
  @ApiResponse({ status: 400, description: 'Failed to query status' })
  querySTKStatus(@Body() dto: QuerySTKStatusDto) {
    return this.mpesaService.querySTKStatus(dto);
  }

  // ==================== C2B CALLBACKS ====================

  @Post('c2b/validation')
  @Public()
  @UseGuards(PaymentCallbackGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'M-Pesa C2B validation endpoint (internal use)',
  })
  @ApiResponse({ status: 200, description: 'Validation response' })
  validateC2BPayment(
    @Body() dto: C2BValidationDto,
  ): Promise<C2BValidationResponseDto> {
    return this.mpesaService.validateC2BPayment(dto);
  }

  @Post('c2b/confirmation')
  @Public()
  @UseGuards(PaymentCallbackGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'M-Pesa C2B confirmation endpoint (internal use)',
  })
  @ApiResponse({ status: 200, description: 'Confirmation response' })
  confirmC2BPayment(
    @Body() dto: C2BCallbackDto,
  ): Promise<C2BConfirmationResponseDto> {
    return this.mpesaService.confirmC2BPayment(dto);
  }

  // ==================== RECONCILIATION ====================

  @Get('transactions/unmatched')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get unmatched M-Pesa transactions' })
  @ApiResponse({
    status: 200,
    description: 'Unmatched transactions retrieved',
  })
  queryUnmatchedTransactions(@Query() query: QueryUnmatchedTransactionsDto) {
    return this.mpesaService.queryUnmatchedTransactions(query);
  }

  @Post('reconcile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconcile M-Pesa transaction with invoice' })
  @ApiResponse({ status: 200, description: 'Transaction reconciled' })
  @ApiResponse({ status: 400, description: 'Invalid reconciliation action' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  reconcileTransaction(
    @Body() dto: ReconcileTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.mpesaService.reconcileTransaction(dto, user?.id);
  }

  @Post('reconcile/manual')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Manually reconcile M-Pesa payment (for offline payments)',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment manually reconciled',
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  manualReconciliation(
    @Body() dto: ManualReconciliationDto,
    @CurrentUser() user: any,
  ) {
    return this.mpesaService.manualReconciliation(dto, user?.id);
  }

  // ==================== TRANSACTION QUERIES ====================

  @Get('transactions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get M-Pesa transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransactionById(@Param('id') id: string) {
    return this.mpesaService.getTransactionById(id);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get M-Pesa transaction statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getTransactionStats() {
    return this.mpesaService.getTransactionStats();
  }
}
