import { Resource } from "./Resources";

export type SolicitationShift = "TARDE" | "NOITE"; //Turno (já que a ferramentaria só abre pela Tarde/Noite)

export type SolicitationStatus =
  | "PENDENTE"
  | "APROVADA"
  | "RECUSADA"
  | "EM_USO"
  | "ENCERRADA"
  | "CANCELADA";

export type SolicitationPriority = "NORMAL" | "IMEDIATA";

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

export interface SolicitationMachine {
  recursoId: string;
  nome: string;
  laboratorioId?: string | null;
  laboratorioNome?: string;
}

export interface SolicitationTool {
  recursoId: string;
  nome: string;
  quantidade: number;
  descricao?: string;
  quantidadeDisponivel?: number;
}

export interface Solicitation {
  id: string;
  professorId: string;
  professorNome: string;
  professorCracha: string;
  status: SolicitationStatus;
  prioridade: SolicitationPriority;
  dataUtilizacao: string;
  turno: SolicitationShift;
  atividade: string;
  observacoes?: string;
  laboratoriosIds: string[];
  maquinas: SolicitationMachine[];
  ferramentas: SolicitationTool[];
  atrasada: boolean;
  createdAt?: {
    seconds: number;
  };
  updatedAt?: {
    seconds: number;
  };
}
