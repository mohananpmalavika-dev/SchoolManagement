import { Prisma } from '@prisma/client';
const directModels = new Set([
  'PreschoolStaffAssignment', 'PreschoolDayRecord', 'DevelopmentObservation', 'PreschoolContent',
  'ClassroomCamera', 'ClassroomCameraConsent', 'TransportAlert',
  'Subscription', 'School', 'User', 'Student', 'Guardian', 'Staff', 'StaffAttendance',
  'AcademicYear', 'Term', 'Class', 'Stream', 'Subject', 'Enrollment', 'AttendanceRecord',
  'Examination', 'Grade', 'ReportCard', 'FeeStructure', 'Invoice', 'Payment', 'PaymentGatewayTransaction',
  'TimetableEntry', 'SchoolEvent', 'Communication', 'MessageTemplate', 'Book', 'BookBorrowing',
  'Vehicle', 'Route', 'InventoryItem', 'AuditLog', 'SupportTicket', 'Assignment',
  'AssignmentSubmission', 'LearningMaterial',
  'AdmissionRecord', 'AbsenceRequest', 'PortfolioEntry', 'SubstitutionDuty', 'QuizDefinition', 'QuizAttempt', 'TravelAssignment', 'TransportJourney', 'TripPassenger', 'IssuedCertificate',
  'ActivityFeed', 'MediaItem', 'BehaviorRecord', 'TeacherAvailability', 'ParentTeacherBooking',
  'UdiseIntegration', 'UdiseSyncLog', 'UdiseStudentRecord', 'UdiseStaffRecord',
  'BoardIntegration', 'BoardSyncLog', 'BoardExamRegistration',
  'ComplianceReport', 'ComplianceChecklist', 'DataQualityAudit', 'GovernmentApiLog', 'ComplianceAlert'
]);
const relations: Record<string, string> = { GuardianStudentLink: 'guardian', FeeItem: 'feeStructure', InvoiceItem: 'invoice', CommunicationLog: 'communication', RouteStop: 'route', ExaminationSubject: 'examination' };
const reads = new Set(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']);
export function createTenantFilterMiddleware(getTenantId: () => string | null) {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    const tenantId = getTenantId(); const model = params.model;
    if (!tenantId || !model || model === 'Plan' || model === 'Announcement') return next(params);
    const direct = directModels.has(model); const relation = relations[model];
    if (!direct && !relation && model !== 'Tenant') return next(params);
    params.args ||= {};
    if (reads.has(params.action)) {
      if (params.action === 'findUnique') {
        params.action = 'findFirst';
      } else if (params.action === 'findUniqueOrThrow') {
        params.action = 'findFirstOrThrow';
      }
      const filter = model === 'Tenant' ? { id: tenantId } : direct ? { tenantId } : { [relation]: { tenantId } };
      params.args.where = { ...params.args.where, ...filter };
    }
    if (direct && (params.action === 'create' || params.action === 'upsert')) {
      const data = params.action === 'upsert' ? params.args.create : params.args.data;
      if (data) { if (data.tenantId && data.tenantId !== tenantId) throw new Error('Cross-tenant write denied'); data.tenantId = tenantId; }
    }
    if (direct && params.action === 'createMany') {
      const items = Array.isArray(params.args.data) ? params.args.data : [params.args.data];
      params.args.data = items.map((item: any) => { if (item.tenantId && item.tenantId !== tenantId) throw new Error('Cross-tenant write denied'); return { ...item, tenantId }; });
    }
    if (direct && params.args.data?.tenantId && params.args.data.tenantId !== tenantId) throw new Error('Tenant reassignment denied');
    return next(params);
  };
}
