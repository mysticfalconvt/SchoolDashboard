import gql from 'graphql-tag';
import { useMemo, useState } from 'react';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';
import GradientButton, { SmallGradientButton } from '../styles/Button';
import { FormDialog } from '../styles/Dialog';

const RANDOM_STUDENT_POOL_QUERY = gql`
  query RANDOM_STUDENT_POOL_QUERY($since: DateTime!) {
    staffPbisCards(where: { dateGiven: { gte: $since } }) {
      id
      giver {
        id
        name
        isStudent
        taTeacher {
          name
        }
      }
    }
    pbisCards(where: { dateGiven: { gte: $since } }) {
      id
      student {
        id
        name
        isStudent
        taTeacher {
          name
        }
      }
      teacher {
        id
        isStaff
      }
    }
  }
`;

interface Student {
  id: string;
  name: string;
  isStudent?: boolean;
  taTeacher?: { name: string } | null;
}

interface StaffCard {
  id: string;
  giver?: Student | null;
}

interface RegularCard {
  id: string;
  student?: Student | null;
  teacher?: { id: string; isStaff?: boolean } | null;
}

interface PoolData {
  staffPbisCards?: StaffCard[];
  pbisCards?: RegularCard[];
}

export function uniqueStudents(students: Array<Student | null | undefined>) {
  return Array.from(
    new Map(
      students
        .filter((student): student is Student => !!student?.id)
        .map((student) => [student.id, student]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export default function RandomStudentDrawing() {
  const [isOpen, setIsOpen] = useState(false);
  const [weeks, setWeeks] = useState(2);
  const [studentsWhoGave, setStudentsWhoGave] = useState(true);
  const [winner, setWinner] = useState<Student | null>(null);

  const since = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - weeks * 7);
    return date.toISOString();
  }, [weeks]);

  const { data, isLoading, error } = useGQLQuery<PoolData>(
    'randomStudentDrawingPool',
    RANDOM_STUDENT_POOL_QUERY,
    { since },
    { enabled: isOpen, staleTime: 60 * 1000 },
  );

  const pool = useMemo(() => {
    if (studentsWhoGave) {
      return uniqueStudents(
        (data?.staffPbisCards || [])
          .filter((card) => card.giver?.isStudent)
          .map((card) => card.giver),
      );
    }

    return uniqueStudents(
      (data?.pbisCards || [])
        .filter(
          (card) => card.student?.isStudent && card.teacher?.isStaff,
        )
        .map((card) => card.student),
    );
  }, [data, studentsWhoGave]);

  const updatePoolType = () => {
    setStudentsWhoGave((current) => !current);
    setWinner(null);
  };

  const chooseWinner = () => {
    if (!pool.length) return;
    setWinner(pool[Math.floor(Math.random() * pool.length)]);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setWinner(null);
  };

  return (
    <>
      <SmallGradientButton
        type="button"
        title="Choose a random student"
        onClick={() => setIsOpen(true)}
      >
        Random Student
      </SmallGradientButton>

      <FormDialog
        isOpen={isOpen}
        onClose={closeDialog}
        title="Choose a Random Student"
        size="md"
      >
        <div className="flex flex-col gap-5 text-white py-4">
          <div>
            <p className="font-semibold mb-2">Eligible students</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className={studentsWhoGave ? 'font-bold' : 'opacity-75'}>
                Gave a staff card
              </span>
              <Toggle
                role="switch"
                aria-label="Student pool type"
                checked={!studentsWhoGave}
                onChange={updatePoolType}
                icons={false}
                className="student-drawing-toggle"
              />
              <span className={!studentsWhoGave ? 'font-bold' : 'opacity-75'}>
                Received a PBIS card
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-2" htmlFor="drawing-weeks">
            <span className="font-semibold">
              Time range: last {weeks} {weeks === 1 ? 'week' : 'weeks'}
            </span>
            <input
              id="drawing-weeks"
              type="range"
              min="1"
              max="12"
              step="1"
              value={weeks}
              onChange={(event) => {
                setWeeks(Number(event.target.value));
                setWinner(null);
              }}
              className="range range-info"
            />
            <div className="flex justify-between text-xs opacity-80">
              <span>1 week</span>
              <span>12 weeks</span>
            </div>
          </label>

          {isLoading && <Loading />}
          {error && <DisplayError error={error} />}
          {!isLoading && !error && (
            <>
              <p className="text-lg font-semibold text-center">
                {pool.length} {pool.length === 1 ? 'student is' : 'students are'} in the pool
              </p>

              {winner && (
                <div
                  className="rounded-2xl border-2 border-white/70 bg-black/20 p-5 text-center"
                  aria-live="polite"
                >
                  <p className="m-0 text-sm uppercase tracking-wider">Winner</p>
                  <p className="m-0 text-3xl font-bold">{winner.name}</p>
                  {winner.taTeacher?.name && (
                    <p className="m-0 mt-1">TA: {winner.taTeacher.name}</p>
                  )}
                </div>
              )}

              <GradientButton
                type="button"
                onClick={chooseWinner}
                disabled={pool.length === 0}
                className="self-center"
              >
                {winner ? 'Choose Another Winner' : 'Choose Winner'}
              </GradientButton>
            </>
          )}
        </div>
      </FormDialog>
      <style jsx global>{`
        .student-drawing-toggle .react-toggle-track,
        .student-drawing-toggle:hover:not(.react-toggle--disabled)
          .react-toggle-track {
          background-color: #760d08;
        }

        .student-drawing-toggle.react-toggle--checked .react-toggle-track,
        .student-drawing-toggle.react-toggle--checked:hover:not(
            .react-toggle--disabled
          )
          .react-toggle-track {
          background-color: #38b6ff;
        }

        .student-drawing-toggle.react-toggle--checked .react-toggle-thumb {
          border-color: #38b6ff;
        }
      `}</style>
    </>
  );
}
