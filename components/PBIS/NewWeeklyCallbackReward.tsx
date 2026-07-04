import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import React, { useMemo, useState } from 'react';
import { ADMIN_ID } from '../../config';
import useForm from '../../lib/useForm';
import { useGqlMutation } from '../../lib/useGqlMutation';
import { useGQLQuery } from '../../lib/useGqlQuery';
import useRevalidatePage from '../../lib/useRevalidatePage';
import Loading from '../Loading';
import GradientButton from '../styles/Button';
import Form from '../styles/Form';
import { useUser } from '../User';

// Students with fewer than this many active callback items get the reward.
const CALLBACK_THRESHOLD = 3;
// Number of PBIS cards awarded to each eligible student.
const CARDS_PER_STUDENT = 3;
// Warn if the reward was already run within this many days.
const RECENT_RUN_DAYS = 6;

const GET_CALLBACK_REWARD_DATA = gql`
  query GET_CALLBACK_REWARD_DATA($recentDate: DateTime) {
    eligibleStudents: users(
      where: {
        AND: [
          { isStudent: { equals: true } }
          { callbackCount: { lt: ${CALLBACK_THRESHOLD} } }
        ]
      }
      orderBy: { name: asc }
    ) {
      id
      name
      callbackCount
    }
    recentRewardCount: pbisCardsCount(
      where: {
        category: { equals: "callback" }
        dateGiven: { gte: $recentDate }
      }
    )
  }
`;

const CREATE_CARDS_MUTATION = gql`
  mutation CREATE_CALLBACK_REWARD_CARDS($cards: [PbisCardCreateInput!]!) {
    createPbisCards(data: $cards) {
      id
    }
  }
`;

interface EligibleStudent {
  id: string;
  name: string;
  callbackCount: number;
}

export default function NewWeeklyCallbackReward() {
  const sendRevalidationRequest = useRevalidatePage('/pbis');
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [running, setRunning] = useState(false);
  const { inputs, handleChange, resetForm } = useForm();
  const router = useRouter();
  const user = useUser();

  const recentDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - RECENT_RUN_DAYS);
    return d.toISOString();
  }, []);

  const { data, isLoading } = useGQLQuery(
    'callbackRewardData',
    GET_CALLBACK_REWARD_DATA,
    { recentDate },
    { enabled: !!user && showForm },
  );

  const [createCards] = useGqlMutation(CREATE_CARDS_MUTATION);

  const eligibleStudents: EligibleStudent[] = data?.eligibleStudents || [];
  const totalCards = eligibleStudents.length * CARDS_PER_STUDENT;
  const hasRecentRun = (data?.recentRewardCount || 0) > 0;

  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You must be logged in to run the callback reward.
        </p>
      </div>
    );
  }

  if (!user.canManagePbis && !user.isSuperAdmin) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You don't have permission to run the callback reward.
        </p>
        <p className="text-gray-600">
          Required permission: canManagePbis or isSuperAdmin.
        </p>
      </div>
    );
  }

  const runReward = async () => {
    const giverId = ADMIN_ID || user.id;
    const cards = eligibleStudents.flatMap((student) =>
      Array.from({ length: CARDS_PER_STUDENT }, () => ({
        student: { connect: { id: student.id } },
        teacher: { connect: { id: giverId } },
        category: 'callback',
      })),
    );
    return createCards({ cards });
  };

  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
        onClick={() => {
          setShowForm(!showForm);
          setShowPreview(false);
        }}
      >
        Run Weekly Callback Reward
      </GradientButton>

      {showForm && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowForm(false)}
          />

          {/* Modal */}
          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Run Weekly Callback Reward
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
              <p className="text-white/90 text-sm mb-4">
                Gives {CARDS_PER_STUDENT} PBIS cards to every student with fewer
                than {CALLBACK_THRESHOLD} active callback items.
              </p>

              {hasRecentRun && (
                <div className="mb-6 p-4 bg-yellow-600 bg-opacity-30 border border-yellow-400 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-200">
                    ⚠️ Warning: Recently run
                  </h3>
                  <p className="mt-2 text-sm text-yellow-100">
                    The callback reward appears to have been run within the last{' '}
                    {RECENT_RUN_DAYS} days. Are you sure you want to run it
                    again?
                  </p>
                </div>
              )}

              {isLoading && <Loading />}

              {/* Preview button */}
              {data && !showPreview && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Preview Reward
                  </button>
                </div>
              )}

              {/* Preview section */}
              {showPreview && (
                <div className="mb-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white text-lg font-semibold">
                      Reward Preview
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-white hover:text-gray-300"
                    >
                      Hide Preview
                    </button>
                  </div>

                  <div className="bg-white bg-opacity-10 p-3 rounded">
                    <p className="text-white text-sm">
                      Eligible students: <strong>{eligibleStudents.length}</strong>
                    </p>
                    <p className="text-white text-sm">
                      Total cards to award: <strong>{totalCards}</strong> (
                      {CARDS_PER_STUDENT} each)
                    </p>
                  </div>

                  {eligibleStudents.length > 0 ? (
                    <div className="bg-green-600 bg-opacity-20 p-3 rounded">
                      <h4 className="text-white font-semibold mb-2">
                        Students receiving the reward
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {eligibleStudents.map((student) => (
                          <div key={student.id} className="text-white text-sm">
                            <strong>{student.name}</strong> —{' '}
                            {student.callbackCount} active callback
                            {student.callbackCount === 1 ? '' : 's'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-600 bg-opacity-20 p-3 rounded">
                      <p className="text-white text-sm">
                        No students are currently eligible.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Form
                className="w-full bg-transparent border-0 shadow-none p-0"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (inputs.confirmation === 'yes' && eligibleStudents.length) {
                    setRunning(true);
                    await runReward();
                    resetForm();
                    await sendRevalidationRequest();
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    setRunning(false);
                    setShowForm(false);
                    router.push({ pathname: `/pbis` });
                  }
                }}
              >
                <fieldset
                  disabled={running || !data || eligibleStudents.length === 0}
                  aria-busy={running}
                  className="border-0 p-0"
                >
                  <label
                    htmlFor="confirmation"
                    className="block text-white font-semibold mb-1"
                  >
                    Type &apos;yes&apos; to award {totalCards} cards:
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
                  <GradientButton
                    type="submit"
                    className="mt-6"
                    disabled={running || !data || eligibleStudents.length === 0}
                  >
                    {running ? 'Awarding Cards...' : 'Run Callback Reward'}
                  </GradientButton>
                </fieldset>
              </Form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
