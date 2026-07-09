import gql from 'graphql-tag';
import React from 'react';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';

// Newest staff PBIS cards first. Capped so the page doesn't load the full
// history; the pane scrolls internally.
const GET_STAFF_PBIS_CARDS = gql`
  query GET_STAFF_PBIS_CARDS {
    staffPbisCards(orderBy: { dateGiven: desc }, take: 250) {
      id
      category
      cardMessage
      dateGiven
      recipient {
        id
        name
      }
      giver {
        id
        name
      }
    }
  }
`;

interface StaffPbisCard {
  id: string;
  category?: string;
  cardMessage?: string;
  dateGiven?: string;
  recipient?: { id: string; name: string };
  giver?: { id: string; name: string };
}

function formatDate(date?: string): string {
  if (!date) return 'unknown';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'unknown';
  return parsed.toLocaleDateString();
}

export default function StaffPbisCardTable() {
  const { data, isLoading, error } = useGQLQuery(
    'staffPbisCardTable',
    GET_STAFF_PBIS_CARDS,
  );

  const cards: StaffPbisCard[] = data?.staffPbisCards || [];

  return (
    <div className="mt-8 print:hidden">
      <h3>Staff PBIS Cards</h3>
      <div className="rounded-2xl border-2 border-[var(--blue)] shadow-lg overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="p-4">
              <Loading />
            </div>
          )}
          {error && (
            <div className="p-4">
              <DisplayError error={error} />
            </div>
          )}
          {!isLoading && !error && cards.length === 0 && (
            <p className="text-center p-4">No staff cards recorded yet.</p>
          )}
          {!isLoading && !error && cards.length > 0 && (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] text-white">
                <tr>
                  <th className="p-2 font-semibold">Date</th>
                  <th className="p-2 font-semibold">Recipient</th>
                  <th className="p-2 font-semibold">Given By</th>
                  <th className="p-2 font-semibold">Category</th>
                  <th className="p-2 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, i) => (
                  <tr
                    key={card.id}
                    className={i % 2 === 0 ? 'bg-white/5' : 'bg-black/5'}
                  >
                    <td className="p-2 whitespace-nowrap">
                      {formatDate(card.dateGiven)}
                    </td>
                    <td className="p-2">{card.recipient?.name || '—'}</td>
                    <td className="p-2">{card.giver?.name || '—'}</td>
                    <td className="p-2 capitalize">{card.category || '—'}</td>
                    <td className="p-2 break-words">{card.cardMessage || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
