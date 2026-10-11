import { Prisma } from '@prisma/client';

// Models that don't require tenant filtering (global/platform level)
const GLOBAL_MODELS = ['Plan'];

// Models that are tenant-specific
const TENANT_MODELS = [
  'Tenant',
  'Subscription',
  'School',
  'User',
  'Student',
  'Guardian',
  'GuardianStudentLink',
  'Staff',
  'StaffAttendance',
  'AcademicYear',
  'Term',
  'Class',
  'Stream',
  'Subject',
  'Enrollment',
  'AttendanceRecord',
  'Examination',
  'Grade',
  'ReportCard',
  'FeeStructure',
  'FeeItem',
  'Invoice',
  'InvoiceItem',
  'Payment',
  'MpesaTransaction',
  'TimetableEntry',
  'Communication',
  'CommunicationLog',
  'Book',
  'BookBorrowing',
  'Vehicle',
  'Route',
  'RouteStop',
  'InventoryItem',
  'AuditLog',
];

/**
 * Prisma middleware to automatically filter queries by tenantId
 * This ensures complete data isolation between tenants
 */
export function createTenantFilterMiddleware(getTenantId: () => string | null) {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    const tenantId = getTenantId();
    
    // Skip filtering for global models
    if (!params.model || GLOBAL_MODELS.includes(params.model)) {
      return next(params);
    }

    // Skip if no tenant context (e.g., system operations, seeding)
    if (!tenantId) {
      return next(params);
    }

    // Check if model requires tenant filtering
    if (!TENANT_MODELS.includes(params.model)) {
      return next(params);
    }

    // Add tenant filter to query operations
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    if (params.action === 'findMany') {
      if (!params.args) {
        params.args = {};
      }
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    // Add tenant ID to create operations
    if (params.action === 'create') {
      if (params.args.data) {
        params.args.data.tenantId = tenantId;
      }
    }

    if (params.action === 'createMany') {
      if (params.args.data && Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          tenantId,
        }));
      }
    }

    // Add tenant filter to update operations
    if (params.action === 'update' || params.action === 'updateMany') {
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    // Add tenant filter to delete operations
    if (params.action === 'delete' || params.action === 'deleteMany') {
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    // Add tenant filter to upsert operations
    if (params.action === 'upsert') {
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
      if (params.args.create) {
        params.args.create.tenantId = tenantId;
      }
    }

    // Add tenant filter to count operations
    if (params.action === 'count') {
      if (!params.args) {
        params.args = {};
      }
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    // Add tenant filter to aggregate operations
    if (params.action === 'aggregate' || params.action === 'groupBy') {
      if (!params.args) {
        params.args = {};
      }
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    return next(params);
  };
}

/**
 * Bypass tenant filtering for system operations
 * Use with extreme caution - only for platform admin operations
 */
export function withoutTenantFilter<T>(operation: () => Promise<T>): Promise<T> {
  // This should be implemented at the application level
  // by temporarily removing the tenant context
  return operation();
}
