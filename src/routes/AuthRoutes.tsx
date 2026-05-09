import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../screens/auth/LoginScreen/LoginScreen";

const Stack = createNativeStackNavigator();

export function AuthRoutes() {
  //Controle de rotas para quando não há usuário autenticado
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}