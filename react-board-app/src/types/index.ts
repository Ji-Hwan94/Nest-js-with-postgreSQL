export interface User {
  id: number;
  username: string;
}

export interface AuthCredential {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export enum BoardStatus {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export interface Board {
  id: number;
  title: string;
  description: string;
  status: BoardStatus;
  user: User;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
}

export interface CreateBoardDto {
  title: string;
  description: string;
  file?: File | null;
}
