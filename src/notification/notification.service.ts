import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Notification,
  NotificationType,
} from './notification.entity.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // =====================================================
  // CREATE NOTIFICATION
  // =====================================================

  async createNotification(
    playerId: string,
    title: string,
    message: string,
    type: NotificationType,
    link?: string,
  ) {
    const notification =
      this.notificationRepository.create({
        playerId,
        title,
        message,
        type,
        link: link ?? null,
        isRead: false,
      });

    return this.notificationRepository.save(
      notification,
    );
  }

  // =====================================================
  // SYSTEM NOTIFICATION
  // =====================================================

  async createSystemNotification(
    playerId: string,
    title: string,
    message: string,
    link?: string,
  ) {
    return this.createNotification(
      playerId,
      title,
      message,
      NotificationType.SYSTEM,
      link,
    );
  }

  // =====================================================
  // PAYMENT SUBMITTED
  // PLAYER
  // =====================================================

  async notifyPaymentSubmitted(
    playerId: string,
    amount: number | string,
    divisionId: string,
    transactionId: string,
  ) {
    return this.createNotification(
      playerId,
      'Payment Submitted',
      `Your payment of BDT ${amount} for division ${divisionId} has been submitted and is waiting for verification. Transaction ID: ${transactionId}.`,
      NotificationType.PAYMENT,
      '/payments',
    );
  }

  // =====================================================
  // PAYMENT SUBMITTED
  // SUPER ADMIN
  // =====================================================

  async notifySuperAdminPaymentSubmitted(
    playerId: string,
    amount: number | string,
    divisionId: string,
    transactionId: string,
  ) {
    return this.createNotification(
      'SUPERADMIN',
      'New Payment Submitted',
      `${playerId} submitted a payment of BDT ${amount} for division ${divisionId}. Transaction ID: ${transactionId}.`,
      NotificationType.PAYMENT,
      '/payments',
    );
  }

  // =====================================================
  // PAYMENT VERIFIED
  // PLAYER
  // =====================================================

  async notifyPaymentVerified(
    playerId: string,
    amount: number | string,
    divisionId: string,
  ) {
    return this.createNotification(
      playerId,
      'Payment Verified',
      `Your payment of BDT ${amount} for division ${divisionId} has been verified successfully.`,
      NotificationType.PAYMENT,
      '/payments',
    );
  }

  // =====================================================
  // PAYMENT REJECTED
  // PLAYER
  // =====================================================

  async notifyPaymentRejected(
    playerId: string,
    divisionId: string,
    rejectionReason?: string,
  ) {
    const reason = rejectionReason
      ? ` Reason: ${rejectionReason}`
      : '';

    return this.createNotification(
      playerId,
      'Payment Rejected',
      `Your payment for division ${divisionId} has been rejected.${reason}`,
      NotificationType.PAYMENT,
      '/payments',
    );
  }

  // =====================================================
  // FINE CREATED
  // PLAYER
  // =====================================================

  async notifyFineCreated(
    playerId: string,
    amount: number | string,
    reason?: string,
  ) {
    const fineReason = reason
      ? ` Reason: ${reason}`
      : '';

    return this.createNotification(
      playerId,
      'Fine Created',
      `A fine of BDT ${amount} has been added to your account.${fineReason}`,
      NotificationType.PAYMENT,
      '/payments',
    );
  }

  // =====================================================
  // MATCH RESULT SUBMITTED
  // BOTH PLAYERS
  // =====================================================

  async notifyMatchResultSubmitted(
    matchId: string,
    homePlayerId: string,
    awayPlayerId: string,
    homeScore: number,
    awayScore: number,
  ) {
    const message =
      `Match ${matchId}: ${homePlayerId} ${homeScore} - ${awayScore} ${awayPlayerId}. The match result has been submitted.`;

    const notifications = [];

    notifications.push(
      await this.createNotification(
        homePlayerId,
        'Match Result Submitted',
        message,
        NotificationType.MATCH_RESULT,
        `/player/${homePlayerId}/matches`,
      ),
    );

    if (
      awayPlayerId !==
      homePlayerId
    ) {
      notifications.push(
        await this.createNotification(
          awayPlayerId,
          'Match Result Submitted',
          message,
          NotificationType.MATCH_RESULT,
          `/player/${awayPlayerId}/matches`,
        ),
      );
    }

    return notifications;
  }

  // =====================================================
  // GET PLAYER NOTIFICATIONS
  // =====================================================

  async getMyNotifications(
    playerId: string,
  ) {
    return this.notificationRepository.find({
      where: {
        playerId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100,
    });
  }

  // =====================================================
  // GET SUPER ADMIN NOTIFICATIONS
  // =====================================================

  async getSuperAdminNotifications() {
    return this.notificationRepository.find({
      where: {
        playerId: 'SUPERADMIN',
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100,
    });
  }

  // =====================================================
  // GET UNREAD COUNT
  // =====================================================

  async getUnreadCount(
    playerId: string,
  ) {
    return this.notificationRepository.count({
      where: {
        playerId,
        isRead: false,
      },
    });
  }

  // =====================================================
  // GET SUPER ADMIN UNREAD COUNT
  // =====================================================

  async getSuperAdminUnreadCount() {
    return this.notificationRepository.count({
      where: {
        playerId: 'SUPERADMIN',
        isRead: false,
      },
    });
  }

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  async markAsRead(
    notificationId: number,
    playerId: string,
  ) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          id: notificationId,
          playerId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found.',
      );
    }

    if (!notification.isRead) {
      notification.isRead = true;

      await this.notificationRepository.save(
        notification,
      );
    }

    return {
      success: true,
      message:
        'Notification marked as read.',
      notification,
    };
  }

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  async markAllAsRead(
    playerId: string,
  ) {
    await this.notificationRepository.update(
      {
        playerId,
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return {
      success: true,
      message:
        'All notifications marked as read.',
    };
  }

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  async remove(
    notificationId: number,
    playerId: string,
  ) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          id: notificationId,
          playerId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found.',
      );
    }

    await this.notificationRepository.remove(
      notification,
    );

    return {
      success: true,
      message:
        'Notification deleted successfully.',
    };
  }

  // =====================================================
  // TEST NOTIFICATION
  // SUPER ADMIN ONLY
  // =====================================================

  async sendTestNotification(
    playerId: string,
  ) {
    return this.createSystemNotification(
      playerId,
      'Test Notification',
      'This is a test notification from the Thrill Seekers system.',
      '/notifications',
    );
  }
}