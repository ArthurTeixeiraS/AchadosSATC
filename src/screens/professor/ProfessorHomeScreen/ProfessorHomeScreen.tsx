import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

export function ProfessorHomeScreen() {
  const { reloadUser } = useAuth();
  const { refreshing, refresh } = useManualRefresh({
    onRefresh: reloadUser,
    errorMessage:
      "Não foi possível atualizar seus dados. Tente novamente.",
  });

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.placeholder}>
          <Text variant="titleLarge">Professor</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
