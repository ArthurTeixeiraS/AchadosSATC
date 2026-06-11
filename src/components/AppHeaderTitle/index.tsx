import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { styles } from "./styles";

type Props = {
  title: string;
  subtitle?: string;
};

export function AppHeaderTitle({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      {!!subtitle && (
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
