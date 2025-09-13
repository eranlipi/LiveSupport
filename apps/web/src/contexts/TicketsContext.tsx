import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Ticket, CreateTicketRequest, UpdateTicketRequest, FilterState, LoadingState } from '../types';
import { apiClient, ApiError } from '../services/api';

interface TicketsState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  filters: FilterState;
  loading: LoadingState;
}

type TicketsAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_TICKETS'; tickets: Ticket[] }
  | { type: 'ADD_TICKET'; ticket: Ticket }
  | { type: 'UPDATE_TICKET'; ticket: Ticket }
  | { type: 'SET_SELECTED_TICKET'; ticket: Ticket | null }
  | { type: 'SET_FILTERS'; filters: FilterState };

const initialState: TicketsState = {
  tickets: [],
  selectedTicket: null,
  filters: {},
  loading: { isLoading: false },
};

function ticketsReducer(state: TicketsState, action: TicketsAction): TicketsState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, isLoading: action.isLoading },
      };
    case 'SET_ERROR':
      return {
        ...state,
        loading: { isLoading: false, error: action.error },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        loading: { ...state.loading, error: undefined },
      };
    case 'SET_TICKETS':
      return {
        ...state,
        tickets: action.tickets,
        loading: { isLoading: false },
      };
    case 'ADD_TICKET':
      return {
        ...state,
        tickets: [action.ticket, ...state.tickets],
        loading: { isLoading: false },
      };
    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(ticket =>
          ticket.id === action.ticket.id ? action.ticket : ticket
        ),
        selectedTicket: state.selectedTicket?.id === action.ticket.id
          ? action.ticket
          : state.selectedTicket,
        loading: { isLoading: false },
      };
    case 'SET_SELECTED_TICKET':
      return {
        ...state,
        selectedTicket: action.ticket,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.filters,
      };
    default:
      return state;
  }
}

interface TicketsContextValue {
  state: TicketsState;
  actions: {
    fetchTickets: () => Promise<void>;
    createTicket: (ticketData: CreateTicketRequest) => Promise<boolean>;
    updateTicket: (id: string, updates: UpdateTicketRequest) => Promise<boolean>;
    selectTicket: (ticket: Ticket | null) => void;
    setFilters: (filters: FilterState) => void;
    clearError: () => void;
  };
}

const TicketsContext = createContext<TicketsContextValue | undefined>(undefined);

export function useTickets() {
  const context = useContext(TicketsContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
}

interface TicketsProviderProps {
  children: ReactNode;
}

export function TicketsProvider({ children }: TicketsProviderProps) {
  const [state, dispatch] = useReducer(ticketsReducer, initialState);

  const fetchTickets = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const filters = {
        ...(state.filters.status !== undefined && { status: state.filters.status }),
        ...(state.filters.priority !== undefined && { priority: state.filters.priority }),
      };

      const tickets = await apiClient.getTickets(filters);
      dispatch({ type: 'SET_TICKETS', tickets });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Failed to fetch tickets';
      dispatch({ type: 'SET_ERROR', error: message });
    }
  }, [state.filters.status, state.filters.priority]);

  const createTicket = useCallback(async (ticketData: CreateTicketRequest): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const newTicket = await apiClient.createTicket(ticketData);
      dispatch({ type: 'ADD_TICKET', ticket: newTicket });
      return true;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Failed to create ticket';
      dispatch({ type: 'SET_ERROR', error: message });
      return false;
    }
  }, []);

  const updateTicket = useCallback(async (id: string, updates: UpdateTicketRequest): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const updatedTicket = await apiClient.updateTicket(id, updates);
      dispatch({ type: 'UPDATE_TICKET', ticket: updatedTicket });
      return true;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'Failed to update ticket';
      dispatch({ type: 'SET_ERROR', error: message });
      return false;
    }
  }, []);

  const selectTicket = useCallback((ticket: Ticket | null) => {
    dispatch({ type: 'SET_SELECTED_TICKET', ticket });
  }, []);

  const setFilters = useCallback((filters: FilterState) => {
    dispatch({ type: 'SET_FILTERS', filters });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: TicketsContextValue = {
    state,
    actions: {
      fetchTickets,
      createTicket,
      updateTicket,
      selectTicket,
      setFilters,
      clearError,
    },
  };

  return (
    <TicketsContext.Provider value={value}>
      {children}
    </TicketsContext.Provider>
  );
}