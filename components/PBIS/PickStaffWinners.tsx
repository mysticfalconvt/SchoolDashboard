import gql from 'graphql-tag';
import React, { useMemo, useState } from 'react';
import { endpoint, prodEndpoint } from '../../config';
import { GraphQLClient } from '../../lib/graphqlClient';
import useForm from '../../lib/useForm';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Loading from '../Loading';
import GradientButton from '../styles/Button';
import Form from '../styles/Form';
import { useUser } from '../User';

const GET_STAFF_AND_WINNERS_QUERY = gql`
  query GET_STAFF_AND_WINNERS {
    staff: users(where: { isStaff: { equals: true } }) {
      id
      name
      email
    }
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

  const { data, isLoading } = useGQLQuery(
    'Staff and Winners',
    GET_STAFF_AND_WINNERS_QUERY,
    {},
    {},
  );

  const addStaffWinner = async (collectionId: string, staffId: string) => {
    const graphQLClient = new GraphQLClient(
      process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
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

  const availableStaff = useMemo(() => {
    if (!data || !showForm) {
      return [];
    }

    const allStaff: StaffMember[] = data.staff || [];
    const allPreviousWinners: string[] = [];

    // Get all previous staff winners
    data.pbisCollectionDates?.forEach((collection: any) => {
      collection.staffRandomWinners?.forEach((winner: PreviousWinner) => {
        allPreviousWinners.push(winner.id);
      });
    });

    // Filter out staff who have already won
    return allStaff.filter((staff) => !allPreviousWinners.includes(staff.id));
  }, [data?.staff, data?.pbisCollectionDates, showForm]);

  const pickRandomStaff = (numberOfWinners: number) => {
    const shuffled = [...availableStaff].sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(
      0,
      Math.min(numberOfWinners, availableStaff.length),
    );
    setSelectedWinners(winners);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputs.confirmation === 'yes') {
      setRunning(true);

      const numberOfWinners = parseInt(inputs.numberOfWinners || '5', 10);

      // Pick random staff
      const shuffled = [...availableStaff].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(
        0,
        Math.min(numberOfWinners, availableStaff.length),
      );
      setSelectedWinners(winners);

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
                      Available Staff (Not Previously Won):
                    </h3>
                    {availableStaff.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto bg-white bg-opacity-10 p-3 rounded">
                        {availableStaff.map((staff) => (
                          <div key={staff.id} className="text-white text-sm">
                            <strong>{staff.name}</strong> (
                            {staff.email || 'No email'})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white text-sm">
                        All staff members have already won recently.
                      </p>
                    )}
                  </div>

                  {selectedWinners.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-white text-lg font-semibold mb-3">
                        Selected Winners:
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

                      <label
                        htmlFor="confirmation"
                        className="block text-white font-semibold mb-1 mt-4"
                      >
                        Do You Really Want To Pick Staff Winners?
                        <input
                          required
                          type="text"
                          id="confirmation"
                          name="confirmation"
                          placeholder="Type 'yes' to confirm"
                          value={inputs.confirmation || ''}
                          onChange={handleChange}
                          className="w-full p-2 rounded border mt-2"
                        />
                      </label>

                      <button
                        type="submit"
                        className="mt-6"
                        disabled={availableStaff.length === 0}
                      >
                        {running ? 'Picking Winners...' : 'Pick Staff Winners'}
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
