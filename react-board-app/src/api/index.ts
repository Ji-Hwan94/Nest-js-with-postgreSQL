import axios from "axios";
import {
  AuthCredential,
  LoginResponse,
  Board,
  CreateBoardDto,
  BoardStatus,
} from "../types";

const API_BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: async (credentials: AuthCredential): Promise<void> => {
    await api.post("/auth/signup", credentials);
  },

  signin: async (credentials: AuthCredential): Promise<LoginResponse> => {
    const response = await api.post("/auth/signin", credentials);
    return response.data;
  },
};

export const boardAPI = {
  getAllBoards: async (): Promise<Board[]> => {
    const response = await api.get("/boards");
    return response.data;
  },

  getBoardById: async (id: number): Promise<Board> => {
    const response = await api.get(`/boards/${id}`);
    return response.data;
  },

  createBoard: async (boardData: CreateBoardDto): Promise<Board> => {
    const formData = new FormData();
    formData.append("title", boardData.title);
    formData.append("description", boardData.description);

    if (boardData.file) {
      formData.append("file", boardData.file);
    }

    const response = await api.post("/boards", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateBoardStatus: async (
    id: number,
    status: BoardStatus
  ): Promise<Board> => {
    const response = await api.patch(`/boards/${id}/status`, { status });
    return response.data;
  },

  updateBoard: async (
    id: number,
    boardData: CreateBoardDto
  ): Promise<Board> => {
    const formData = new FormData();
    formData.append("title", boardData.title);
    formData.append("description", boardData.description);

    if (boardData.file) {
      formData.append("file", boardData.file);
    }

    const response = await api.patch(`/boards/${id}`, boardData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteBoard: async (id: number): Promise<void> => {
    await api.delete(`/boards/${id}`);
  },

  downloadFile: async (id: number): Promise<Blob> => {
    const response = await api.get(`/boards/files/${id}`, {
      responseType: "blob",
    });
    return response.data;
  },
};
