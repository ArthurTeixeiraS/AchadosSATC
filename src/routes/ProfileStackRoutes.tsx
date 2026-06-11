import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfileScreen } from "../screens/shared/ProfileScreen";
import { EditProfileScreen } from "../screens/shared/EditProfileScreen";

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
      />
    </Stack.Navigator>
  );
}
