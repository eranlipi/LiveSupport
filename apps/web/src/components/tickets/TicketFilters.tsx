import React from 'react';
import { Select } from '../common/Select';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FilterState, TicketStatus, TicketPriority } from '../../types';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../utils/constants';

interface TicketFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export function TicketFilters({ filters, onFiltersChange, onClearFilters }: TicketFiltersProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      status: value === '' ? undefined : parseInt(value) as TicketStatus,
    });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      priority: value === '' ? undefined : parseInt(value) as TicketPriority,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value || undefined,
    });
  };

  const hasActiveFilters = filters.status !== undefined || filters.priority !== undefined || filters.searchTerm;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search tickets..."
            value={filters.searchTerm || ''}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>

        <div className="flex gap-3">
          <Select
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={filters.status ?? ''}
            onChange={handleStatusChange}
            className="w-40"
          />

          <Select
            options={PRIORITY_OPTIONS}
            placeholder="All priorities"
            value={filters.priority ?? ''}
            onChange={handlePriorityChange}
            className="w-40"
          />

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}