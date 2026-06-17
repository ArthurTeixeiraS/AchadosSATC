import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { KeyListScreen } from "../screens/keys/KeyListScreen";
import { KeyDetailsScreen } from "../screens/keys/KeyDetailsScreen/index";
import { KeyFormScreen } from "../screens/keys/KeyFormScreen";
import { KeyMovementHistoryScreen } from "../screens/keys/KeyMovementHistoryScreen";
import { KeyWithdrawalScreen } from "../screens/keys/KeyWithdrawalScreen";

import { colors } from "../styles/colors";

export type KeyStackParamList = {
  KeyList: undefined;
  CreateKey: undefined;
  KeyDetails: {
    keyId: string;
    origin?: "HISTORY";
    originKeyId?: string;
  };
  EditKey: { keyId: string };
  KeyWithdrawal: { keyId: string };
  KeyMovementHistory: { keyId?: string } | undefined;
};

const Stack = createNativeStackNavigator<KeyStackParamList>();

export function KeyStackRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="KeyList"
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
      <Stack.Screen name="KeyList" component={KeyListScreen} />
      <Stack.Screen name="KeyDetails" component={KeyDetailsScreen} />
      <Stack.Screen name="CreateKey" component={KeyFormScreen} />
      <Stack.Screen name="EditKey" component={KeyFormScreen} />
      <Stack.Screen name="KeyWithdrawal" component={KeyWithdrawalScreen} />
      <Stack.Screen
        name="KeyMovementHistory"
        component={KeyMovementHistoryScreen}
      />
    </Stack.Navigator>
  );
}
