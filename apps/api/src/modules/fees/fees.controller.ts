import { SchoolRecordAccessGuard } from '../../common/guards/school-record-access.guard';
import { UseGuards as ScopedGuard } from '@nestjs/common';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('fees')
@ApiBearerAuth()
@Controller('fees')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ScopedGuard(SchoolRecordAccessGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // ==================== FEE STRUCTURES ====================

  @Post('structures')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new fee structure' })
  @ApiResponse({ status: 201, description: 'Fee structure created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Term or class not found' })
  createFeeStructure(@Body() createFeeStructureDto: CreateFeeStructureDto) {
    return this.feesService.createFeeStructure(createFeeStructureDto);
  }

  @Get('structures')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get all fee structures with optional filters' })
  @ApiQuery({ name: 'termId', required: false, description: 'Filter by term ID' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filter by class ID' })
  @ApiResponse({ status: 200, description: 'Fee structures retrieved successfully' })
  findAllFeeStructures(
    @Query('termId') termId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.feesService.findAllFeeStructures(termId, classId);
  }

  @Get('structures/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get fee structure by ID' })
  @ApiParam({ name: 'id', description: 'Fee structure ID' })
  @ApiResponse({ status: 200, description: 'Fee structure retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  findOneFeeStructure(@Param('id') id: string) {
    return this.feesService.findOneFeeStructure(id);
  }

  @Delete('structures/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a fee structure' })
  @ApiParam({ name: 'id', description: 'Fee structure ID' })
  @ApiResponse({ status: 200, description: 'Fee structure deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  deactivateFeeStructure(@Param('id') id: string) {
    return this.feesService.deactivateFeeStructure(id);
  }

  // ==================== INVOICES ====================

  @Post('invoices')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice for a student' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Student or term not found' })
  @ApiResponse({ status: 409, description: 'Invoice already exists for this student and term' })
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.feesService.createInvoice(createInvoiceDto);
  }

  @Post('invoices/generate-bulk')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate invoices in bulk from a fee structure' })
  @ApiResponse({ status: 201, description: 'Invoices generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or fee structure not active' })
  @ApiResponse({ status: 404, description: 'Fee structure not found' })
  generateInvoices(@Body() generateInvoicesDto: GenerateInvoicesDto) {
    return this.feesService.generateInvoices(generateInvoicesDto);
  }

  @Get('invoices')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Get all invoices with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  findAllInvoices(@Query() query: QueryInvoicesDto) {
    return this.feesService.findAllInvoices(query);
  }

  @Get('invoices/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get invoice by ID with full details' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOneInvoice(@Param('id') id: string) {
    return this.feesService.findOneInvoice(id);
  }

  @Patch('invoices/:id/cancel')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel invoice with payments' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  cancelInvoice(@Param('id') id: string) {
    return this.feesService.cancelInvoice(id);
  }

  // ==================== PAYMENTS ====================

  @Post('payments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new payment for an invoice' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment amount or invoice status' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 409, description: 'Duplicate payment reference' })
  recordPayment(
    @Body() recordPaymentDto: RecordPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.feesService.recordPayment(recordPaymentDto, user?.id);
  }

  @Get('payments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Get all payments with optional invoice filter' })
  @ApiQuery({ name: 'invoiceId', required: false, description: 'Filter by invoice ID' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAllPayments(@Query('invoiceId') invoiceId?: string) {
    return this.feesService.findAllPayments(invoiceId);
  }

  @Get('payments/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get payment by ID with full details' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOnePayment(@Param('id') id: string) {
    return this.feesService.findOnePayment(id);
  }

  // ==================== FINANCIAL REPORTS ====================

  @Get('reports/financial-summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get financial summary for fee collection' })
  @ApiQuery({ name: 'termId', required: false, description: 'Filter by term ID' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved successfully' })
  getFinancialSummary(@Query('termId') termId?: string) {
    return this.feesService.getFinancialSummary(termId);
  }
}
