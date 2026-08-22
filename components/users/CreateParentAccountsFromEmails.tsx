import DisplayError from '@/components/ErrorMessage';
import GradientButton, {
  SmallGradientButton,
} from '@/components/styles/Button';
import {
  ImportPlan,
  parseParentEmailCSV,
  planParentEmailImport,
  PlannedAction,
} from '@/lib/csvParentEmailImportUtils';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useState } from 'react';
import toast from 'react-hot-toast';

const GET_ALL_STUDENTS_QUERY = gql`
  query GET_ALL_STUDENTS_FOR_PARENT_EMAILS {
    students: users(where: { isStudent: { equals: true } }) {
      id
      name
      email
    }
  }
`;

// Every user, not just parents. A contact on the school domain may already have
// a staff account, and creating a second user with that email would fail on the
// unique constraint - the child gets linked to the existing account instead.
const GET_ALL_USERS_QUERY = gql`
  query GET_ALL_USERS_FOR_PARENT_EMAILS {
    users {
      id
      name
      email
      isParent
      children {
        id
      }
    }
  }
`;

const CREATE_PARENT_MUTATION = gql`
  mutation CREATE_PARENT_FROM_EMAIL(
    $name: String!
    $email: String!
    $studentId: ID!
  ) {
    createUser(
      data: {
        name: $name
        email: $email
        password: "password"
        isParent: true
        children: { connect: { id: $studentId } }
      }
    ) {
      id
      email
    }
  }
`;

const LINK_CHILD_BY_EMAIL_MUTATION = gql`
  mutation LINK_CHILD_TO_PARENT_BY_EMAIL($email: String!, $studentId: ID!) {
    updateUser(
      where: { email: $email }
      data: { isParent: true, children: { connect: { id: $studentId } } }
    ) {
      id
      email
    }
  }
`;

// Small summary tile. `muted` dims a zero so a real count draws the eye.
function Stat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-black/25 px-3 py-2 text-center ${muted ? 'opacity-50' : ''}`}
    >
      <div className="text-2xl font-semibold leading-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-80">
        {label}
      </div>
    </div>
  );
}

type Step = 'upload' | 'preview' | 'complete';

interface RunResult {
  created: number;
  linked: number;
  failed: { parentEmail: string; studentName: string; message: string }[];
}

export default function CreateParentAccountsFromEmails() {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<RunResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: studentsData } = useGQLQuery(
    'allStudentsForParentEmails',
    GET_ALL_STUDENTS_QUERY,
    {},
    { enabled: showForm },
  );
  const { data: usersData } = useGQLQuery(
    'allUsersForParentEmails',
    GET_ALL_USERS_QUERY,
    {},
    { enabled: showForm },
  );

  const [, { error: createError, mutateAsync: createParent }] =
    useGqlMutation(CREATE_PARENT_MUTATION);
  const [, { error: linkError, mutateAsync: linkChild }] = useGqlMutation(
    LINK_CHILD_BY_EMAIL_MUTATION,
  );

  const isLoadingData = !studentsData?.students || !usersData?.users;

  const reset = () => {
    setStep('upload');
    setIsRunning(false);
    setPlan(null);
    setResult(null);
    setParseError(null);
    setProgress({ current: 0, total: 0 });
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    if (isLoadingData) {
      setParseError('Still loading students and users - try again in a moment.');
      return;
    }
    try {
      const rows = parseParentEmailCSV(await file.text());
      if (rows.length === 0) {
        setParseError(
          'No rows found. Expected a header line followed by: student email, contact email, contact email',
        );
        return;
      }
      setPlan(planParentEmailImport(rows, studentsData.students, usersData.users));
      setStep('preview');
    } catch (err: any) {
      setParseError(err?.message || 'Could not read that file.');
    }
  };

  const runImport = async () => {
    if (!plan) return;
    const actionable = plan.actions.filter(
      (a): a is Extract<PlannedAction, { kind: 'create' | 'link' }> =>
        a.kind === 'create' || a.kind === 'link',
    );
    setIsRunning(true);
    setProgress({ current: 0, total: actionable.length });
    const runResult: RunResult = { created: 0, linked: 0, failed: [] };

    // Sequential on purpose: a create and a later link can target the same
    // parent, so they must not race.
    for (let i = 0; i < actionable.length; i++) {
      const action = actionable[i];
      try {
        if (action.kind === 'create') {
          await createParent({
            // No contact names in this export, so the address doubles as the name.
            name: action.parentEmail,
            email: action.parentEmail,
            studentId: action.studentId,
          });
          runResult.created += 1;
        } else {
          await linkChild({
            email: action.parentEmail,
            studentId: action.studentId,
          });
          runResult.linked += 1;
        }
      } catch (err: any) {
        runResult.failed.push({
          parentEmail: action.parentEmail,
          studentName: action.studentName,
          message: err?.message || 'Unknown error',
        });
      }
      setProgress({ current: i + 1, total: actionable.length });
    }

    setResult(runResult);
    setIsRunning(false);
    setStep('complete');
    toast.success(
      `Parents: ${runResult.created} created, ${runResult.linked} linked` +
        (runResult.failed.length ? `, ${runResult.failed.length} failed` : ''),
    );
  };

  const problems = plan
    ? plan.actions.filter(
        (a) => a.kind === 'student-not-found' || a.kind === 'invalid-email',
      )
    : [];

  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
        onClick={() => {
          setShowForm(!showForm);
          reset();
        }}
      >
        Create Parent Accounts from Emails
      </GradientButton>

      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowForm(false)}
            data-testid="parent-emails-backdrop"
          />
          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Create Parent Accounts from Emails
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto text-white space-y-1">
              <DisplayError error={(createError || linkError) as any} />

              {step === 'upload' && (
                <div>
                  <div className="rounded-xl bg-black/20 p-4 mb-4">
                    <p className="text-sm font-semibold mb-2">
                      Expected CSV format
                    </p>
                    <p className="font-mono text-xs bg-black/30 rounded-lg px-3 py-2 mb-3 overflow-x-auto whitespace-nowrap">
                      student email,contact email,contact email
                    </p>
                    <p className="text-xs opacity-80 leading-relaxed">
                      The header line is skipped and columns are read by
                      position. Students are matched on email. This export has no
                      contact names, so each parent&apos;s email is used as their
                      name. Use &quot;Create Parent Accounts from CSV&quot;
                      instead when the export includes names.
                    </p>
                  </div>

                  {parseError && (
                    <p className="text-sm bg-[var(--redTrans)] border border-white/20 rounded-xl p-3 mb-4">
                      {parseError}
                    </p>
                  )}

                  <label
                    htmlFor="parentEmailCsv"
                    className="block border-2 border-dashed border-white/40 rounded-xl p-6 text-center cursor-pointer hover:border-white/70 hover:bg-white/5 transition-colors"
                  >
                    <span className="block text-sm font-semibold">
                      Choose a CSV file
                    </span>
                    <span className="block text-xs opacity-70 mt-1">
                      {isLoadingData
                        ? 'Loading students and existing users…'
                        : 'or drop one here'}
                    </span>
                    <input
                      id="parentEmailCsv"
                      type="file"
                      accept=".csv,text/csv"
                      disabled={isLoadingData}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
              )}

              {step === 'preview' && plan && (
                <div>
                  <p className="text-sm opacity-80 mb-3">
                    {plan.counts.rows} rows read
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <Stat label="To create" value={plan.counts.creates} />
                    <Stat label="To link" value={plan.counts.links} />
                    <Stat
                      label="Already linked"
                      value={plan.counts.alreadyLinked}
                    />
                    <Stat
                      label="Skipped"
                      value={problems.length}
                      muted={problems.length === 0}
                    />
                  </div>

                  {plan.counts.duplicateContactsCollapsed > 0 && (
                    <p className="text-xs opacity-70 mb-4">
                      {plan.counts.duplicateContactsCollapsed} repeated contact
                      {plan.counts.duplicateContactsCollapsed === 1 ? '' : 's'}{' '}
                      collapsed into a link, so no duplicate accounts are made.
                    </p>
                  )}

                  {problems.length > 0 && (
                    <details className="mb-4 rounded-xl bg-black/20 p-3">
                      <summary className="text-sm font-semibold cursor-pointer">
                        Skipped rows ({problems.length})
                      </summary>
                      <div className="max-h-40 overflow-y-auto text-xs font-mono mt-2 space-y-0.5">
                        {problems.map((p, i) => (
                          <div key={`problem-${i}`} className="opacity-80">
                            {p.kind === 'student-not-found'
                              ? `line ${p.line}: no student matches ${p.studentEmail}`
                              : `line ${p.line}: unusable contact "${p.parentEmail}" for ${p.studentEmail}`}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {isRunning ? (
                    <div>
                      <div className="h-2 w-full rounded-full bg-black/30 overflow-hidden">
                        <div
                          className="h-full bg-white/80 transition-all duration-300"
                          style={{
                            width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm mt-2">
                        {progress.current} of {progress.total}…
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 items-center">
                      <SmallGradientButton
                        type="button"
                        onClick={runImport}
                        disabled={
                          plan.counts.creates + plan.counts.links === 0
                        }
                      >
                        Import {plan.counts.creates + plan.counts.links} parents
                      </SmallGradientButton>
                      <SmallGradientButton type="button" onClick={reset}>
                        Choose another file
                      </SmallGradientButton>
                    </div>
                  )}
                </div>
              )}

              {step === 'complete' && result && (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <Stat label="Created" value={result.created} />
                    <Stat label="Linked" value={result.linked} />
                    <Stat
                      label="Failed"
                      value={result.failed.length}
                      muted={result.failed.length === 0}
                    />
                  </div>

                  {result.failed.length > 0 && (
                    <details open className="mb-4 rounded-xl bg-black/20 p-3">
                      <summary className="text-sm font-semibold cursor-pointer">
                        Failures ({result.failed.length})
                      </summary>
                      <div className="max-h-48 overflow-y-auto text-xs font-mono mt-2 space-y-0.5">
                        {result.failed.map((f, i) => (
                          <div key={`failed-${i}`} className="opacity-80">
                            {f.parentEmail} ({f.studentName}): {f.message}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <SmallGradientButton type="button" onClick={reset}>
                    Import another file
                  </SmallGradientButton>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
