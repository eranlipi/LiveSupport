import React from 'react';
import { TicketStatus, TicketPriority } from '../../types';
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_STATUS_COLORS, TICKET_PRIORITY_COLORS } from '../../utils/constants';

interface StatusBadgeProps {
  status?: TicketStatus;
  priority?: TicketPriority;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, priority, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  if (status !== undefined) {
    return (
      <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${TICKET_STATUS_COLORS[status]}`}>
        {TICKET_STATUS_LABELS[status]}
      </span>
    );
  }

  if (priority !== undefined) {
    return (
      <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${TICKET_PRIORITY_COLORS[priority]}`}>
        {TICKET_PRIORITY_LABELS[priority]}
      </span>
    );
  }

  return null;
}