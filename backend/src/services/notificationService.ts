import prisma from '../utils/prisma';
import { broadcastToUser } from '../sockets/socketServer';
import { NotificationType } from '@prisma/client';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass'
    }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'production') {
        console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"IntelliDocX" <noreply@intellidocx.com>',
            to,
            subject,
            text
        });
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

export const createNotification = async (
  userId: string,
  organizationId: string,
  type: NotificationType,
  title: string,
  message: string
) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      organizationId,
      type,
      title,
      message,
    },
  });

  broadcastToUser(userId, 'NOTIFICATION', notification);

  // Send Email asynchronously
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.email) {
      sendEmail(user.email, title, message).catch(err => console.error('Email error', err));
  }

  return notification;
};

export const markAsRead = async (id: string, userId: string) => {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
};

export const getNotifications = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};
