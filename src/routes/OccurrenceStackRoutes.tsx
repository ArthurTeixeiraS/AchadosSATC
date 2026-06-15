import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { OccurrenceListScreen } from "../screens/shared/occurrences/OccurrenceListScreen";
import { CreateOccurrenceScreen } from "../screens/shared/occurrences/CreateOccurrenceScreen";
import { OccurrenceDetailsScreen } from "../screens/shared/occurrences/OccurrenceDetailsScreen";

export type OccurrenceStackParamList = {
  OccurrenceList: undefined;
  CreateOccurrence: undefined;
  OccurrenceDetails: {
    occurrenceId: string;
    origin?: "AUDITORIA";
  };
};

const Stack = createNativeStackNavigator<OccurrenceStackParamList>();

export function OccurrenceStackRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OccurrenceList" component={OccurrenceListScreen} />
      <Stack.Screen
        name="CreateOccurrence"
        component={CreateOccurrenceScreen}
      />
      <Stack.Screen
        name="OccurrenceDetails"
        component={OccurrenceDetailsScreen}
      />
    </Stack.Navigator>
  );
}
