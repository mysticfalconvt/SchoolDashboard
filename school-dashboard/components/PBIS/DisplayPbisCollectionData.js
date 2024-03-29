import ProgressBar from "@ramonak/react-progress-bar";
import { capitalizeFirstLetter } from "../../lib/nameUtils";
import { TeamCardStyles } from "../../pages/pbis";
import { useUser } from "../User";

export default function DisplayPbisCollectionData({ collectionData }) {
  const studentsWhoWentUpLevel = collectionData.personalLevelWinners;
  const teamsThatWentUpLevel = collectionData.taNewLevelWinners;
  const randomDrawingWinners =
    collectionData.randomDrawingWinners?.map((winner) => winner.student) || [];
  const staffRandomWinners = collectionData.staffRandomWinners || [];
  return (
    <div>
      <h2>Stats at last collection: {collectionData.name}</h2>

      <h3 className="hidePrint">
        {teamsThatWentUpLevel.length} TA Teams and{" "}
        {studentsWhoWentUpLevel.length} students have gone up a level
      </h3>
      <TeamCardStyles>
        {teamsThatWentUpLevel.map((teacher) => (
          <div key={`ta-${teacher.id}`}>
            <h3>TA Quest!</h3>
            <h4>{teacher.name}</h4>
            <h4>Level {teacher.taTeamPbisLevel}</h4>
            <p>{teacher.taTeamAveragePbisCardsPerStudent} cards per student</p>
          </div>
        ))}
        {studentsWhoWentUpLevel.map((student) => (
          <div key={`level-${student.id}`}>
            <h3>Student Level-Up</h3>
            <h4>{student.name}</h4>
            <h4>Level {student.individualPbisLevel}</h4>
          </div>
        ))}
        {randomDrawingWinners.map((student) => (
          <div key={`random-${student.id}`}>
            <h3>Random Drawing Winner</h3>
            <h4>{capitalizeFirstLetter(student.name)}</h4>
          </div>
        ))}
        {staffRandomWinners.map((staff) => (
          <div key={`staff-${staff.id}`}>
            <h3>Staff Random Drawing Winner</h3>
            <h4>{staff.name}</h4>
          </div>
        ))}
      </TeamCardStyles>
    </div>
  );
}
