import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { EnhancedJwtAuthGuard } from '../guards/enhanced-jwt-auth.guard';
import { User } from '../../users/entities/user.entity';

@Controller('auth/sessions')
@ApiTags('Session Management')
@UseGuards(EnhancedJwtAuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ summary: 'Get user active sessions' })
  async getUserSessions(@CurrentUser() user: User) {
    return this.sessionService.getUserSessions(user.id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get session analytics' })
  async getSessionAnalytics(@CurrentUser() user: User) {
    return this.sessionService.getSessionAnalytics(user.id);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: User,
  ) {
    await this.sessionService.revokeSession(sessionId, user.id);
  }

  @Post('revoke-others')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke all other sessions except current' })
  async revokeOtherSessions(
    @CurrentUser() user: User,
    @Param('currentSessionId') currentSessionId: string,
  ) {
    await this.sessionService.revokeOtherSessions(user.id, currentSessionId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get active session count' })
  async getActiveSessionCount(@CurrentUser() user: User) {
    const count = await this.sessionService.getActiveSessionCount(user.id);
    return { activeSessions: count };
  }
}
