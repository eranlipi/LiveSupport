// Core domain types matching the backend
export enum TicketStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
}

export enum TicketPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  agentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface CreateTicketRequest {
  title: string;
  description?: string;
  priority: TicketPriority;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  agentId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FilterState {
  status?: TicketStatus;
  priority?: TicketPriority;
  searchTerm?: string;
}