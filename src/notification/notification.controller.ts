import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';

import { NotificationService } from './notification.service.js';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  // =====================================================
  // GET MY NOTIFICATIONS
  // PLAYER / ADMIN / SUPERADMIN
  // =====================================================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(
    @Req() req: Request,
  ) {
    const user = req.user as {
      playerId?: string;
      userType?: string;
    };

    
    const userType =
      user.userType?.toLowerCase();

    if (
      userType ===
      'superadmin'
    ) {
      return this.notificationService.getSuperAdminNotifications();
    }

    if (!user.playerId) {
      return [];
    }

    return this.notificationService.getMyNotifications(
      user.playerId,
    );
  }

  // =====================================================
  // GET UNREAD COUNT
  // PLAYER / ADMIN / SUPERADMIN
  // =====================================================

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(
    @Req() req: Request,
  ) {
    const user = req.user as {
      playerId?: string;
      userType?: string;
    };

    const userType =
      user.userType?.toLowerCase();

    if (
      userType ===
      'superadmin'
    ) {
      const count =
        await this.notificationService.getSuperAdminUnreadCount();

      return {
        count,
      };
    }

    if (!user.playerId) {
      return {
        count: 0,
      };
    }

    const count =
      await this.notificationService.getUnreadCount(
        user.playerId,
      );

    return {
      count,
    };
  }

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @Param(
      'id',
      ParseIntPipe,
    )
    notificationId: number,

    @Req() req: Request,
  ) {
    const user = req.user as {
      playerId?: string;
      userType?: string;
    };

    const userType =
      user.userType?.toLowerCase();

    const recipientId =
      userType === 'superadmin'
        ? 'SUPERADMIN'
        : user.playerId;

    if (!recipientId) {
      return {
        success: false,
        message:
          'Notification recipient information not found.',
      };
    }

    return this.notificationService.markAsRead(
      notificationId,
      recipientId,
    );
  }

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(
    @Req() req: Request,
  ) {
    const user = req.user as {
      playerId?: string;
      userType?: string;
    };

    const userType =
      user.userType?.toLowerCase();

    const recipientId =
      userType === 'superadmin'
        ? 'SUPERADMIN'
        : user.playerId;

    if (!recipientId) {
      return {
        success: false,
        message:
          'Notification recipient information not found.',
      };
    }

    return this.notificationService.markAllAsRead(
      recipientId,
    );
  }

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param(
      'id',
      ParseIntPipe,
    )
    notificationId: number,

    @Req() req: Request,
  ) {
    const user = req.user as {
      playerId?: string;
      userType?: string;
    };

    const userType =
      user.userType?.toLowerCase();

    const recipientId =
      userType === 'superadmin'
        ? 'SUPERADMIN'
        : user.playerId;

    if (!recipientId) {
      return {
        success: false,
        message:
          'Notification recipient information not found.',
      };
    }

    return this.notificationService.remove(
      notificationId,
      recipientId,
    );
  }

  // =====================================================
  // TEST NOTIFICATION
  // SUPER ADMIN ONLY
  // =====================================================

  @Post('test/:playerId')
  @UseGuards(
    JwtAuthGuard,
    SuperAdminGuard,
  )
  async sendTestNotification(
    @Param('playerId')
    playerId: string,
  ) {
    return this.notificationService.sendTestNotification(
      playerId,
    );
  }
}