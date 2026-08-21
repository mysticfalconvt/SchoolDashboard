import React, { useMemo, useState } from 'react';
import GradientButton from '../styles/Button';
import { Dialog, DialogContent } from '../styles/Dialog';
import { NO_CLASSROOM, type ChromebookCheck } from './ChromebookChecksData';

interface TeacherWithChecks {
  id: string;
  name: string;
  count: number;
}

interface TeacherChromebookDataProps {
  checks: ChromebookCheck[];
}

const TeacherChromebookData: React.FC<TeacherChromebookDataProps> = ({
  checks,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState(7);

  const teacherData = useMemo(() => {
    // Count checks by the classroom they were performed in, within the range
    if (!checks) return [];

    const byClassroom = new Map<string, TeacherWithChecks>();

    checks.forEach((check) => {
      const checkDate = new Date(check.time);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - checkDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > dateRange) return;

      const classroom = check.classroom ?? NO_CLASSROOM;
      const existing = byClassroom.get(classroom.id);
      if (existing) {
        existing.count += 1;
        return;
      }
      byClassroom.set(classroom.id, {
        id: classroom.id,
        name: classroom.name,
        count: 1,
      });
    });

    return Array.from(byClassroom.values()).sort((a, b) => b.count - a.count);
  }, [checks, dateRange]);

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
                View chromebook check counts by classroom over a specified date range
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
                    key={`teacher-${teacher.id}`}
                    className="flex justify-between items-center p-3 bg-base-200/30 rounded-lg"
                  >
                    <span className="text-white font-medium">{teacher.name}</span>
                    <span className="badge badge-primary">
                      {teacher.count || 0} checks
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
