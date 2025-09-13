import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { useTickets } from '../../contexts/TicketsContext';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../utils/constants';

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
}

export function TicketDetails({ ticket, onClose }: TicketDetailsProps) {
  const { actions } = useTickets();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    status: ticket.status,
    priority: ticket.priority,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      status: ticket.status,
      priority: ticket.priority,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      status: ticket.status,
      priority: ticket.priority,
    });
  };

  const handleSave = async () => {
    setIsUpdating(true);

    const updates: { status?: TicketStatus; priority?: TicketPriority } = {};

    if (editData.status !== ticket.status) {
      updates.status = editData.status;
    }

    if (editData.priority !== ticket.priority) {
      updates.priority = editData.priority;
    }

    if (Object.keys(updates).length > 0) {
      const success = await actions.updateTicket(ticket.id, updates);
      if (success) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }

    setIsUpdating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Ticket Details</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button size="sm" onClick={handleEdit}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={isUpdating}
                disabled={isUpdating}
              >
                Save
              </Button>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {ticket.title}
            </h3>
          </div>

          {/* Status and Priority */}
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {isEditing ? (
                <Select
                  name="status"
                  value={editData.status}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                  className="w-40"
                />
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              {isEditing ? (
                <Select
                  name="priority"
                  value={editData.priority}
                  onChange={handleChange}
                  options={PRIORITY_OPTIONS}
                  className="w-40"
                />
              ) : (
                <StatusBadge priority={ticket.priority} />
              )}
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="bg-gray-50 rounded-md p-3 whitespace-pre-wrap text-sm text-gray-900">
                {ticket.description}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-medium">Ticket ID:</span> {ticket.id}
            </div>
            <div>
              <span className="font-medium">Created:</span> {formatDate(ticket.createdAt)}
            </div>
            {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
              <div>
                <span className="font-medium">Last Updated:</span> {formatDate(ticket.updatedAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}