import { Injectable } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private notifications: AppNotification[] = [];

  getAll(): AppNotification[] {
    return [...this.notifications];
  }

  getUnread(): AppNotification[] {
    return this.notifications.filter((n) => !n.read);
  }

  add(notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>): void {
    this.notifications.unshift({
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      timestamp: new Date(),
    });
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  clear(): void {
    this.notifications = [];
  }
}
