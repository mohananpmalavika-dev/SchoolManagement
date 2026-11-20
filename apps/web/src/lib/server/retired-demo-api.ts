/** Old preview contracts are deliberately not forwarded to production services. */
export async function retiredDemoApi(request: Request): Promise<Response> {
  const resource = new URL(request.url).pathname.split('/')[2];
  const replacements: Record<string, string> = {
    admissions: '/api/v1/operations/admissions (staff), /api/v1/school-public/applications (public)',
    substitution: '/api/v1/operations/substitutions',
    'smart-attendance': '/api/v1/check-in/sessions and /api/v1/check-in/scan; /api/v1/operations/absences; /api/v1/hrms for staff attendance',
    ptm: '/api/v1/bookings',
    transport: '/api/v1/operations-transport',
  };
  return Response.json({
    success: false,
    message: 'This preview API has been retired. Reload the school workspace to use saved school records.',
    replacement: replacements[resource],
  }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
}
