import React from "react";
import { Text } from "react-native-paper";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";
import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";

export function DashboardScreen() {
  return (
    <ScreenContainer>
      <PageTitle
        title="Dashboard"
        subtitle="Resumo operacional da ferramentaria"
      />

      <AppCard>
        <Text>Solicitações pendentes: 0</Text>
      </AppCard>

      <AppCard>
        <Text>Chaves retiradas: 0</Text>
      </AppCard>

      <AppCard>
        <Text>Ocorrências abertas: 0</Text>
      </AppCard>

      <AppCard>
        <EmptyState
          icon="clipboard"
          title="Nenhuma solicitação pendente"
          message="As solicitações feitas pelos professores aparecerão aqui."
        />
      </AppCard>
    </ScreenContainer>
  );
}