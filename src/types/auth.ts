export interface User {
  role: string;
  id: string;
  email: string;
  createdDate: string;
  keycloakId: string;
  isEmailVerified: boolean;
  username: string;
  profilePicture: string | null;
  provider: string;
}

export interface UserRole {
  role: "admin" | "user" | string;
  isActive: boolean;
  isLockedOut: boolean;
}
