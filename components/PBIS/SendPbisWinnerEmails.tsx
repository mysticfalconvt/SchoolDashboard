import gql from 'graphql-tag';
import React, { useMemo, useState } from 'react';
import useForm from '../../lib/useForm';
import { useGQLQuery } from '../../lib/useGqlQuery';
import useSendEmail from '../../lib/useSendEmail';
import Loading from '../Loading';
import GradientButton from '../styles/Button';
import Form from '../styles/Form';
import { useUser } from '../User';

const PBIS_WINNERS_QUERY = gql`
  query PBIS_WINNERS_QUERY {
    lastCollection: pbisCollectionDates(
      orderBy: { collectionDate: desc }
      take: 1
    ) {
      id
      collectionDate
      taNewLevelWinners {
        id
        name
        email
        taTeamPbisLevel
      }
      personalLevelWinners {
        id
        name
        email
        individualPbisLevel
        parent {
          id
          name
          email
        }
      }
      staffRandomWinners {
        id
        name
        email
      }
      randomDrawingWinners {
        id
        student {
          id
          name
          email
          parent {
            id
            name
            email
          }
          taTeacher {
            name
          }
        }
      }
    }
  }
`;

interface FormInputs {
  confirmation: string;
  emailParents: boolean;
}

interface Winner {
  id: string;
  name: string;
  email?: string;
  parents?: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
  type: 'personal' | 'ta' | 'staff' | 'random';
  level?: number;
  taTeacher?: string;
}

// Helper function to format parent names from "Last, First" to "First Last"
const formatParentName = (name: string): string => {
  if (!name) return '';
  if (name.includes(',')) {
    const parts = name.split(',').map((part) => part.trim());
    const [last, ...firstParts] = parts;
    const first = firstParts.join(', ');
    return `${first} ${last}`;
  }
  return name;
};

export default function SendPbisWinnerEmails() {
  const [showForm, setShowForm] = React.useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm();
  const [sending, setSending] = React.useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });

  const user = useUser();
  const { setEmail, emailLoading, sendEmail } = useSendEmail();

  const { data, isLoading } = useGQLQuery(
    'PBIS Winners Email',
    PBIS_WINNERS_QUERY,
    {},
    {},
  );

  const winners = useMemo(() => {
    if (!data?.lastCollection?.[0] || !showForm) {
      return [];
    }

    const collection = data.lastCollection[0];
    const allWinners: Winner[] = [];

    // Personal level winners
    collection.personalLevelWinners?.forEach((winner: any) => {
      if (winner.email) {
        allWinners.push({
          id: winner.id,
          name: winner.name,
          email: winner.email,
          parents: winner.parent || [],
          type: 'personal',
          level: winner.individualPbisLevel,
        });
      }
    });

    // TA team winners
    collection.taNewLevelWinners?.forEach((winner: any) => {
      if (winner.email) {
        allWinners.push({
          id: winner.id,
          name: winner.name,
          email: winner.email,
          type: 'ta',
          level: winner.taTeamPbisLevel,
        });
      }
    });

    // Staff winners
    collection.staffRandomWinners?.forEach((winner: any) => {
      if (winner.email) {
        allWinners.push({
          id: winner.id,
          name: winner.name,
          email: winner.email,
          type: 'staff',
        });
      }
    });

    // Random drawing winners
    collection.randomDrawingWinners?.forEach((winner: any) => {
      if (winner.student.email) {
        allWinners.push({
          id: winner.student.id,
          name: winner.student.name,
          email: winner.student.email,
          parents: winner.student.parent || [],
          type: 'random',
          taTeacher: winner.student.taTeacher?.name,
        });
      }
    });

    return allWinners;
  }, [data?.lastCollection, showForm]);

  const sendWinnerEmails = async () => {
    setSending(true);

    // Calculate total emails to send
    const winnerEmailsToSend = winners.filter((w) => w.email).length;
    const studentWinners = winners.filter(
      (w) => w.type === 'personal' || w.type === 'random',
    );
    const parentEmailsToSend = inputs.emailParents
      ? studentWinners.reduce((count, winner) => {
          const parentsWithEmail =
            winner.parents?.filter((parent) => parent.email) || [];
          return count + parentsWithEmail.length;
        }, 0)
      : 0;
    const totalEmails = winnerEmailsToSend + parentEmailsToSend;

    setEmailProgress({ sent: 0, total: totalEmails });
    let emailsSent = 0;

    // Send emails to winners
    for (const winner of winners) {
      if (!winner.email) continue;

      let subject = '';
      let message = '';

      switch (winner.type) {
        case 'personal':
          subject = '🎉 Congratulations! You Leveled Up in PBIS!';
          message = `Dear ${winner.name},

Congratulations! You have leveled up to Level ${winner.level} in our PBIS program! This achievement demonstrates your commitment to our three habits of work: Respect, Responsibility, and Perseverance.

Please report to the Bus Lobby to claim your well-deserved reward. Your positive behavior and dedication to creating a positive academic and social environment are truly commendable!

Keep up the excellent work!

The PBIS Team
"Go the distance; dare to explore"`;
          break;

        case 'ta':
          subject = '🎉 Congratulations! Your TA Team Leveled Up!';
          message = `Dear ${winner.name},

Congratulations! Your TA team has completed their BINGO Box and reached Level ${winner.level}! This achievement reflects the collective effort and positive behavior of your entire team.

You will be notified when you should receive your team celebration. Your leadership and the team's commitment to our three habits of work: Respect, Responsibility, and Perseverance, have made this possible.

Congratulations on leading by example!

The PBIS Team
"Go the distance; dare to explore"`;
          break;

        case 'staff':
          subject =
            '🎉 Congratulations! You Won the Weekly PBIS Staff Drawing!';
          message = `Dear ${winner.name},

Congratulations! You have been selected as a winner in this week's PBIS staff drawing!

Your commitment to supporting our students and reinforcing positive behavior has been recognized. Please check with the main office for details about your reward.

Thank you for all you do to support our PBIS program and for continuing to encourage students to be positive members of our falcon community!

The PBIS Team
"Go the distance; dare to explore"`;
          break;

        case 'random':
          subject = '🎉 Congratulations! You Won the PBIS Random Drawing!';
          message = `Dear ${winner.name},

Congratulations! You have been selected as a winner in this week's PBIS random drawing!

Your positive behavior and demonstration of our three habits of work: Respect, Responsibility, and Perseverance, have earned you this reward. Please report to the Bus Lobby to claim your prize.

${winner.taTeacher ? `Your TA teacher ${winner.taTeacher} should be proud of your excellent behavior!` : ''}

Keep up the great work!

The PBIS Team
"Go the distance; dare to explore"`;
          break;
      }

      const emailData = {
        toAddress: winner.email,
        fromAddress: user.email || 'noreply@ncujhs.tech',
        subject: subject,
        body: message,
      };

      try {
        await sendEmail({
          emailData: emailData,
        });
        emailsSent++;
        setEmailProgress({ sent: emailsSent, total: totalEmails });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay between emails
      } catch (error) {
        console.error(`Error sending email to ${winner.email}:`, error);
      }
    }

    // Send emails to parents if checkbox is checked
    if (inputs.emailParents) {
      for (const winner of studentWinners) {
        const parentsWithEmail =
          winner.parents?.filter((parent) => parent.email) || [];

        for (const parent of parentsWithEmail) {
          let subject = '';
          let message = '';

          if (winner.type === 'personal') {
            subject = '🎉 Great News! Your Child Leveled Up in PBIS!';
            message = `Dear Parents and Guardians,

Congratulations! Your child has leveled up to Level ${winner.level}! This means that your child has earned and submitted at least 25 PBIS cards! Remember that PBIS cards are awarded by staff to students for following expectations and creating a positive academic and social environment. Earned and submitted cards benefit not just the individual student, but also the TA and school as a whole - so keep encouraging your child to submit their cards as they earn them!

Individual levels are based on a tiered system, with each level requiring a set number of cards which rises every 2 levels. As the number of required cards increases, so does the number of rewards available to students. Click here to view our level up system poster!

Check in with your child to find out what prize they have earned. Be sure to congratulate them on modeling our three habits of work: Respect, Responsibility, and Perseverance!

Thank you for continuing to encourage your child to be a positive member of our falcon community.

The PBIS Team
"Go the distance; dare to explore"`;
          } else if (winner.type === 'random') {
            subject = '🎉 Congratulations! Your Child Won the PBIS Drawing!';
            message = `Dear Parents and Guardians,

Congratulations! Your child has been selected as a winner in this week's PBIS random drawing! This recognition comes as a result of their positive behavior and demonstration of our three habits of work: Respect, Responsibility, and Perseverance.

Your child should report to the Bus Lobby to claim their prize.

${winner.taTeacher ? `Their TA teacher ${winner.taTeacher} has been impressed with their excellent behavior!` : ''}

Please join us in celebrating this achievement with your child and continue to encourage them to be a positive member of our falcon community!

The PBIS Team
"Go the distance; dare to explore"`;
          }

          const emailData = {
            toAddress: parent.email!,
            fromAddress: user.email || 'noreply@ncujhs.tech',
            subject: subject,
            body: message,
          };

          try {
            await sendEmail({
              emailData: emailData,
            });
            emailsSent++;
            setEmailProgress({ sent: emailsSent, total: totalEmails });
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay between emails
          } catch (error) {
            console.error(
              `Error sending email to parent ${parent.email}:`,
              error,
            );
          }
        }
      }
    }

    setSending(false);
    setEmailProgress({ sent: 0, total: 0 });
    resetForm();
    setShowForm(false);
  };

  // Check if user is authenticated and has PBIS permissions
  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You must be logged in to send PBIS winner emails.
        </p>
        <p className="text-gray-600">Please log in to access this feature.</p>
      </div>
    );
  }

  if (!user.canManagePbis && !user.isSuperAdmin) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-semibold mb-2">
          You don't have permission to send PBIS winner emails.
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
        }}
      >
        Send Emails to all weekly PBIS winners
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
                Send Emails to PBIS Winners
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={sending || emailLoading}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Winners from Latest Collection:
                    </h3>
                    {winners.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto bg-white bg-opacity-10 p-3 rounded">
                        {winners.map((winner, index) => (
                          <div
                            key={`${winner.id}-${winner.type}-${index}`}
                            className="text-white text-sm"
                          >
                            <strong>{winner.name}</strong> ({winner.email}) -
                            {winner.type === 'personal' &&
                              ` Personal Level ${winner.level}`}
                            {winner.type === 'ta' &&
                              ` TA Team Level ${winner.level}`}
                            {winner.type === 'staff' && ` Staff Winner`}
                            {winner.type === 'random' &&
                              ` Random Drawing Winner`}
                            {(winner.type === 'personal' ||
                              winner.type === 'random') &&
                              (winner.parents && winner.parents.length > 0 ? (
                                <span className="text-green-300 ml-2">
                                  [Parents:{' '}
                                  {winner.parents
                                    .filter((p) => p.email)
                                    .map((p) => p.email)
                                    .join(', ') || 'No emails'}
                                  ]
                                </span>
                              ) : (
                                <span className="text-red-300 ml-2">
                                  [No parents]
                                </span>
                              ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white text-sm">
                        No winners with email addresses found.
                      </p>
                    )}
                  </div>

                  {inputs.emailParents && (
                    <div className="mb-6">
                      <h3 className="text-white text-lg font-semibold mb-3">
                        Parent Emails Will Be Sent To:
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto bg-blue-600 bg-opacity-20 p-3 rounded">
                        {winners
                          .filter(
                            (w) => w.type === 'personal' || w.type === 'random',
                          )
                          .flatMap((winner) =>
                            (
                              winner.parents?.filter(
                                (parent) => parent.email,
                              ) || []
                            ).map((parent) => ({
                              winner,
                              parent,
                            })),
                          )
                          .map(({ winner, parent }, index) => (
                            <div
                              key={`parent-${winner.id}-${parent.id}-${index}`}
                              className="text-white text-sm"
                            >
                              📧 <strong>{winner.name}</strong>'s parent (
                              {formatParentName(parent.name)}): {parent.email}
                            </div>
                          ))}
                        {winners
                          .filter(
                            (w) => w.type === 'personal' || w.type === 'random',
                          )
                          .flatMap(
                            (w) => w.parents?.filter((p) => p.email) || [],
                          ).length === 0 && (
                          <div className="text-white text-sm">
                            No student winners have parent email addresses on
                            file.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sending && (
                    <div className="mb-6">
                      <h3 className="text-white text-lg font-semibold mb-3">
                        Sending Emails...
                      </h3>
                      <div className="bg-white bg-opacity-10 p-4 rounded">
                        <div className="text-white text-center mb-2">
                          Progress: {emailProgress.sent} / {emailProgress.total}{' '}
                          emails sent
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width:
                                emailProgress.total > 0
                                  ? `${(emailProgress.sent / emailProgress.total) * 100}%`
                                  : '0%',
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Form
                    className="w-full bg-transparent border-0 shadow-none p-0"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (inputs.confirmation === 'yes') {
                        await sendWinnerEmails();
                      }
                    }}
                  >
                    <h1 className="text-white text-lg font-semibold mb-4">
                      Send congratulatory emails to all PBIS winners
                    </h1>
                    <fieldset
                      disabled={sending || emailLoading || winners.length === 0}
                      aria-busy={sending || emailLoading}
                      className="border-0 p-0"
                    >
                      <label className="flex items-center text-white font-semibold mb-4">
                        <input
                          type="checkbox"
                          id="emailParents"
                          name="emailParents"
                          checked={inputs.emailParents || false}
                          onChange={handleChange}
                          className="mr-2 w-4 h-4"
                        />
                        Email Parents (for student winners only)
                      </label>

                      <label
                        htmlFor="confirmation"
                        className="block text-white font-semibold mb-1"
                      >
                        Do You Really Want To Send These Emails?
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
                        disabled={winners.length === 0}
                      >
                        {sending || emailLoading
                          ? 'Sending Emails...'
                          : 'Send Emails'}
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
