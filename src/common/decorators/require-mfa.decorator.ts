import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MFA_KEY = 'requireMfa';
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);