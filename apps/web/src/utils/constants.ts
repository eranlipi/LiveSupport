import { TicketStatus, TicketPriority } from '../types';

export const TICKET_STATUS_LABELS = {
  [TicketStatus.Open]: 'Open',
  [TicketStatus.InProgress]: 'In Progress',
  [TicketStatus.Resolved]: 'Resolved',
};

export const TICKET_PRIORITY_LABELS = {
  [TicketPriority.Low]: 'Low',
  [TicketPriority.Medium]: 'Medium',
  [TicketPriority.High]: 'High',
  [TicketPriority.Critical]: 'Critical',
};

export const TICKET_STATUS_COLORS = {
  [TicketStatus.Open]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TicketStatus.InProgress]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TicketStatus.Resolved]: 'bg-green-100 text-green-800 border-green-200',
};

export const TICKET_PRIORITY_COLORS = {
  [TicketPriority.Low]: 'bg-gray-100 text-gray-800 border-gray-200',
  [TicketPriority.Medium]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TicketPriority.High]: 'bg-orange-100 text-orange-800 border-orange-200',
  [TicketPriority.Critical]: 'bg-red-100 text-red-800 border-red-200',
};

export const PRIORITY_OPTIONS = [
  { value: TicketPriority.Low, label: TICKET_PRIORITY_LABELS[TicketPriority.Low] },
  { value: TicketPriority.Medium, label: TICKET_PRIORITY_LABELS[TicketPriority.Medium] },
  { value: TicketPriority.High, label: TICKET_PRIORITY_LABELS[TicketPriority.High] },
  { value: TicketPriority.Critical, label: TICKET_PRIORITY_LABELS[TicketPriority.Critical] },
];

export const STATUS_OPTIONS = [
  { value: TicketStatus.Open, label: TICKET_STATUS_LABELS[TicketStatus.Open] },
  { value: TicketStatus.InProgress, label: TICKET_STATUS_LABELS[TicketStatus.InProgress] },
  { value: TicketStatus.Resolved, label: TICKET_STATUS_LABELS[TicketStatus.Resolved] },
];