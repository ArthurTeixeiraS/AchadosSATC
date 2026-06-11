import React from "react";
import { TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { DrawerActions } from "@react-navigation/native";

import { AppHeaderTitle } from "../components/AppHeaderTitle";
import { colors } from "../styles/colors";

type HeaderConfig = {
  title: string;
  subtitle?: string;
  showMenu?: boolean;
  onBack?: () => void;
};

export function getDrawerHeaderOptions(
  navigation: any,
  config: HeaderConfig
) {
  const showMenu = config.showMenu ?? true;

  return {
    headerTitle: () => (
      <AppHeaderTitle title={config.title} subtitle={config.subtitle} />
    ),
    headerLeft: () => (
      <TouchableOpacity
        activeOpacity={0.7}
        hitSlop={12}
        onPress={
          showMenu
            ? () => navigation.dispatch(DrawerActions.openDrawer())
            : config.onBack
        }
      >
        <Feather
          name={showMenu ? "menu" : "arrow-left"}
          size={24}
          color={colors.white}
        />
      </TouchableOpacity>
    ),
    swipeEnabled: showMenu,
  };
}
