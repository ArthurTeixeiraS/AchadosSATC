import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { KeysListScreen } from "../screens/keys/KeysListScreen";
import { KeyDetailsScreen } from "../screens/keys/KeyDetailsScreen/index";
import { KeyFormScreen } from "../screens/keys/KeyFormScreen";

import { colors } from "../styles/colors";

export type KeysStackParamList = {
  KeysList: undefined;
  KeyCreate: undefined;
  KeyDetails: { chaveId: string }; 
  KeyEdit: { chaveId: string };    
};

const Stack = createNativeStackNavigator<KeysStackParamList>();

export function KeysStackRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="KeysList"
      screenOptions={{
        
        headerShown: false, 
        
        headerStyle: {
          backgroundColor: colors.primary, 
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitle: "",
      }}
    >
      <Stack.Screen name="KeysList" component={KeysListScreen} />
      <Stack.Screen name="KeyDetails" component={KeyDetailsScreen} />
      <Stack.Screen name="KeyCreate" component={KeyFormScreen} />
      <Stack.Screen name="KeyEdit" component={KeyFormScreen} />
    </Stack.Navigator>
  );
}