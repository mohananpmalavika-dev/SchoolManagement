import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_CHECK_KEY = 'skipTenantCheck';

/**
 * Decorator to skip tenant context requirement
 * Use for platform admin routes or routes that work across tenants
 */
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);
