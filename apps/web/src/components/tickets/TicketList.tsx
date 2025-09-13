import React, { useEffect, useState, useMemo } from 'react';
import { useTickets } from '../../contexts/TicketsContext';
import { TicketCard } from './TicketCard';
import { TicketFilters } from './TicketFilters';
import { CreateTicketModal } from './CreateTicketModal';
import { TicketDetails } from './TicketDetails';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import { FilterState, Ticket } from '../../types';

export function TicketList() {
  const { state, actions } = useTickets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>({});

  // Fetch tickets on component mount and when filters change
  useEffect(() => {
    // Update context filters when local filters change
    actions.setFilters(localFilters);
  }, [localFilters, actions]);

  useEffect(() => {
    actions.fetchTickets();
  }, [actions]);

  // Filter tickets locally for search term (since API doesn't support text search)
  const filteredTickets = useMemo(() => {
    let filtered = state.tickets;

    if (localFilters.searchTerm) {
      const searchTerm = localFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm) ||
        ticket.description?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [state.tickets, localFilters.searchTerm]);

  const handleClearFilters = () => {
    setLocalFilters({});
  };

  const handleSelectTicket = (ticket: Ticket) => {
    actions.selectTicket(ticket);
  };

  const handleCloseDetails = () => {
    actions.selectTicket(null);
  };

  if (state.loading.isLoading && state.tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-sm text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main ticket list */}
      <div className={`${state.selectedTicket ? 'w-1/2' : 'w-full'} flex flex-col`}>
        {/* Action bar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Tickets ({filteredTickets.length})
          </h2>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Ticket
          </Button>
        </div>

        {/* Filters */}
        <TicketFilters
          filters={localFilters}
          onFiltersChange={setLocalFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Error message */}
        {state.loading.error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-700">
              {state.loading.error}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                actions.clearError();
                actions.fetchTickets();
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Tickets grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No tickets found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {Object.keys(localFilters).length > 0
                  ? 'Try adjusting your filters or create a new ticket.'
                  : 'Get started by creating your first support ticket.'}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Ticket
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => handleSelectTicket(ticket)}
                  isSelected={state.selectedTicket?.id === ticket.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket details sidebar */}
      {state.selectedTicket && (
        <div className="w-1/2 border-l border-gray-200 bg-gray-50">
          <TicketDetails
            ticket={state.selectedTicket}
            onClose={handleCloseDetails}
          />
        </div>
      )}

      {/* Create ticket modal */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}