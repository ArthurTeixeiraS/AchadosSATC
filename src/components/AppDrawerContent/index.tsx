import React from "react";
import { TouchableOpacity, View } from "react-native";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../styles/colors";
import { styles } from "./styles";

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { appUser, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const role =
    appUser?.tipoUsuario === "FUNCIONARIO" ? "Funcionário" : "Professor";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => props.navigation.navigate("Perfil")}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 22,
          },
        ]}
      >
        <View style={styles.avatar}>
          <Feather name="user" size={30} color={colors.white} />
        </View>

        <View style={styles.userInfo}>
          <Text numberOfLines={1} style={styles.userName}>
            {appUser?.nomeCompleto}
          </Text>
          <Text style={styles.userRole}>{role}</Text>
        </View>
      </TouchableOpacity>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.items}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <DrawerItem
          label="Sair da conta"
          icon={({ size }) => (
            <Feather name="log-out" size={size} color={colors.error} />
          )}
          labelStyle={styles.logoutLabel}
          onPress={logout}
        />
      </View>
    </View>
  );
}
