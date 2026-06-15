import { AuditActor } from "./Solicitation";
import { ResourceStatus, ResourceType } from "./Resources";
import { SolicitationTimestamp } from "./Solicitation";

export type OccurrenceStatus = "ABERTA" | "EM_ANALISE" | "ENCERRADA";

export type OccurrenceEventType =
  | "OCORRENCIA_CRIACAO"
  | "OCORRENCIA_COMENTARIO"
  | "OCORRENCIA_STATUS_ALTERADO"
  | "MANUTENCAO_ATIVADA"
  | "MANUTENCAO_DESATIVADA";

export interface OccurrenceResourceSnapshot {
  id: string;
  nome: string;
  tipo: ResourceType;
  status: ResourceStatus;
  patrimonio?: string;
  localizacao?: string;
}

export interface Occurrence {
  id: string;
  recurso: OccurrenceResourceSnapshot;
  descricao: string;
  status: OccurrenceStatus;
  autor: AuditActor;
  emAnalisePor?: AuditActor;
  encerradaPor?: AuditActor;
  manutencaoAtiva?: boolean;
  createdAt?: SolicitationTimestamp | null;
  emAnaliseEm?: SolicitationTimestamp | null;
  encerradaEm?: SolicitationTimestamp | null;
  updatedAt?: SolicitationTimestamp | null;
}

export interface OccurrenceEvent {
  id: string;
  entidadeTipo: "OCORRENCIA";
  entidadeId: string;
  tipo: OccurrenceEventType;
  resumo: string;
  responsavel: AuditActor;
  recursoId: string;
  recursoNome: string;
  recursoTipo: ResourceType;
  statusAnterior?: OccurrenceStatus;
  statusNovo?: OccurrenceStatus;
  observacao?: string;
  createdAt?: SolicitationTimestamp | null;
}
