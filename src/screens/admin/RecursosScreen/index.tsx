import React from "react";
import { Text } from "react-native-paper";
import { AllFilters } from "../../../components/Allfilters";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";

export function RecursosScreen() {
  return (
    <ScreenContainer>
          <PageTitle
            title="Recursos"
            subtitle="Gerencie e monitore o status de todas as ferramentas."
          />
          <AllFilters
            filters={[
              "Todas",
              "Elétricas",
              "Manuais",
              "Medição"
            ]}
          />
    </ScreenContainer>
  );
}