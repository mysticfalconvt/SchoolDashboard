import {
  getAveragePbisCount,
  getMedianPbis,
  getTeacherStudentStats,
  PbisStudent,
} from '../pbisStats';

describe('PBIS statistics', () => {
  it('calculates averages and medians, including empty data', () => {
    expect(getAveragePbisCount([])).toBe(0);
    expect(getMedianPbis([])).toBe(0);
    expect(
      getAveragePbisCount([
        { YearPbisCount: 2 },
        { YearPbisCount: 8 },
      ]),
    ).toBe(5);
    expect(
      getMedianPbis([
        { YearPbisCount: 9 },
        { YearPbisCount: 1 },
        { YearPbisCount: 4 },
      ]),
    ).toBe(4);
  });

  it('includes all blocks and counts a student once per teacher', () => {
    const teacher = { id: 'teacher-1', name: 'Teacher One' };
    const students: PbisStudent[] = [
      {
        id: 'student-1',
        name: 'Student One',
        YearPbisCount: 6,
        block1Teacher: teacher,
        block9Teacher: teacher,
      },
      {
        id: 'student-2',
        name: 'Student Two',
        YearPbisCount: 0,
        block12Teacher: teacher,
      },
    ];

    expect(getTeacherStudentStats(students)).toEqual([
      expect.objectContaining({
        id: teacher.id,
        students,
        averageCards: 3,
        medianCards: 3,
        zeroCardStudents: 1,
      }),
    ]);
  });
});
