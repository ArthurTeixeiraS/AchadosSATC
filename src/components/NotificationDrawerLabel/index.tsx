import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { useNotifications } from "../../contexts/NotificationContext";
import { styles } from "./styles";

type Props = {
  color: string;
};

export function NotificationDrawerLabel({ color }: Props) {
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color }]}>Notificações</Text>

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}
