import gql from 'graphql-tag';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import plainTextEmailToHtml from '../../lib/plainTextEmailToHtml';
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
        taStudents {
          id
          name
          parent {
            id
            name
            email
          }
        }
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
        taTeacher {
          name
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
  sendMeSamples: boolean;
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
  taStudents?: Array<{
    id: string;
    name: string;
    parent?: Array<{ id: string; name: string; email?: string }>;
  }>;
}

interface ParentRecipient {
  winner: Winner;
  parent: { id: string; name: string; email?: string };
  studentName: string;
}

const LEVEL_UP_POSTER_URL =
  'https://drive.google.com/file/d/1UNl4FkmsaB0XN3TvDDaUuJw13hJao2DJ/view';

const TA_CELEBRATION_POSTER_URL =
  'https://drive.google.com/file/d/1_jZeEg_OlUNETYhkQ5a23iugK9u6LkpD/view';

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
  const [lastBatch, setLastBatch] = useState<{
    id: string;
    queued: number;
    failed: number;
  } | null>(null);

  const user = useUser();
  const { setEmail, emailLoading, sendEmail, sendEmailAsync } = useSendEmail();
  // sendEmailAsync observes queue acceptance. The fallback keeps older test
  // doubles and clients compatible while the shared hook retains its API.
  const queueEmail = sendEmailAsync || sendEmail;

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
          taTeacher: winner.taTeacher?.name,
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
          taStudents: winner.taStudents || [],
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

  // Parents of student winners, plus parents of every student in a TA that
  // leveled up. A parent with several kids in the same TA gets one email.
  const parentRecipients = useMemo(() => {
    const recipients: ParentRecipient[] = [];
    winners.forEach((winner) => {
      if (winner.type === 'personal' || winner.type === 'random') {
        winner.parents
          ?.filter((parent) => parent.email)
          .forEach((parent) =>
            recipients.push({ winner, parent, studentName: winner.name }),
          );
      } else if (winner.type === 'ta') {
        const seen = new Set<string>();
        winner.taStudents?.forEach((student) => {
          student.parent
            ?.filter((parent) => parent.email && !seen.has(parent.email))
            .forEach((parent) => {
              seen.add(parent.email!);
              recipients.push({ winner, parent, studentName: student.name });
            });
        });
      }
    });
    return recipients;
  }, [winners]);

  const totalEmailCount = useMemo(() => {
    const winnerEmailsToSend = winners.filter((w) => w.email).length;
    const parentEmailsToSend = inputs.emailParents
      ? parentRecipients.length
      : 0;
    // One sample per template type that is actually going out
    const sampleTypes = new Set([
      ...winners.filter((w) => w.email).map((w) => `winner:${w.type}`),
      ...(inputs.emailParents
        ? parentRecipients.map(({ winner }) => `parent:${winner.type}`)
        : []),
    ]);
    const samplesToSend =
      inputs.sendMeSamples && user?.email ? sampleTypes.size : 0;
    return winnerEmailsToSend + parentEmailsToSend + samplesToSend;
  }, [
    winners,
    parentRecipients,
    inputs.emailParents,
    inputs.sendMeSamples,
    user?.email,
  ]);

  const sendWinnerEmails = async () => {
    setSending(true);
    setLastBatch(null);
    const collectionId = data?.lastCollection?.[0]?.id || 'unknown';
    const batchId = `pbis-${collectionId}-${Date.now()}`;

    // Calculate total emails to send
    const totalEmails = totalEmailCount;

    setEmailProgress({ sent: 0, total: totalEmails });
    let emailsSent = 0;
    let emailsFailed = 0;
    // First email of each template type, re-sent to the sender at the end
    const samples = new Map<
      string,
      { toAddress: string; subject: string; body: string }
    >();

    const queueOne = async (emailData: {
      toAddress: string;
      subject: string;
      body: string;
    }) => {
      try {
        const result = await queueEmail({
          emailData: {
            ...emailData,
            // Templates are written as plain text; the backend renders HTML
            body: plainTextEmailToHtml(emailData.body),
            fromAddress: user.email || 'noreply@ncujhs.tech',
            lowPriority: true,
            batchId,
          },
        });
        if (result?.sendEmail === false) {
          throw new Error('The server did not accept this email');
        }
        emailsSent++;
        setEmailProgress({ sent: emailsSent, total: totalEmails });
      } catch (error) {
        emailsFailed++;
        console.error(`Error sending email to ${emailData.toAddress}:`, error);
      }
    };

    // Send emails to winners
    for (const winner of winners) {
      if (!winner.email) continue;

      let subject = '';
      let message = '';

      switch (winner.type) {
        case 'personal':
          subject = '🎉 Congratulations! You Leveled Up in PBIS!';
          message = `Dear ${winner.name},

Congratulations! You have leveled up to Level ${winner.level}! This means that you have earned and submitted at least 25 PBIS cards! Remember that PBIS cards are awarded by staff to students for following expectations and creating a positive academic and social environment. Earned and submitted cards benefit not just you, but also your TA and school as a whole - so keep submitting your cards as you earn them!

Individual levels are based on a tiered system, with each level requiring a set number of cards which rises every 2 levels. As the number of required cards increases, so does the number of rewards available to students. View our level up system poster here: ${LEVEL_UP_POSTER_URL}

Please report to the Bus Lobby to claim your prize. Thank you for modeling our three principles: Respect, Responsibility, and Perseverance!

Thank you for being a positive member of our falcon community.

The PBIS Team
“Have a tree-menous day!”`;
          break;

        case 'ta':
          subject = '🎉 Congratulations! Your TA Leveled Up in PBIS!';
          message = `Dear ${winner.name},

Congratulations! Your TA has leveled up to Level ${winner.level}! This means that your TA has earned an average of 24 PBIS cards per student. This achievement reflects your students' effort in earning and submitting their cards, and your commitment to reinforcing our three principles: Respect, Responsibility, and Perseverance.

Your TA's next prize is the next box on the MAPLE lane your TA chose. This celebration will be scheduled during guided study in the coming days. View the TA Celebration poster here: ${TA_CELEBRATION_POSTER_URL}

Thank you for all you do to support our PBIS program and for continuing to encourage your students to be positive members of our falcon community!

The PBIS Team
“Have a tree-menous day!”`;
          break;

        case 'staff':
          subject =
            '🎉 Congratulations! You Won the Weekly PBIS Staff Drawing!';
          message = `Dear ${winner.name},

Congratulations! You have been selected as a winner in this week's PBIS staff drawing! Your commitment to supporting our students and reinforcing positive behavior has been recognized. You will earn your reward this week…listen carefully to the announcements to claim your prize. Thank you for all you do to support our PBIS program and for continuing to encourage students to be positive members of our falcon community!

The PBIS Team
“Have a tree-menous day!”`;
          break;

        case 'random':
          subject = '🎉 Congratulations! You Won the PBIS Random Drawing!';
          message = `Dear ${winner.name},

Congratulations! You have been selected as a winner in this week's PBIS random drawing!

Your positive behavior and demonstration of our three principles: Respect, Responsibility, and Perseverance, have earned you this reward. Please report to the Bus Lobby to claim your prize.

${winner.taTeacher ? `Your TA teacher ${winner.taTeacher} should be proud of your excellent behavior!` : ''}

Keep up the great work!

The PBIS Team
“Have a tree-menous day!”`;
          break;
      }

      const emailData = { toAddress: winner.email, subject, body: message };
      if (!samples.has(`winner:${winner.type}`)) {
        samples.set(`winner:${winner.type}`, emailData);
      }
      await queueOne(emailData);
    }

    // Send emails to parents if checkbox is checked
    if (inputs.emailParents) {
      for (const { winner, parent, studentName } of parentRecipients) {
        const student = formatParentName(studentName);
        // For a TA level up the winner is the TA teacher themselves
        const taTeacherName = formatParentName(
          (winner.type === 'ta' ? winner.name : winner.taTeacher) || '',
        );
        const theirTa = taTeacherName ? `${taTeacherName}’s TA` : 'their TA';
        let subject = '';
        let message = '';

        if (winner.type === 'personal') {
          subject = '🎉 Great News! Your Child Leveled Up in PBIS!';
          message = `Dear Parents and Guardians,

Congratulations! Your child, ${student}, has leveled up! This means that ${student} has earned and submitted at least 25 PBIS cards! Remember that PBIS cards are awarded by staff to students for following expectations and creating a positive academic and social environment. Earned and submitted cards benefit not just the individual student, but also ${theirTa} and school as a whole - so keep encouraging your child to submit their cards as they earn them!

Individual levels are based on a tiered system, with each level requiring a set number of cards which rises every 2 levels. As the number of required cards increases, so does the number of rewards available to students. View our level up system poster here: ${LEVEL_UP_POSTER_URL}

Check in with your child to find out what prize they have earned. Be sure to congratulate them on modeling our three principles: Respect, Responsibility, and Perseverance!

Thank you for continuing to encourage your child to be a positive member of our falcon community.

The PBIS Team
“Have a tree-menous day!”`;
        } else if (winner.type === 'random') {
          subject = '🎉 Congratulations! Your Child Won the PBIS Drawing!';
          message = `Dear Parents and Guardians,

Congratulations! Your child, ${student}, has been selected as a winner in this week's PBIS random drawing! This recognition comes as a result of their positive behavior and demonstration of our three principles: Respect, Responsibility, and Perseverance.

Your child should report to the Bus Lobby to claim their prize.

${taTeacherName ? `Their TA teacher ${taTeacherName} has been impressed with their excellent behavior!` : ''}

Please join us in celebrating this achievement with your child and continue to encourage them to be a positive member of our falcon community!

The PBIS Team
“Have a tree-menous day!”`;
        } else if (winner.type === 'ta') {
          subject = "🎉 Great News! Your Child's TA Leveled Up in PBIS!";
          message = `Dear Parents and Guardians,

Congratulations! ${student}’s TA with ${taTeacherName} has leveled up! This means that the TA has earned an average of 24 PBIS cards per student. PBIS cards are awarded by staff to students for following expectations and creating a positive academic and social environment. Earned and submitted cards benefit not just the individual student, but also the TA and school as a whole - so keep encouraging your child to submit their cards as they earn them!

Each TA chooses a MAPLE lane to work towards. Each box on the MAPLE lane represents a prize which could include snacks, small prize items, or homemade treats. This celebration will be scheduled during guided study in the coming days. View the TA Celebration poster here: ${TA_CELEBRATION_POSTER_URL}

Check in with your child to find out what prize they have earned. Be sure to congratulate them on modeling our three principles: Respect, Responsibility, and Perseverance!

Thank you for continuing to encourage your child to be a positive member of our falcon community.

The PBIS Team
“Have a tree-menous day!”`;
        }

        const emailData = {
          toAddress: parent.email!,
          subject,
          body: message,
        };
        if (!samples.has(`parent:${winner.type}`)) {
          samples.set(`parent:${winner.type}`, emailData);
        }
        await queueOne(emailData);
      }
    }

    // Samples go last so they land at the end of the queue, after every
    // real email, letting the sender confirm the whole batch went through.
    if (inputs.sendMeSamples && user.email) {
      for (const sample of Array.from(samples.values())) {
        await queueOne({
          toAddress: user.email,
          subject: `[PBIS SAMPLE] ${sample.subject}`,
          body: `This is a sample copy. The real email went to: ${sample.toAddress}\n\n----------\n\n${sample.body}`,
        });
      }
    }

    setSending(false);
    setLastBatch({ id: batchId, queued: emailsSent, failed: emailsFailed });
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

      {lastBatch && (
        <div className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          <strong>{lastBatch.queued} emails queued.</strong>
          {lastBatch.failed > 0 &&
            ` ${lastBatch.failed} could not be queued.`}{' '}
          <Link
            href={`/emailQueue?batchId=${encodeURIComponent(lastBatch.id)}`}
            className="font-semibold underline"
          >
            View this batch
          </Link>
        </div>
      )}

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
                        {parentRecipients.map(
                          ({ winner, parent, studentName }, index) => (
                            <div
                              key={`parent-${winner.id}-${parent.id}-${index}`}
                              className="text-white text-sm"
                            >
                              📧 <strong>{studentName}</strong>'s parent (
                              {formatParentName(parent.name)}): {parent.email}
                              {winner.type === 'ta' &&
                                ` - TA Level ${winner.level}`}
                            </div>
                          ),
                        )}
                        {parentRecipients.length === 0 && (
                          <div className="text-white text-sm">
                            No winners have parent email addresses on file.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sending && (
                    <div className="mb-6">
                      <h3 className="text-white text-lg font-semibold mb-3">
                        Queueing Emails...
                      </h3>
                      <div className="bg-white bg-opacity-10 p-4 rounded">
                        <div className="text-white text-center mb-2">
                          Progress: {emailProgress.sent} / {emailProgress.total}{' '}
                          emails queued
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
                        Email Parents (student winners and TA level ups)
                      </label>
                      <label className="flex items-center text-white font-semibold mb-4">
                        <input
                          type="checkbox"
                          id="sendMeSamples"
                          name="sendMeSamples"
                          checked={inputs.sendMeSamples || false}
                          onChange={handleChange}
                          className="mr-2 w-4 h-4"
                        />
                        Send me a sample of each email type ({user.email}) after
                        the rest are queued
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
                      <GradientButton
                        type="submit"
                        className="mt-6"
                        disabled={
                          winners.length === 0 || sending || emailLoading
                        }
                      >
                        {sending || emailLoading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Queueing Emails...
                          </>
                        ) : (
                          <>
                            Queue Emails
                            {totalEmailCount > 0 && (
                              <span className="ml-2">
                                ({totalEmailCount} email
                                {totalEmailCount !== 1 ? 's' : ''})
                              </span>
                            )}
                          </>
                        )}
                      </GradientButton>
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
