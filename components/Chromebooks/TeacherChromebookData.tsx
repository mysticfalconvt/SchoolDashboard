import React, { useMemo, useState } from 'react';
import GradientButton from '../styles/Button';
import { Dialog, DialogContent } from '../styles/Dialog';

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
    <div>
      <GradientButton onClick={() => setShowModal(true)}>
        Show Teacher Data
      </GradientButton>

      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Teacher Chromebook Data"
        variant="modal"
        size="lg"
        maxHeight="80vh"
      >
        <DialogContent maxHeight="max-h-[70vh]" className="p-4">
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-bold text-white mb-1">Teacher Statistics</h2>
              <p className="text-white/80 text-sm">
                View chromebook check counts by teacher over a specified date range
              </p>
            </div>

            <div className="bg-base-200/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text text-white font-medium">
                    Date Range: {dateRange} {`day${dateRange === 1 ? '' : 's'}`}
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={dateRange}
                  onChange={(e) => setDateRange(Number(e.target.value))}
                  className="range range-primary"
                />
                <div className="w-full flex justify-between text-xs text-white/60 px-2 mt-1">
                  <span>1 day</span>
                  <span>15 days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto">
                {teacherData.map((teacher) => (
                  <div 
                    key={`teacher-${teacher.name}`}
                    className="flex justify-between items-center p-3 bg-base-200/30 rounded-lg"
                  >
                    <span className="text-white font-medium">{teacher.name}</span>
                    <span className="badge badge-primary">
                      {teacher.checks.length || 0} checks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-outline text-white border-white/30 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherChromebookData;
