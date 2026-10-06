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
    playerId: string | null,
    recipientId: string,
    title: string,
    message: string,
    type: NotificationType,
    link?: string,
  ) {
    const notification =
      this.notificationRepository.create({
        playerId,
        recipientId,
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
    playerId: null,
    recipientId: 'SUPERADMIN',
    amount: number | string,
    divisionId: string,
    transactionId: string,
  ) {
    return this.createNotification(
      null,
      recipientId,
      'New Payment Submitted',
      `A player submitted a payment of BDT ${amount} for division ${divisionId}. Transaction ID: ${transactionId}.`,
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
        recipientId: playerId,
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
        recipientId: 'SUPERADMIN',
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
        recipientId: playerId,
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
        recipientId: 'SUPERADMIN',
        isRead: false,
      },
    });
  }

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  async markAsRead(
    notificationId: number,
    recipientId: string,
  ) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          id: notificationId,
          recipientId,
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
    recipientId: string,
  ) {
    await this.notificationRepository.update(
      {
        recipientId,
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
    recipientId: string,
  ) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          id: notificationId,
          recipientId,
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