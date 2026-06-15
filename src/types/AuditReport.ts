import { SystemAuditEvent } from "./Audit";
import { Resource } from "./Resources";
import { Solicitation } from "./Solicitation";

export interface AuditReportEntry {
  id: string;
  entityType: "SOLICITACAO" | "RECURSO";
  entityId: string;
  entityLabel: string;
  event: SystemAuditEvent;
  solicitation?: Solicitation;
  resource?: Resource;
  timestampMillis: number;
}
