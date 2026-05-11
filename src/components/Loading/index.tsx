import React from "react";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

import { colors } from "../../styles/colors";
import { styles } from "./styles";

interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Carregando..." }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}