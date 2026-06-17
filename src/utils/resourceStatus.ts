type ArchivableResource = {
  status?: string;
  isArchived?: boolean;
};

export function isArchivedResource(
  resource?: ArchivableResource | null
): boolean {
  return resource?.isArchived === true || resource?.status === "ARQUIVADO";
}
