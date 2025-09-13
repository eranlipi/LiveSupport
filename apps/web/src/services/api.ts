import {
  Ticket,
  CreateTicketRequest,
  UpdateTicketRequest,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TicketStatus,
  TicketPriority,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7014/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      credentials: 'include', // Include cookies for refresh token
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if we have an access token
    if (this.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.accessToken}`,
          };
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw new ApiError(
              `HTTP ${retryResponse.status}: ${retryResponse.statusText}`,
              retryResponse.status,
              await this.getResponseData(retryResponse)
            );
          }
          return await retryResponse.json();
        }
      }

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          await this.getResponseData(response)
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error occurred', 0);
    }
  }

  private async getResponseData(response: Response) {
    try {
      return await response.json();
    } catch {
      return await response.text();
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setAccessToken(response.access_token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<{ ok: boolean }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await this.request<AuthResponse>('/auth/refresh', {
        method: 'POST',
      });
      this.setAccessToken(response.access_token);
      return true;
    } catch {
      this.setAccessToken(null);
      return false;
    }
  }

  async logout(): Promise<{ ok: boolean }> {
    try {
      const response = await this.request<{ ok: boolean }>('/auth/logout', {
        method: 'POST',
      });
      this.setAccessToken(null);
      return response;
    } catch {
      // Always clear token on logout attempt
      this.setAccessToken(null);
      return { ok: true };
    }
  }

  async getCurrentUser(): Promise<{ user: string }> {
    return this.request('/me');
  }

  // Ticket endpoints
  async getTickets(filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
  }): Promise<Ticket[]> {
    const params = new URLSearchParams();
    if (filters?.status !== undefined) {
      params.append('status', filters.status.toString());
    }
    if (filters?.priority !== undefined) {
      params.append('priority', filters.priority.toString());
    }

    const queryString = params.toString();
    const endpoint = `/tickets${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async getTicket(id: string): Promise<Ticket> {
    return this.request(`/tickets/${id}`);
  }

  async createTicket(ticketData: CreateTicketRequest): Promise<Ticket> {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async updateTicket(
    id: string,
    updates: UpdateTicketRequest
  ): Promise<Ticket> {
    return this.request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError };