import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../screens/auth/LoginScreen/LoginScreen";

import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();

export function AuthRoutes() {
  //Controle de rotas para quando não há usuário autenticado
  return (
    <>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </>
  );
}