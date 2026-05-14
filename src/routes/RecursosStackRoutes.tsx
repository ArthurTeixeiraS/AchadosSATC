import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RecursosScreen } from "../screens/admin/ResourceScreen";
import { CreateResourceScreen } from "../screens/admin/CreateResourceScreen";
import { EditResourceScreen } from "../screens/admin/EditResourceScreen";

import { Resource, ResourceType } from "../types/Resources";

export type RecursosStackParamList = {
  RecursosList: undefined;
  CreateResource:
  | {
    initialType?: ResourceType;
  }
  | undefined;
  EditResource: {
    resource: Resource;
  };
};

const Stack = createNativeStackNavigator<RecursosStackParamList>();

export function RecursosStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecursosList" component={RecursosScreen} />
      <Stack.Screen name="CreateResource" component={CreateResourceScreen} />
      <Stack.Screen name="EditResource" component={EditResourceScreen} />
    </Stack.Navigator>
  );
}