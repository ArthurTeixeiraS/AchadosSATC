import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfileScreen } from "../screens/shared/ProfileScreen";
import { EditProfileScreen } from "../screens/shared/EditProfileScreen";

import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackRoutes() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: typography.fontFamily.bold },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Alteração de Perfil" }}
      />
    </Stack.Navigator>
  );
}
