import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RecursosScreen } from "../screens/admin/RecursosScreen";
import { CreateResourceScreen } from "../screens/admin/CreateResourceScreen/index";

export type RecursosStackParamList = {
  RecursosList: undefined;
  CreateResource: undefined;
};

const Stack = createNativeStackNavigator<RecursosStackParamList>();

export function RecursosStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecursosList" component={RecursosScreen} />
      <Stack.Screen name="CreateResource" component={CreateResourceScreen} />
    </Stack.Navigator>
  );
}