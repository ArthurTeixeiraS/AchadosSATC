import { AuditActor } from "../../types/Solicitation";
import {
  AuditChange,
  ResourceAuditEventType,
} from "../../types/Audit";
import { Resource, ResourceType } from "../../types/Resources";

export const RESOURCE_AUDIT_FIELDS: ReadonlyArray<{
  key: keyof Resource;
  label: string;
}> = [
  { key: "nome", label: "Nome" },
  { key: "descricao", label: "Descrição" },
  { key: "status", label: "Status" },
  { key: "localizacao", label: "Localização" },
  { key: "patrimonio", label: "Patrimônio" },
  { key: "laboratorioId", label: "Laboratório" },
  { key: "quantidadeTotal", label: "Quantidade total" },
  { key: "quantidadeDisponivel", label: "Quantidade disponível" },
  { key: "imagemUrl", label: "Imagem" },
];

function normalizeValue(value: unknown) {
  return value === undefined ? null : value;
}

export function getResourceAuditChanges(
  previous: Resource,
  next: Partial<Resource>
): AuditChange[] {
  return RESOURCE_AUDIT_FIELDS.flatMap(({ key, label }) => {
    if (!(key in next)) return [];

    const previousValue = normalizeValue(previous[key]);
    const nextValue = normalizeValue(next[key]);

    if (previousValue === nextValue) return [];

    return [
      {
        campo: label,
        valorAnterior: previousValue as AuditChange["valorAnterior"],
        valorNovo: nextValue as AuditChange["valorNovo"],
      },
    ];
  });
}

export function createResourceAuditEventData({
  resourceId,
  resourceName,
  resourceType,
  type,
  actor,
  summary,
  changes,
  quantity,
  solicitationId,
}: {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  type: ResourceAuditEventType;
  actor: AuditActor;
  summary: string;
  changes?: AuditChange[];
  quantity?: number;
  solicitationId?: string;
}) {
  return {
    entidadeTipo: "RECURSO" as const,
    entidadeId: resourceId,
    tipo: type,
    resumo: summary,
    responsavel: actor,
    recursoNome: resourceName,
    recursoTipo: resourceType,
    ...(changes?.length ? { alteracoes: changes } : {}),
    ...(quantity !== undefined ? { quantidade: quantity } : {}),
    ...(solicitationId ? { solicitacaoId: solicitationId } : {}),
  };
}
