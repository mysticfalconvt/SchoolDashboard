import React, { useMemo, useState } from 'react';
import { SmallGradientButton } from '../styles/Button';
import ChromebookCheck from './ChromebookCheck';

interface ChromebookCheck {
  id: string;
  time: string;
  [key: string]: any;
}

interface TaStudent {
  id: string;
  name: string;
  chromebookCheck: ChromebookCheck[];
  [key: string]: any;
}

interface Teacher {
  id: string;
  name: string;
  taStudents: TaStudent[];
  [key: string]: any;
}

interface TeacherWithChecks {
  name: string;
  checks: ChromebookCheck[];
}

interface TeacherChromebookDataProps {
  teachers: Teacher[];
}

const TeacherChromebookData: React.FC<TeacherChromebookDataProps> = ({
  teachers,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState(7);

  const teacherData = useMemo(() => {
    // get all the teachers and an array of all checks for each teacher
    if (!teachers) return [];

    const teachersWithChecks: TeacherWithChecks[] = [];
    teachers.forEach((teacher) => {
      const teacherWithChecks: TeacherWithChecks = {
        name: teacher.name,
        checks: [],
      };
      teacher.taStudents.forEach((student) => {
        student.chromebookCheck.forEach((check) => {
          teacherWithChecks.checks.push(check);
        });
      });

      teachersWithChecks.push(teacherWithChecks);
    });

    const teachersWithFilteredChecks = teachersWithChecks.map((teacher) => {
      const teacherWithFilteredChecks: TeacherWithChecks = {
        name: teacher.name,
        checks: [],
      };
      teacher.checks.forEach((check) => {
        const checkDate = new Date(check.time);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - checkDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= dateRange) {
          teacherWithFilteredChecks.checks.push(check);
        }
      });
      return teacherWithFilteredChecks;
    });

    return teachersWithFilteredChecks;
  }, [teachers, dateRange]);

  return (
    <>
      <SmallGradientButton onClick={() => setShowModal(!showModal)}>
        Show Teacher Data
      </SmallGradientButton>
      {showModal ? (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="flex flex-col w-1/2 h-3/4 z-10 bg-slate-400 p-10 rounded-2xl">
            <span
              onClick={() => setShowModal(!showModal)}
              className="bg-indigo-800 text-red-500 self-end rounded-full h-10 w-10 text-center cursor-pointer"
            >
              &times;
            </span>
            <div className="flex flex-col gap-2 w-3/4 h-full items-stretch m-auto">
              <label htmlFor="dateRange">
                Date Range {dateRange} {`day${dateRange === 1 ? '' : 's'}`}
              </label>
              {/* slider from 1-30 days */}
              <input
                type="range"
                min="1"
                max="30"
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="border-2 border-gray-400 rounded-md text-gray-800"
              />
              <div className="flex flex-col justify-center gap-4 items-center h-full mt-2 overflow-auto">
                {teacherData.map((teacher) => (
                  <div key={`teacher-${teacher.name}`}>
                    <p>
                      {teacher.name} - {teacher.checks.length || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default TeacherChromebookData;
