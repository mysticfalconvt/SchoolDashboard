import { capitalizeFirstLetter } from '../../lib/nameUtils';

interface Student {
  id: string;
  name: string;
  individualPbisLevel?: number;
}

interface Teacher {
  id: string;
  name: string;
  taTeamPbisLevel: number;
  taTeamAveragePbisCardsPerStudent: number;
}

interface Staff {
  id: string;
  name: string;
}

interface Winner {
  student: Student;
}

interface CollectionData {
  name: string;
  personalLevelWinners: Student[];
  taNewLevelWinners: Teacher[];
  randomDrawingWinners?: Winner[];
  staffRandomWinners?: Staff[];
}

interface DisplayPbisCollectionDataProps {
  collectionData: CollectionData;
}

export default function DisplayPbisCollectionData({
  collectionData,
}: DisplayPbisCollectionDataProps) {
  const studentsWhoWentUpLevel = collectionData.personalLevelWinners;
  const teamsThatWentUpLevel = collectionData.taNewLevelWinners;
  const randomDrawingWinners =
    collectionData.randomDrawingWinners?.map((winner) => winner.student) || [];
  const staffRandomWinners = collectionData.staffRandomWinners || [];
  return (
    <div>
      <h2>Stats at last collection: {collectionData.name}</h2>

      <h3 className="hidePrint">
        {teamsThatWentUpLevel.length} TA Teams and{' '}
        {studentsWhoWentUpLevel.length} students have gone up a level
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamsThatWentUpLevel.map((teacher) => (
          <div
            key={`ta-${teacher.id}`}
            className="border border-gray-300 rounded p-4"
          >
            <h3>TA Bingo!</h3>
            <h4>{teacher.name}</h4>
            <h4>Level {teacher.taTeamPbisLevel}</h4>
            <p>{teacher.taTeamAveragePbisCardsPerStudent} cards per student</p>
          </div>
        ))}
        {studentsWhoWentUpLevel.map((student) => (
          <div
            key={`level-${student.id}`}
            className="border border-gray-300 rounded p-4"
          >
            <h3>Student Level-Up</h3>
            <h4>{student.name}</h4>
            <h4>Level {student.individualPbisLevel}</h4>
          </div>
        ))}
        {randomDrawingWinners.map((student) => (
          <div
            key={`random-${student.id}`}
            className="border border-gray-300 rounded p-4"
          >
            <h3>Random Drawing Winner</h3>
            <h4>{capitalizeFirstLetter(student.name)}</h4>
          </div>
        ))}
        {staffRandomWinners.map((staff) => (
          <div
            key={`staff-${staff.id}`}
            className="border border-gray-300 rounded p-4"
          >
            <h3>Staff Random Drawing Winner</h3>
            <h4>{staff.name}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}
