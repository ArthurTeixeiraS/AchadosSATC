import React, { createContext, useContext, useState } from "react";

import {
  SelectedMachine,
  SelectedTool,
  Solicitation,
  SolicitationDraft,
  SolicitationShift,
} from "../types/Solicitation";
import { Resource } from "../types/Resources";

export type SolicitationFlowMode = "CREATE" | "DUPLICATE" | "EDIT";

interface SolicitationDraftContextData {
  draft: SolicitationDraft;
  editingSolicitation: Solicitation | null;
  flowMode: SolicitationFlowMode;
  sourceSolicitationId?: string;

  setBasicInfo: (data: {
    dataUtilizacao: string;
    turno: SolicitationShift;
    atividade: string;
  }) => void;

  addMachine: (machine: Resource) => void;
  removeMachine: (resourceId: string) => void;

  addTool: (tool: Resource) => void;
  removeTool: (resourceId: string) => void;
  updateToolQuantity: (resourceId: string, quantidade: number) => void;

  setObservacoes: (observacoes: string) => void;
  replaceDraft: (
    draft: SolicitationDraft,
    options?: {
      flowMode?: Extract<SolicitationFlowMode, "CREATE" | "DUPLICATE">;
      sourceSolicitationId?: string;
    }
  ) => void;
  startEditing: (solicitation: Solicitation, draft: SolicitationDraft) => void;
  clearDraft: () => void;
}

const initialDraft: SolicitationDraft = {
  dataUtilizacao: "",
  turno: "",
  atividade: "",
  maquinasSelecionadas: [],
  ferramentasSelecionadas: [],
  observacoes: "",
};

const SolicitationDraftContext = createContext<SolicitationDraftContextData>(
  {} as SolicitationDraftContextData
);

export function SolicitationDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<SolicitationDraft>(initialDraft);
  const [editingSolicitation, setEditingSolicitation] =
    useState<Solicitation | null>(null);
  const [flowMode, setFlowMode] =
    useState<SolicitationFlowMode>("CREATE");
  const [sourceSolicitationId, setSourceSolicitationId] = useState<
    string | undefined
  >(undefined);

  function setBasicInfo(data: {
    dataUtilizacao: string;
    turno: SolicitationShift;
    atividade: string;
  }) {
    setDraft((oldDraft) => ({
      ...oldDraft,
      ...data,
    }));
  }

  function addMachine(machine: Resource) {
    setDraft((oldDraft) => {
      const alreadySelected = oldDraft.maquinasSelecionadas.some(
        (item) => item.resource.id === machine.id
      );

      if (alreadySelected) {
        return oldDraft;
      }

      const newMachine: SelectedMachine = {
        resource: machine,
      };

      return {
        ...oldDraft,
        maquinasSelecionadas: [
          ...oldDraft.maquinasSelecionadas,
          newMachine,
        ],
      };
    });
  }

  function removeMachine(resourceId: string) {
    setDraft((oldDraft) => ({
      ...oldDraft,
      maquinasSelecionadas: oldDraft.maquinasSelecionadas.filter(
        (item) => item.resource.id !== resourceId
      ),
    }));
  }

  function addTool(tool: Resource) {
    setDraft((oldDraft) => {
      const alreadySelected = oldDraft.ferramentasSelecionadas.some(
        (item) => item.resource.id === tool.id
      );

      if (alreadySelected) {
        return oldDraft;
      }

      const newTool: SelectedTool = {
        resource: tool,
        quantidade: 1,
      };

      return {
        ...oldDraft,
        ferramentasSelecionadas: [
          ...oldDraft.ferramentasSelecionadas,
          newTool,
        ],
      };
    });
  }

  function removeTool(resourceId: string) {
    setDraft((oldDraft) => ({
      ...oldDraft,
      ferramentasSelecionadas: oldDraft.ferramentasSelecionadas.filter(
        (item) => item.resource.id !== resourceId
      ),
    }));
  }

  function updateToolQuantity(resourceId: string, quantidade: number) {
    if (quantidade <= 0) {
      removeTool(resourceId);
      return;
    }

    setDraft((oldDraft) => ({
      ...oldDraft,
      ferramentasSelecionadas: oldDraft.ferramentasSelecionadas.map((item) =>
        item.resource.id === resourceId
          ? {
              ...item,
              quantidade,
            }
          : item
      ),
    }));
  }

  function setObservacoes(observacoes: string) {
    setDraft((oldDraft) => ({
      ...oldDraft,
      observacoes,
    }));
  }

  function replaceDraft(
    newDraft: SolicitationDraft,
    options?: {
      flowMode?: Extract<SolicitationFlowMode, "CREATE" | "DUPLICATE">;
      sourceSolicitationId?: string;
    }
  ) {
    setEditingSolicitation(null);
    setFlowMode(options?.flowMode ?? "CREATE");
    setSourceSolicitationId(options?.sourceSolicitationId);
    setDraft(newDraft);
  }

  function startEditing(
    solicitation: Solicitation,
    newDraft: SolicitationDraft
  ) {
    setEditingSolicitation(solicitation);
    setFlowMode("EDIT");
    setSourceSolicitationId(solicitation.id);
    setDraft(newDraft);
  }

  function clearDraft() {
    setEditingSolicitation(null);
    setFlowMode("CREATE");
    setSourceSolicitationId(undefined);
    setDraft(initialDraft);
  }

  return (
    <SolicitationDraftContext.Provider
      value={{
        draft,
        editingSolicitation,
        flowMode,
        sourceSolicitationId,
        setBasicInfo,
        addMachine,
        removeMachine,
        addTool,
        removeTool,
        updateToolQuantity,
        setObservacoes,
        replaceDraft,
        startEditing,
        clearDraft,
      }}
    >
      {children}
    </SolicitationDraftContext.Provider>
  );
}

export function useSolicitationDraft() {
  return useContext(SolicitationDraftContext);
}
