export interface PbisCountStudent {
  YearPbisCount: number;
}

export interface PbisBlockTeacher {
  id: string;
  name: string;
}

export interface PbisStudent extends PbisCountStudent {
  id: string;
  name: string;
  Last7DaysPbisCount?: number;
  Last30DaysPbisCount?: number;
  block1Teacher?: PbisBlockTeacher | null;
  block2Teacher?: PbisBlockTeacher | null;
  block3Teacher?: PbisBlockTeacher | null;
  block4Teacher?: PbisBlockTeacher | null;
  block5Teacher?: PbisBlockTeacher | null;
  block6Teacher?: PbisBlockTeacher | null;
  block7Teacher?: PbisBlockTeacher | null;
  block8Teacher?: PbisBlockTeacher | null;
  block9Teacher?: PbisBlockTeacher | null;
  block10Teacher?: PbisBlockTeacher | null;
  block11Teacher?: PbisBlockTeacher | null;
  block12Teacher?: PbisBlockTeacher | null;
}

export interface TeacherStudentStats extends PbisBlockTeacher {
  students: PbisStudent[];
  averageCards: number;
  medianCards: number;
  zeroCardStudents: number;
}

const blockTeacherKeys = [
  'block1Teacher',
  'block2Teacher',
  'block3Teacher',
  'block4Teacher',
  'block5Teacher',
  'block6Teacher',
  'block7Teacher',
  'block8Teacher',
  'block9Teacher',
  'block10Teacher',
  'block11Teacher',
  'block12Teacher',
] as const;

export const roundToOneDecimal = (value: number): number =>
  Math.round(value * 10) / 10;

export const getAveragePbisCount = (
  students: PbisCountStudent[],
): number => {
  if (students.length === 0) return 0;
  return (
    students.reduce((total, student) => total + student.YearPbisCount, 0) /
    students.length
  );
};

export const getMedianPbis = (students: PbisCountStudent[]): number => {
  if (students.length === 0) return 0;
  const counts = students
    .map((student) => student.YearPbisCount)
    .sort((a, b) => a - b);
  const middle = Math.floor(counts.length / 2);
  return counts.length % 2 === 0
    ? (counts[middle - 1] + counts[middle]) / 2
    : counts[middle];
};

export const getTeacherStudentStats = (
  students: PbisStudent[],
): TeacherStudentStats[] => {
  const teachers = new Map<
    string,
    { teacher: PbisBlockTeacher; students: Map<string, PbisStudent> }
  >();

  students.forEach((student) => {
    blockTeacherKeys.forEach((key) => {
      const teacher = student[key];
      if (!teacher) return;
      const entry = teachers.get(teacher.id) || {
        teacher,
        students: new Map<string, PbisStudent>(),
      };
      entry.students.set(student.id, student);
      teachers.set(teacher.id, entry);
    });
  });

  return Array.from(teachers.values())
    .map(({ teacher, students: studentMap }) => {
      const teacherStudents = Array.from(studentMap.values());
      return {
        ...teacher,
        students: teacherStudents,
        averageCards: getAveragePbisCount(teacherStudents),
        medianCards: getMedianPbis(teacherStudents),
        zeroCardStudents: teacherStudents.filter(
          (student) => student.YearPbisCount === 0,
        ).length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};
