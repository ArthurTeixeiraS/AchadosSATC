import { Resource } from "./Resources";
import type { UserRole } from "./User";

export type SolicitationShift = "TARDE" | "NOITE"; //Turno (já que a ferramentaria só abre pela Tarde/Noite)

export type SolicitationStatus =
  | "PENDENTE"
  | "APROVADA"
  | "ALTERACAO_PENDENTE"
  | "RECUSADA"
  | "EM_USO"
  | "ENCERRADA"
  | "CANCELADA";

export type SolicitationPriority = "NORMAL" | "IMEDIATA";

export type SolicitationAuditEventType =
  | "CRIACAO"
  | "ALTERACAO"
  | "ALTERACAO_ITEM_APROVADO"
  | "ALTERACAO_ITEM_RECUSADO"
  | "APROVACAO"
  | "RECUSA"
  | "CANCELAMENTO"
  | "RETIRADA"
  | "DEVOLUCAO_PARCIAL"
  | "DEVOLUCAO_INTEGRAL";

export interface AuditActor {
  id: string;
  nome: string;
  perfil: UserRole;
}

export interface SolicitationAuditItem {
  recursoId: string;
  nome: string;
  tipo: "MAQUINA" | "FERRAMENTA";
  quantidade: number;
}

export interface SolicitationTimestamp {
  seconds: number;
  nanoseconds?: number;
  toDate?: () => Date;
}

export interface SolicitationAuditEvent {
  id: string;
  solicitacaoId: string;
  tipo: SolicitationAuditEventType;
  resumo: string;
  responsavel: AuditActor;
  statusAnterior?: SolicitationStatus;
  statusNovo?: SolicitationStatus;
  itens?: SolicitationAuditItem[];
  motivo?: string;
  createdAt?: SolicitationTimestamp | null;
  derivado?: boolean;
}

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

export type SolicitationChangeItemStatus =
  | "PENDENTE"
  | "APROVADO"
  | "RECUSADO";

export interface SolicitationChangeDecision {
  responsavelId: string;
  responsavelNome: string;
  decididaEm?: SolicitationTimestamp | null;
  motivo?: string;
}

export interface SolicitationChangeMachine {
  recursoId: string;
  nome: string;
  laboratorioId?: string | null;
  status: SolicitationChangeItemStatus;
  decisao?: SolicitationChangeDecision;
}

export interface SolicitationChangeTool {
  recursoId: string;
  nome: string;
  quantidadeAdicional: number;
  status: SolicitationChangeItemStatus;
  decisao?: SolicitationChangeDecision;
}

export interface SolicitationChangeReview {
  solicitadaPorId: string;
  solicitadaPorNome: string;
  solicitadaEm?: SolicitationTimestamp | null;
  maquinas: SolicitationChangeMachine[];
  ferramentas: SolicitationChangeTool[];
}

export interface SolicitationMachine {
  recursoId: string;
  nome: string;
  laboratorioId?: string | null;
  laboratorioNome?: string;
  devolvida?: boolean;
}

export interface SolicitationTool {
  recursoId: string;
  nome: string;
  quantidade: number;
  descricao?: string;
  quantidadeDisponivel?: number;
  quantidadeDevolvida?: number;
}

export interface SolicitationReturnInput {
  maquinasIds: string[];
  ferramentas: {
    recursoId: string;
    quantidade: number;
  }[];
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
  analiseAlteracao?: SolicitationChangeReview;
  atrasada: boolean;
  createdAt?: SolicitationTimestamp;
  updatedAt?: SolicitationTimestamp;
  aprovadaEm?: SolicitationTimestamp;
  aprovadaPorId?: string;
  aprovadaPorNome?: string;
  recusadaEm?: SolicitationTimestamp;
  recusadaPorId?: string;
  recusadaPorNome?: string;
  motivoRecusa?: string;
  canceladaEm?: SolicitationTimestamp;
  canceladaPorId?: string;
  canceladaPorNome?: string;
  retiradaEm?: SolicitationTimestamp;
  retiradaPorId?: string;
  retiradaPorNome?: string;
  devolvidaEm?: SolicitationTimestamp;
  devolvidaPorId?: string;
  devolvidaPorNome?: string;
}
