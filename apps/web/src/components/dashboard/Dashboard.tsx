import React from 'react';
import { Header } from '../layout/Header';
import { TicketList } from '../tickets/TicketList';
import { TicketsProvider } from '../../contexts/TicketsContext';

export function Dashboard() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <TicketsProvider>
          <TicketList />
        </TicketsProvider>
      </main>
    </div>
  );
}