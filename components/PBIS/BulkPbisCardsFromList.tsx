import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import { useUser } from '@/components/User';
import { lastNameCommaFirstName } from '@/lib/lastNameCommaFirstName';
import {
  matchPastedNameList,
  type MatchNameListResult,
  type NameListStudent,
} from '@/lib/pasteStudentNameList';
import { useGqlMutation } from '@/lib/useGqlMutation';
import { useAsyncGQLQuery, useGQLQuery } from '@/lib/useGqlQuery';
import gql from 'graphql-tag';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';

const GET_STUDENTS_FOR_BULK_CARDS = gql`
  query GET_STUDENTS_FOR_BULK_CARDS {
    students: users(where: { isStudent: { equals: true } }) {
      id
      name
      preferredName
    }
  }
`;

// Cards already given with this message, used to keep a student from getting
// the same award twice in the same stretch of days.
const GET_RECENT_CARDS_WITH_MESSAGE = gql`
  query GET_RECENT_CARDS_WITH_MESSAGE($message: String!, $since: DateTime!) {
    pbisCards(
      where: { cardMessage: { equals: $message }, dateGiven: { gte: $since } }
    ) {
      id
      dateGiven
      student {
        id
      }
    }
  }
`;

const CREATE_BULK_PBIS_CARDS = gql`
  mutation CREATE_BULK_PBIS_CARDS($cards: [PbisCardCreateInput!]!) {
    createPbisCards(data: $cards) {
      id
    }
  }
`;

const DEFAULT_CARDS_PER_STUDENT = 3;
const DEFAULT_CATEGORY = 'responsibility';
const PERFECT_ATTENDANCE_MESSAGE = 'Perfect Attendance';
// How far back we look for a card with the same message so we can warn that a
// student may be about to get the same award twice.
const DUPLICATE_WINDOW_DAYS = 5;
// Keep each mutation a reasonable size so a big paste does not time out.
const CARDS_PER_REQUEST = 100;

interface CardInput {
  student: { connect: { id: string } };
  teacher: { connect: { id: string } };
  category: string;
  cardMessage: string;
}

interface Teacher {
  id: string;
  name: string;
}

export function buildCardsForStudents({
  studentIds,
  teacherId,
  cardsPerStudent,
  category,
  message,
}: {
  studentIds: string[];
  teacherId: string;
  cardsPerStudent: number;
  category: string;
  message: string;
}): CardInput[] {
  const cards: CardInput[] = [];
  studentIds.forEach((studentId) => {
    for (let i = 0; i < cardsPerStudent; i++) {
      cards.push({
        student: { connect: { id: studentId } },
        teacher: { connect: { id: teacherId } },
        category,
        cardMessage: message,
      });
    }
  });
  return cards;
}

export function chunkCards(cards: CardInput[], size: number): CardInput[][] {
  const chunks: CardInput[][] = [];
  for (let i = 0; i < cards.length; i += size) {
    chunks.push(cards.slice(i, i + size));
  }
  return chunks;
}

const displayStudent = (student: NameListStudent) =>
  lastNameCommaFirstName(student.name);

function formatDate(date?: string): string {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString();
}

export function daysAgoIso(days: number, from: Date = new Date()): string {
  const since = new Date(from);
  since.setDate(since.getDate() - days);
  return since.toISOString();
}

interface RecentCard {
  id: string;
  dateGiven: string;
  student?: { id: string } | null;
}

// Latest date each student already got a card with this message.
export function latestCardDateByStudent(
  cards: RecentCard[],
): Record<string, string> {
  const latest: Record<string, string> = {};
  (cards || []).forEach((card) => {
    const studentId = card?.student?.id;
    if (!studentId) return;
    if (!latest[studentId] || card.dateGiven > latest[studentId]) {
      latest[studentId] = card.dateGiven;
    }
  });
  return latest;
}

export default function BulkPbisCardsFromList() {
  const me = useUser() as Teacher;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<'paste' | 'preview'>('paste');
  const [pastedNames, setPastedNames] = useState('');
  const [cardsPerStudent, setCardsPerStudent] = useState(
    DEFAULT_CARDS_PER_STUDENT,
  );
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [message, setMessage] = useState(PERFECT_ATTENDANCE_MESSAGE);
  const [preview, setPreview] = useState<MatchNameListResult | null>(null);
  const [recentCardDates, setRecentCardDates] = useState<
    Record<string, string>
  >({});
  const [duplicateCheckFailed, setDuplicateCheckFailed] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { data: studentsData, isLoading: studentsLoading } = useGQLQuery(
    'allStudentsForBulkCards',
    GET_STUDENTS_FOR_BULK_CARDS,
    {},
    { enabled: showForm, staleTime: 1000 * 60 * 60 },
  );
  const students: NameListStudent[] = useMemo(
    () => studentsData?.students || [],
    [studentsData],
  );

  const [, { error, mutateAsync: createCards }] = useGqlMutation(
    CREATE_BULK_PBIS_CARDS,
  );
  const fetchRecentCards = useAsyncGQLQuery(GET_RECENT_CARDS_WITH_MESSAGE);

  const cardMessage = message.trim() || PERFECT_ATTENDANCE_MESSAGE;

  const resetEverything = () => {
    setStep('paste');
    setPastedNames('');
    setPreview(null);
    setSelectedStudentIds([]);
    setCardsPerStudent(DEFAULT_CARDS_PER_STUDENT);
    setCategory(DEFAULT_CATEGORY);
    setMessage(PERFECT_ATTENDANCE_MESSAGE);
    setRecentCardDates({});
    setDuplicateCheckFailed(false);
    setProgress({ current: 0, total: 0 });
  };

  const closeForm = () => {
    setShowForm(false);
    resetEverything();
  };

  const handlePreview = async () => {
    if (!students.length) {
      toast.error('Students are still loading. Try again in a moment.');
      return;
    }
    const result = matchPastedNameList(pastedNames, students);
    if (
      result.matched.length === 0 &&
      result.ambiguous.length === 0 &&
      result.unmatched.length === 0
    ) {
      toast.error('No names found in that list.');
      return;
    }

    // Look for cards with this same message so nobody gets the award twice.
    let latestByStudent: Record<string, string> = {};
    let checkFailed = false;
    setIsCheckingDuplicates(true);
    try {
      const recent = await fetchRecentCards({
        message: cardMessage,
        since: daysAgoIso(DUPLICATE_WINDOW_DAYS),
      });
      latestByStudent = latestCardDateByStudent(recent?.pbisCards || []);
    } catch (err) {
      console.error('Error checking for recent PBIS cards:', err);
      checkFailed = true;
      toast.error(
        'Could not check for recent cards with this message. Double check before confirming.',
      );
    } finally {
      setIsCheckingDuplicates(false);
    }

    setRecentCardDates(latestByStudent);
    setDuplicateCheckFailed(checkFailed);
    setPreview(result);
    // Everyone who matched stays checked — recent cards are only a warning so
    // staff can decide for themselves before confirming.
    setSelectedStudentIds(result.matched.map((m) => m.student.id));
    setStep('preview');
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((current) =>
      current.includes(id)
        ? current.filter((sid) => sid !== id)
        : [...current, id],
    );
  };

  const totalCards = selectedStudentIds.length * cardsPerStudent;
  const alreadyGotCard = (preview?.matched || []).filter(
    (m) => recentCardDates[m.student.id],
  );

  const handleConfirm = async () => {
    if (!me?.id || selectedStudentIds.length === 0) return;
    setIsSaving(true);
    const cards = buildCardsForStudents({
      studentIds: selectedStudentIds,
      teacherId: me.id,
      cardsPerStudent,
      category,
      message: cardMessage,
    });
    const chunks = chunkCards(cards, CARDS_PER_REQUEST);
    setProgress({ current: 0, total: cards.length });

    try {
      let created = 0;
      for (const chunk of chunks) {
        await createCards({ cards: chunk });
        created += chunk.length;
        setProgress({ current: created, total: cards.length });
      }
      toast.success(
        `Gave ${created} card${created !== 1 ? 's' : ''} to ${
          selectedStudentIds.length
        } student${selectedStudentIds.length !== 1 ? 's' : ''}`,
      );
      await queryClient.invalidateQueries();
      closeForm();
    } catch (err) {
      console.error('Error creating bulk PBIS cards:', err);
      toast.error(
        `Failed to give cards${
          progress.current > 0 ? ` after ${progress.current} were created` : ''
        }. Please check the list and try again.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <GradientButton
        style={{ marginTop: '10px' }}
        onClick={() => setShowForm(!showForm)}
      >
        Give PBIS Cards to a List of Students
      </GradientButton>

      {showForm && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeForm}
          />

          {/* Modal */}
          <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
              <h4 className="text-white text-xl font-semibold">
                Give PBIS Cards to a List of Students
              </h4>
              <button
                type="button"
                onClick={closeForm}
                className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <DisplayError error={error as any} />

              {step === 'paste' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePreview();
                  }}
                >
                  <label
                    htmlFor="pastedNames"
                    className="block text-white font-semibold mb-1"
                  >
                    Paste the list of students (one per line, "Last First")
                    <textarea
                      required
                      rows={12}
                      id="pastedNames"
                      name="pastedNames"
                      placeholder={'Last First\nSmith Jane\nDoe John Michael'}
                      value={pastedNames}
                      onChange={(e) => setPastedNames(e.target.value)}
                      className="w-full p-2 rounded border mt-2 text-gray-900"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <label
                      htmlFor="cardsPerStudent"
                      className="block text-white font-semibold mb-1"
                    >
                      Cards per student
                      <input
                        type="number"
                        min="1"
                        max="10"
                        id="cardsPerStudent"
                        name="cardsPerStudent"
                        value={cardsPerStudent}
                        onChange={(e) =>
                          setCardsPerStudent(Number(e.target.value))
                        }
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        className="w-full p-2 rounded border mt-2 bg-white text-gray-900"
                      />
                    </label>

                    <label
                      htmlFor="category"
                      className="block text-white font-semibold mb-1"
                    >
                      Category
                      <select
                        id="category"
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 rounded border mt-2 bg-white text-gray-900"
                      >
                        <option value="responsibility">Responsibility</option>
                        <option value="respect">Respect</option>
                        <option value="perseverance">Perseverance</option>
                        <option value="class">Class</option>
                        <option value="physical">Physical</option>
                      </select>
                    </label>
                  </div>

                  <label
                    htmlFor="cardMessage"
                    className="block text-white font-semibold mb-1 mt-4"
                  >
                    Message
                    <input
                      type="text"
                      id="cardMessage"
                      name="cardMessage"
                      placeholder={PERFECT_ATTENDANCE_MESSAGE}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-2 rounded border mt-2 bg-white text-gray-900"
                    />
                  </label>
                  <p className="text-white text-xs mt-1 opacity-80">
                    Anyone who already got this message in the last{' '}
                    {DUPLICATE_WINDOW_DAYS} days is flagged on the next screen.
                  </p>

                  <div className="flex gap-2 mt-6">
                    <button
                      type="submit"
                      disabled={
                        studentsLoading ||
                        isCheckingDuplicates ||
                        !pastedNames.trim()
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      {studentsLoading
                        ? 'Loading students...'
                        : isCheckingDuplicates
                          ? 'Checking recent cards...'
                          : 'Show the list'}
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {step === 'preview' && preview && (
                <div className="space-y-4">
                  <div className="bg-white bg-opacity-10 p-3 rounded">
                    <p className="text-white text-sm">
                      <strong>{selectedStudentIds.length}</strong> student
                      {selectedStudentIds.length !== 1 ? 's' : ''} selected ×{' '}
                      <strong>{cardsPerStudent}</strong> card
                      {cardsPerStudent !== 1 ? 's' : ''} ={' '}
                      <strong>{totalCards}</strong> card
                      {totalCards !== 1 ? 's' : ''} to give.
                    </p>
                    <p className="text-white text-sm mt-1">
                      Category: <strong>{category}</strong> — Message:{' '}
                      <strong>{cardMessage}</strong>
                    </p>
                  </div>

                  {alreadyGotCard.length > 0 && (
                    <div className="p-3 rounded bg-yellow-600 bg-opacity-30 border border-yellow-400">
                      <h4 className="text-white font-semibold mb-2">
                        ⚠️ Already got "{cardMessage}" in the last{' '}
                        {DUPLICATE_WINDOW_DAYS} days ({alreadyGotCard.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {alreadyGotCard.map(({ student }) => (
                          <p key={student.id} className="text-white text-sm">
                            {displayStudent(student)} —{' '}
                            {formatDate(recentCardDates[student.id])}
                          </p>
                        ))}
                      </div>
                      <p className="text-white text-xs mt-2 opacity-80">
                        They are still checked. Uncheck anyone who should not
                        get this card again before you confirm.
                      </p>
                    </div>
                  )}

                  {duplicateCheckFailed && (
                    <div className="p-3 rounded bg-red-600 bg-opacity-30 border border-red-400">
                      <p className="text-white text-sm">
                        We could not check for recent "{cardMessage}" cards, so
                        students may end up with a duplicate.
                      </p>
                    </div>
                  )}

                  <div className="bg-white bg-opacity-10 p-3 rounded">
                    <h4 className="text-white font-semibold mb-2">
                      ✅ Matched students ({preview.matched.length})
                    </h4>
                    {preview.matched.length === 0 ? (
                      <p className="text-white text-sm">
                        No students matched this list.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {preview.matched.map(({ line, student }) => (
                          <label
                            key={student.id}
                            className="flex items-center gap-2 text-white text-sm"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => toggleStudent(student.id)}
                            />
                            <span>
                              {displayStudent(student)}
                              <span className="opacity-70">
                                {' '}
                                — from "{line}"
                              </span>
                              {recentCardDates[student.id] && (
                                <span className="text-yellow-200">
                                  {' '}
                                  ⚠️ already got "{cardMessage}" on{' '}
                                  {formatDate(recentCardDates[student.id])}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {preview.unmatched.length > 0 && (
                    <div className="p-3 rounded bg-red-600 bg-opacity-30 border border-red-400">
                      <h4 className="text-white font-semibold mb-2">
                        ❌ Could not find these students (
                        {preview.unmatched.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {preview.unmatched.map((line) => (
                          <p key={line} className="text-white text-sm">
                            {line}
                          </p>
                        ))}
                      </div>
                      <p className="text-white text-xs mt-2 opacity-80">
                        These will not get cards. Fix the spelling and run the
                        list again if they should.
                      </p>
                    </div>
                  )}

                  {preview.ambiguous.length > 0 && (
                    <div className="p-3 rounded bg-yellow-600 bg-opacity-30 border border-yellow-400">
                      <h4 className="text-white font-semibold mb-2">
                        ⚠️ More than one student matched (
                        {preview.ambiguous.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {preview.ambiguous.map(({ line, candidates }) => (
                          <p key={line} className="text-white text-sm">
                            <strong>{line}</strong> →{' '}
                            {candidates.map((c) => c.name).join(', ')}
                          </p>
                        ))}
                      </div>
                      <p className="text-white text-xs mt-2 opacity-80">
                        These are skipped. Give them cards individually.
                      </p>
                    </div>
                  )}

                  {preview.duplicates.length > 0 && (
                    <div className="p-3 rounded bg-white bg-opacity-10">
                      <h4 className="text-white font-semibold mb-2">
                        ♻️ Repeated lines ({preview.duplicates.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {preview.duplicates.map(({ line, student }) => (
                          <p key={line} className="text-white text-sm">
                            {line} — already counted as{' '}
                            {displayStudent(student)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSaving && progress.total > 0 && (
                    <p className="text-white text-sm">
                      Giving cards... {progress.current} / {progress.total}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isSaving || selectedStudentIds.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      {isSaving
                        ? 'Giving cards...'
                        : `Give ${totalCards} card${
                            totalCards !== 1 ? 's' : ''
                          }`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('paste')}
                      disabled={isSaving}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      Back to the list
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
