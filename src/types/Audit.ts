import {
  AuditActor,
  SolicitationAuditEvent,
  SolicitationAuditEventType,
  SolicitationTimestamp,
} from "./Solicitation";
import { ResourceType } from "./Resources";

export type ResourceAuditEventType =
  | "RECURSO_CRIACAO"
  | "RECURSO_EDICAO"
  | "RECURSO_REMOCAO"
  | "ESTOQUE_ENTRADA"
  | "ESTOQUE_SAIDA"
  | "ESTOQUE_AJUSTE";

export type AuditEventType =
  | SolicitationAuditEventType
  | ResourceAuditEventType;

export interface AuditChange {
  campo: string;
  valorAnterior?: string | number | boolean | null;
  valorNovo?: string | number | boolean | null;
}

export interface ResourceAuditEvent {
  id: string;
  entidadeTipo: "RECURSO";
  entidadeId: string;
  tipo: ResourceAuditEventType;
  resumo: string;
  responsavel: AuditActor;
  recursoNome: string;
  recursoTipo: ResourceType;
  alteracoes?: AuditChange[];
  quantidade?: number;
  solicitacaoId?: string;
  createdAt?: SolicitationTimestamp | null;
}

export type SystemAuditEvent =
  | SolicitationAuditEvent
  | ResourceAuditEvent;
