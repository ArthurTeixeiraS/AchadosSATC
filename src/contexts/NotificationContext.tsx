import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";

import { useAuth } from "./AuthContext";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeUserNotifications,
  syncOverdueNotifications,
} from "../services/notifications/notificationServices";
import { AppNotification } from "../types/Notification";

type FirebaseSubscriptionError = Error & {
  code?: string;
};

type NotificationContextData = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  syncOverdue: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextData>(
  {} as NotificationContextData
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function syncOverdue() {
    if (!appUser) return;

    try {
      await syncOverdueNotifications(appUser.id, appUser.tipoUsuario);
    } catch (syncError) {
      console.log("Erro ao sincronizar notificações de atraso:", syncError);
    }
  }

  useEffect(() => {
    if (!appUser) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    void syncOverdue();

    const unsubscribe = subscribeUserNotifications(
      appUser.id,
      (items) => {
        setNotifications(items);
        setError(null);
        setLoading(false);
      },
      (subscriptionError) => {
        const firebaseError =
          subscriptionError as FirebaseSubscriptionError;

        console.log(
          "Erro ao acompanhar notificações:",
          firebaseError.code,
          firebaseError.message
        );
        setError(
          firebaseError.code === "permission-denied"
            ? "Sem permissão para carregar as notificações. Confirme se as regras publicadas pertencem ao projeto ferramentaria-satc."
            : `Não foi possível carregar as notificações${
                firebaseError.code ? ` (${firebaseError.code})` : ""
              }.`
        );
        setLoading(false);
      }
    );
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") {
          void syncOverdue();
        }
      }
    );

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [appUser?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.lida).length,
    [notifications]
  );

  async function markAsRead(notificationId: string) {
    if (!appUser) return;
    await markNotificationAsRead(appUser.id, notificationId);
  }

  async function markAllAsRead() {
    if (!appUser || unreadCount === 0) return;
    await markAllNotificationsAsRead(appUser.id);
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        syncOverdue,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
