import {
  collectionGroup,
  DocumentData,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";
import { AuditReportEntry } from "../../types/AuditReport";
import {
  SystemAuditEvent,
  ResourceAuditEvent,
} from "../../types/Audit";
import { Resource } from "../../types/Resources";
import {
  Solicitation,
  SolicitationAuditEvent,
  SolicitationAuditEventType,
  SolicitationTimestamp,
} from "../../types/Solicitation";
import {
  AUDIT_COLLECTION_NAME,
  getLegacySolicitationAuditEvents,
} from "./solicitationAuditServices";
import { getSolicitationCode } from "./administrativeConsultationServices";
import { listSolicitations } from "./solicitationServices";
import { listResources } from "../resources/resourceServices";

const solicitationEventTypes = new Set<SolicitationAuditEventType>([
  "CRIACAO",
  "ALTERACAO",
  "ALTERACAO_ITEM_APROVADO",
  "ALTERACAO_ITEM_RECUSADO",
  "APROVACAO",
  "RECUSA",
  "CANCELAMENTO",
  "RETIRADA",
  "DEVOLUCAO_PARCIAL",
  "DEVOLUCAO_INTEGRAL",
]);

function getTimestampMillis(timestamp?: SolicitationTimestamp | null) {
  if (!timestamp) return 0;
  if (timestamp.toDate) return timestamp.toDate().getTime();
  return timestamp.seconds * 1000;
}

function mapPersistedEvent(
  id: string,
  solicitationId: string,
  data: DocumentData
): SolicitationAuditEvent {
  return {
    id,
    ...data,
    solicitacaoId: data.solicitacaoId ?? solicitationId,
  } as SolicitationAuditEvent;
}

function createEntry(
  event: SystemAuditEvent,
  options: {
    entityType: AuditReportEntry["entityType"];
    solicitation?: Solicitation;
    resource?: Resource;
  }
): AuditReportEntry {
  const entityId =
    options.entityType === "RECURSO"
      ? (event as ResourceAuditEvent).entidadeId
      : (event as SolicitationAuditEvent).solicitacaoId;
  const entityLabel =
    options.entityType === "RECURSO"
      ? (event as ResourceAuditEvent).recursoNome
      : getSolicitationCode(entityId);

  return {
    id: `${options.entityType}-${entityId}-${event.id}`,
    entityType: options.entityType,
    entityId,
    entityLabel,
    event,
    solicitation: options.solicitation,
    resource: options.resource,
    timestampMillis: getTimestampMillis(event.createdAt),
  };
}

export async function listGlobalAuditEntries(): Promise<AuditReportEntry[]> {
  const [solicitations, resources, auditSnapshot] = await Promise.all([
    listSolicitations(),
    listResources(),
    getDocs(collectionGroup(db, AUDIT_COLLECTION_NAME)),
  ]);
  const solicitationsById = new Map(
    solicitations.map((solicitation) => [solicitation.id, solicitation])
  );
  const resourcesById = new Map(
    resources.map((resource) => [resource.id, resource])
  );
  const persistedTypesBySolicitation = new Map<
    string,
    Set<SolicitationAuditEventType>
  >();

  const persistedEntries = auditSnapshot.docs.map((document) => {
    const parentDocument = document.ref.parent.parent;
    const parentId = parentDocument?.id ?? "";
    const parentCollection = parentDocument?.parent.id;
    const data = document.data();
    const isResourceEvent =
      data.entidadeTipo === "RECURSO" || parentCollection === "recursos";

    if (isResourceEvent) {
      const event = {
        id: document.id,
        ...data,
        entidadeTipo: "RECURSO",
        entidadeId: data.entidadeId ?? parentId,
      } as ResourceAuditEvent;

      return createEntry(event, {
        entityType: "RECURSO",
        resource: resourcesById.get(event.entidadeId),
      });
    }

    const event = mapPersistedEvent(
      document.id,
      parentId,
      data
    );
    const solicitationId = event.solicitacaoId || parentId;

    if (
      solicitationEventTypes.has(event.tipo) &&
      !persistedTypesBySolicitation.has(solicitationId)
    ) {
      persistedTypesBySolicitation.set(solicitationId, new Set());
    }

    if (solicitationEventTypes.has(event.tipo)) {
      persistedTypesBySolicitation
        .get(solicitationId)
        ?.add(event.tipo);
    }

    return createEntry(
      { ...event, solicitacaoId: solicitationId },
      {
        entityType: "SOLICITACAO",
        solicitation: solicitationsById.get(solicitationId),
      }
    );
  });

  const legacyEntries = solicitations.flatMap((solicitation) => {
    const persistedTypes =
      persistedTypesBySolicitation.get(solicitation.id) ?? new Set();

    return getLegacySolicitationAuditEvents(solicitation)
      .filter((event) => !persistedTypes.has(event.tipo))
      .map((event) =>
        createEntry(event, {
          entityType: "SOLICITACAO",
          solicitation,
        })
      );
  });

  return [...persistedEntries, ...legacyEntries];
}
