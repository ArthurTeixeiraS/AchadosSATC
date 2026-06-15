import { SystemAuditEvent } from "./Audit";
import { Resource } from "./Resources";
import { Solicitation } from "./Solicitation";
import { Occurrence } from "./Occurrence";

export interface AuditReportEntry {
  id: string;
  entityType: "SOLICITACAO" | "RECURSO" | "OCORRENCIA";
  entityId: string;
  entityLabel: string;
  event: SystemAuditEvent;
  solicitation?: Solicitation;
  resource?: Resource;
  occurrence?: Occurrence;
  timestampMillis: number;
}
