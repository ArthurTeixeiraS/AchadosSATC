import React from "react";
import { View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "react-native-paper";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Feather.glyphMap;
}

export function EmptyState({
  title,
  message,
  icon = "inbox",
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={40} color={colors.textSecondary} />

      <Text style={styles.title}>{title}</Text>

      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}