import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ResourceScreen } from "../screens/admin/ResourceScreen";
import { CreateResourceScreen } from "../screens/admin/CreateResourceScreen";
import { EditResourceScreen } from "../screens/admin/EditResourceScreen";
import { ResourceDetailsScreen } from "../screens/admin/ResourceDetailsScreen";

import { Resource, ResourceType } from "../types/Resources";

export type ResourceStackParamList = {
  ResourceList: undefined;
  CreateResource:
  | {
    initialType?: ResourceType;
    duplicateFrom?: Resource;
  }
  | undefined;
  EditResource: {
    resource: Resource;
  }
  ResourceDetails: {
    resource: Resource;
    origin?: "AUDITORIA";
  };
};

const Stack = createNativeStackNavigator<ResourceStackParamList>();

export function ResourceStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResourceList" component={ResourceScreen} />
      <Stack.Screen name="CreateResource" component={CreateResourceScreen} />
      <Stack.Screen name="EditResource" component={EditResourceScreen} />
      <Stack.Screen name="ResourceDetails" component={ResourceDetailsScreen} />
    </Stack.Navigator>
  );
}
