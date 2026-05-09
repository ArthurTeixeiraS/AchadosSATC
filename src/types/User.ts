export type UserRole = "FUNCIONARIO" | "PROFESSOR";

export interface AppUser {
  id: string;
  nomeCompleto: string;
  emailInstitucional: string;
  cracha: string;
  tipoUsuario: UserRole;
  statusConta: "ATIVO" | "INATIVO";
  telefone?: string;
}