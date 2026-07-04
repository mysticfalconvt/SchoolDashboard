import gql from 'graphql-tag';
import React, { useMemo, useState } from 'react';
import { endpoint } from '../../config';
import { GraphQLClient } from '../../lib/graphqlClient';
import useForm from '../../lib/useForm';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Loading from '../Loading';
import GradientButton from '../styles/Button';
import Form from '../styles/Form';
import { useUser } from '../User';

const GET_COLLECTIONS_QUERY = gql`
  query GET_COLLECTIONS {
    pbisCollectionDates(orderBy: { collectionDate: desc }) {
      id
      collectionDate
      staffRandomWinners {
        id
        name
        email
      }
    }
  }
`;

// Staff cards given since the last collection — one ticket per card.
const GET_STAFF_CARDS_SINCE_QUERY = gql`
  query GET_STAFF_CARDS_SINCE($date: DateTime!) {
    staffPbisCards(where: { dateGiven: { gt: $date } }) {
      id
      recipient {
        id
        name
        email
      }
    }
  }
`;

const ADD_STAFF_WINNER_MUTATION = gql`
  mutation ADD_STAFF_WINNER_MUTATION($collectionId: ID!, $staffId: ID!) {
    updatePbisCollectionDate(
      where: { id: $collectionId }
      data: { staffRandomWinners: { connect: { id: $staffId } } }
    ) {
      id
      staffRandomWinners {
        id
        name
      }
    }
  }
`;

interface FormInputs {
  confirmation: string;
  numberOfWinners: string;
}

interface StaffMember {
  id: string;
  name: string;
  email?: string;
  tickets?: number;
}

interface PreviousWinner {
  id: string;
  name: string;
  email?: string;
}

export default function PickStaffWinners() {
  const [showForm, setShowForm] = React.useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm();
  const [running, setRunning] = React.useState(false);

  const [selectedWinners, setSelectedWinners] = useState<StaffMember[]>([]);

  const user = useUser();

  const { data: collectionsData, isLoading: collectionsLoading } = useGQLQuery(
    'Staff Winner Collections',
    GET_COLLECTIONS_QUERY,
    {},
    {},
  );

  const lastCollectionDate =
    collectionsData?.pbisCollectionDates?.[0]?.collectionDate ||
    new Date(0).toISOString();

  const { data: staffCardsData, isLoading: staffCardsLoading } = useGQLQuery(
    'Staff Cards Since Collection',
    GET_STAFF_CARDS_SINCE_QUERY,
    { date: lastCollectionDate },
    { enabled: !!collectionsData },
  );

  const data = collectionsData;
  const isLoading = collectionsLoading || staffCardsLoading;

  const addStaffWinner = async (collectionId: string, staffId: string) => {
    const graphQLClient = new GraphQLClient(
      endpoint,
      {
        headers: {
          credentials: 'include',
          mode: 'cors',
        },
      },
    );
    return await graphQLClient.request(ADD_STAFF_WINNER_MUTATION, {
      collectionId,
      staffId,
    });
  };

  // Staff who received staff cards since the last collection, weighted by the
  // number of cards received (one ticket per card), excluding past winners.
  const availableStaff = useMemo<StaffMember[]>(() => {
    if (!data || !showForm) {
      return [];
    }

    const allPreviousWinners: string[] = [];
    data.pbisCollectionDates?.forEach((collection: any) => {
      collection.staffRandomWinners?.forEach((winner: PreviousWinner) => {
        allPreviousWinners.push(winner.id);
      });
    });

    const byRecipient: Record<string, StaffMember> = {};
    (staffCardsData?.staffPbisCards || []).forEach((card: any) => {
      const r = card.recipient;
      if (!r || allPreviousWinners.includes(r.id)) return;
      const existing =
        byRecipient[r.id] ||
        (byRecipient[r.id] = {
          id: r.id,
          name: r.name,
          email: r.email,
          tickets: 0,
        });
      existing.tickets = (existing.tickets || 0) + 1;
    });

    return Object.values(byRecipient).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [showForm, data, staffCardsData]);

  // Build one ticket per card, then draw unique weighted winners.
  const drawWeightedWinners = (numberOfWinners: number): StaffMember[] => {
    const tickets: StaffMember[] = [];
    availableStaff.forEach((staff) => {
      for (let i = 0; i < (staff.tickets || 0); i++) tickets.push(staff);
    });
    const winners: StaffMember[] = [];
    const chosen = new Set<string>();
    while (winners.length < numberOfWinners && winners.length < availableStaff.length) {
      if (tickets.length === 0) break;
      const pick = tickets[Math.floor(Math.random() * tickets.length)];
      if (!chosen.has(pick.id)) {
        chosen.add(pick.id);
        winners.push(pick);
      }
      // remove all tickets for the chosen staff to avoid reselection loops
      if (chosen.has(pick.id)) {
        for (let i = tickets.length - 1; i >= 0; i--) {
          if (tickets[i].id === pick.id) tickets.splice(i, 1);
        }
      }
    }
    return winners;
  };

  // Check if there are already staff winners in the latest collection
  const hasExistingWinners = useMemo(() => {
    if (!data?.pbisCollectionDates?.[0]) {
      return false;
    }
    const latestCollection = data.pbisCollectionDates[0];
    return (
      latestCollection.staffRandomWinners &&
      latestCollection.staffRandomWinners.length > 0
    );
  }, [data?.pbisCollectionDates]);

  // Get existing winners for display
  const existingWinners = useMemo(() => {
    if (!data?.pbisCollectionDates?.[0]) {
      return [];
    }
    const latestCollection = data.pbisCollectionDates[0];
    return latestCollection.staffRandomWinners || [];
  }, [data?.pbisCollectionDates]);

  const pickRandomStaff = (numberOfWinners: number) => {
    setSelectedWinners(drawWeightedWinners(numberOfWinners));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputs.confirmation === 'yes') {
      setRunning(true);

      // Commit the winners already shown in the preview so what the admin
      // sees is exactly what gets saved.
      const winners = selectedWinners;

      // Get latest collection
      const latestCollection = data?.pbisCollectionDates?.[0];
      if (latestCollection && winners.length > 0) {
        try {
          // Add each staff winner individually
          for (const winner of winners) {
            await addStaffWinner(latestCollection.id, winner.id);
          }

          resetForm();
          setRunning(false);
          setShowForm(false);

          // Optional: redirect to pbis page
          // router.push('/pbis'); // Removed for testing simplicity
        } catch (error) {
          console.error('Error adding staff winners:', error);
          setRunning(false);
        }
      } else {
        setRunning(false);
      }
    }
  };

  // Check if user is authenticated and has PBIS permissions
  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You must be logged in to pick staff winners.
        </p>
        <p className="text-gray-600">Please log in to access this feature.</p>
      </div>
    );
  }

  if (!user.canManagePbis && !user.isSuperAdmin) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You don't have permission to pick staff winners.
        </p>
        <p className="text-gray-600">
          Required permission: canManagePbis or isSuperAdmin. Contact an
          administrator for access.
        </p>
      </div>
    );
  }

  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
        onClick={() => {
          setShowForm(!showForm);
          setSelectedWinners([]);
        }}
      >
        Pick Staff winners
      </GradientButton>

      {showForm && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowForm(false)}
          />

          {/* Modal */}
          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Pick Random Staff Winners
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {isLoading ? (
                <Loading />
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-white text-lg font-semibold mb-3">
                      Eligible Staff (received cards this period, not previously
                      won):
                    </h3>
                    {availableStaff.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto bg-white bg-opacity-10 p-3 rounded">
                        {availableStaff.map((staff) => (
                          <div key={staff.id} className="text-white text-sm">
                            <strong>{staff.name}</strong> (
                            {staff.email || 'No email'}) — {staff.tickets || 0}{' '}
                            card{(staff.tickets || 0) === 1 ? '' : 's'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white text-sm">
                        No staff have received staff cards since the last
                        collection (or all eligible staff have already won).
                      </p>
                    )}
                  </div>

                  {selectedWinners.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-white text-lg font-semibold mb-3">
                        Preview — Winners to be saved:
                      </h3>
                      <div className="space-y-2 bg-green-600 bg-opacity-20 p-3 rounded">
                        {selectedWinners.map((winner) => (
                          <div
                            key={winner.id}
                            className="text-white text-sm font-semibold"
                          >
                            🎉 {winner.name} ({winner.email || 'No email'})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Form
                    className="w-full bg-transparent border-0 shadow-none p-0"
                    onSubmit={handleSubmit}
                  >
                    <h1 className="text-white text-lg font-semibold mb-4">
                      Pick Random Staff Winners for Latest PBIS Collection
                    </h1>

                    {hasExistingWinners && (
                      <div className="mb-6 p-4 bg-yellow-600 bg-opacity-30 border border-yellow-400 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-200">
                              ⚠️ Warning: Staff winners already selected
                            </h3>
                            <div className="mt-2 text-sm text-yellow-100">
                              <p className="mb-2">
                                There are already staff winners selected for the
                                latest PBIS collection. Picking new winners will{' '}
                                <strong>add to</strong> the existing winners,
                                not replace them.
                              </p>
                              {existingWinners.length > 0 && (
                                <div>
                                  <p className="font-semibold mb-1">
                                    Current winners:
                                  </p>
                                  <div className="space-y-1">
                                    {existingWinners.map(
                                      (winner: PreviousWinner) => (
                                        <div
                                          key={winner.id}
                                          className="text-yellow-100 text-sm"
                                        >
                                          • {winner.name} (
                                          {winner.email || 'No email'})
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <fieldset
                      disabled={running || availableStaff.length === 0}
                      aria-busy={running}
                      className="border-0 p-0"
                    >
                      <label
                        htmlFor="numberOfWinners"
                        className="block text-white font-semibold mb-1"
                      >
                        Number of Winners:
                        <input
                          type="number"
                          id="numberOfWinners"
                          name="numberOfWinners"
                          min="1"
                          max={availableStaff.length}
                          value={inputs.numberOfWinners || '5'}
                          onChange={handleChange}
                          className="w-full p-2 rounded border mt-2"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          pickRandomStaff(
                            parseInt(inputs.numberOfWinners || '5', 10),
                          )
                        }
                        disabled={availableStaff.length === 0}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {selectedWinners.length > 0
                          ? 'Re-roll Winners'
                          : 'Preview Winners'}
                      </button>

                      <label
                        htmlFor="confirmation"
                        className="block text-white font-semibold mb-1 mt-4"
                      >
                        {hasExistingWinners
                          ? 'Do You Really Want To Add More Staff Winners? (This will add to existing winners)'
                          : 'Do You Really Want To Pick Staff Winners?'}
                        <input
                          required
                          type="text"
                          id="confirmation"
                          name="confirmation"
                          placeholder={
                            hasExistingWinners
                              ? "Type 'yes' to add more winners"
                              : "Type 'yes' to confirm"
                          }
                          value={inputs.confirmation || ''}
                          onChange={handleChange}
                          className="w-full p-2 rounded border mt-2"
                        />
                      </label>

                      <button
                        type="submit"
                        className="mt-6"
                        disabled={
                          availableStaff.length === 0 ||
                          selectedWinners.length === 0
                        }
                      >
                        {running
                          ? 'Saving Winners...'
                          : selectedWinners.length === 0
                            ? 'Preview winners first'
                            : hasExistingWinners
                              ? 'Save These Staff Winners (adds to existing)'
                              : 'Save These Staff Winners'}
                      </button>
                    </fieldset>
                  </Form>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
