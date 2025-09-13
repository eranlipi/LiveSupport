import React from 'react';
import { Ticket } from '../../types';
import { StatusBadge } from './StatusBadge';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
  isSelected: boolean;
}

export function TicketCard({ ticket, onClick, isSelected }: TicketCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {ticket.title}
        </h3>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <StatusBadge status={ticket.status} size="sm" />
          <StatusBadge priority={ticket.priority} size="sm" />
        </div>
      </div>

      {ticket.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {ticket.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Created: {formatDate(ticket.createdAt)}</span>
        {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
          <span>Updated: {formatDate(ticket.updatedAt)}</span>
        )}
      </div>
    </div>
  );
}