import { Resource } from "./Resources";

export type SolicitationShift = "TARDE" | "NOITE"; //Turno (já que a ferramentaria só abre pela Tarde/Noite)

export type SolicitationStatus =
  | "PENDENTE"
  | "IMEDIATA"
  | "APROVADA"
  | "RECUSADA"
  | "EM_USO"
  | "ENCERRADA"
  | "CANCELADA";

export interface SelectedMachine {
  resource: Resource;
}

export interface SelectedTool {
  resource: Resource;
  quantidade: number;
}

export interface SolicitationDraft {  // Aqui seria um interface temporário pra "Salvar" os recursos selecionados enquanto o usuário
  dataUtilizacao: string;             // navega entre as telas de cadastro de Solicitação
  turno: SolicitationShift | "";
  atividade: string;
  maquinasSelecionadas: SelectedMachine[];
  ferramentasSelecionadas: SelectedTool[];
  observacoes: string;
}