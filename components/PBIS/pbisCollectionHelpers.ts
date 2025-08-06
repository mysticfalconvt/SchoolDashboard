const cardsPerPersonalLevel = 75;
const cardsPerTaLevel = 24;
const levelsPerSchoolWideLevel = 2;

interface TaStudent {
  id: string;
  name: string;
  individualPbisLevel: number;
  uncountedCards: number;
  totalCards: number;
}

interface TaTeacher {
  id: string;
  name: string;
  currentTaWinner?: { id: string; name: string };
  previousTaWinner?: { id: string; name: string };
  taStudents: TaStudent[];
}

interface TaTeam {
  id: string;
  teamName: string;
  averageCardsPerStudent: number;
  numberOfStudents: number;
  currentLevel: number;
  taTeacher: TaTeacher[];
}

interface TaTeamData {
  id: string;
  name: string;
  averageCardsPerStudent: number;
  numberOfStudents: number;
  currentTaLevel: number;
  isNewLevel: boolean;
}

interface StudentLevelData {
  name: string;
  id: string;
  individualPbisLevel: number;
  isNewLevel: boolean;
}

interface StudentLevelDataWithoutFlag {
  name: string;
  id: string;
  individualPbisLevel: number;
}

interface RandomWinner {
  student: {
    id: string;
    name: string;
    taTeacher: {
      name: string;
    };
  };
}

interface TeacherUpdateData {
  where: { id: string };
  data: {
    currentTaWinner?: { connect: { id: string } };
    previousTaWinner?: { connect: { id: string } };
  };
}

interface TaTeamUpdateData {
  where: { id: string };
  data: {
    currentLevel: number;
    averageCardsPerStudent: number;
  };
}

interface CardUpdateData {
  where: { id: string };
  data: {
    counted: boolean;
  };
}

// get the number of students in teh team
// get the average number of cards per student in the team
export function getTaTeamData(data: TaTeam[]): TaTeamData[] {
  console.log('getting TA Team Data');
  const taTeamData = data.map((team) => {
    // for each team, get the team data
    const newCardsPerTeacher = team.taTeacher.map((ta) =>
      ta.taStudents
        .map((student) => student.uncountedCards)
        .reduce((a, b) => Number(a) + Number(b), 0),
    );
    const newCardsPerTeam = newCardsPerTeacher.reduce(
      (a, b) => Number(a) + Number(b),
      0,
    );
    // console.log('cards per team', newCardsPerTeam);
    const numberOfStudentInTeam = team.taTeacher.reduce(
      (a, b) => a + b.taStudents.length,
      0,
    );
    // console.log('number of student in team', numberOfStudentInTeam);

    const newAverageCardsPerStudent = newCardsPerTeam / numberOfStudentInTeam;
    const totalAverageCardsPerStudent =
      (team.averageCardsPerStudent || 0) + newAverageCardsPerStudent || 0;
    const newTeamLevel = Math.floor(
      totalAverageCardsPerStudent / cardsPerTaLevel,
    );
    const taTeam: TaTeamData = {
      id: team.id,
      name: team.teamName,
      averageCardsPerStudent: totalAverageCardsPerStudent,
      numberOfStudents: numberOfStudentInTeam,
      currentTaLevel: newTeamLevel || 0,
      isNewLevel: newTeamLevel > (team.currentLevel || 0),
    };

    return taTeam;
  });
  return taTeamData;
  //   console.log('taTeamData', taTeamData);
}

// get the personal level of each student and
// return students at a new level with their level
export function getPersonalLevel(
  data: TaTeam[],
): StudentLevelDataWithoutFlag[] {
  const allStudents: TaStudent[] = [];
  const students = data.map((team) => {
    // for each team get all the ta teachers
    const allTeachers = team.taTeacher.map((ta) => {
      // for each ta teacher get all the students
      const allTAStudents = ta.taStudents.map((student) => {
        allStudents.push(student);
        return student;
      });
      return allTAStudents;
    });
    return allTeachers;
  });
  const newStudentData = allStudents.map((student) => {
    const newCardsPerStudent = student.totalCards;
    const newPersonalLevel = Math.floor(
      newCardsPerStudent / cardsPerPersonalLevel,
    );
    const isNewLevel =
      Number(newPersonalLevel) > (Number(student.individualPbisLevel) || 0);
    const newStudent: StudentLevelData = {
      name: student.name,
      id: student.id,
      individualPbisLevel: newPersonalLevel || 0,
      isNewLevel: isNewLevel,
    };
    return newStudent;
  });
  const studentsAtNewLevel = newStudentData.filter(
    (student) => student.isNewLevel,
  );
  const studentsAtNewLevelWithoutIsNewLevel = studentsAtNewLevel.map(
    (student) => {
      const newStudent: StudentLevelDataWithoutFlag = {
        name: student.name,
        id: student.id,
        individualPbisLevel: student.individualPbisLevel,
      };
      return newStudent;
    },
  );

  //   console.log('studentsAtNewLevel', studentsAtNewLevelWithoutIsNewLevel);
  return studentsAtNewLevelWithoutIsNewLevel;
}

// create a card to choose from for each card in students count
function createCardsForStudent(student: TaStudent) {
  const numberOfCardsToCreate = student.uncountedCards;
  const cards = [];
  for (let i = 0; i < numberOfCardsToCreate; i++) {
    cards.push(student);
  }
  return cards;
}

// get random winners from each team
export function getRandomWinners(data: TaTeam[]): RandomWinner[] {
  const allCards = [];
  data.map((team) => {
    // for each team get all the ta teachers
    const allTeachers = team.taTeacher.map((ta) => {
      // for each ta teacher get all the students
      const allTAStudents = ta.taStudents.map((student) => {
        // create a card for each uncounted card
        const cardsForStudent = createCardsForStudent(student);
        allCards.push(...cardsForStudent);
        return cardsForStudent;
      });
      return allTAStudents;
    });
    return allTeachers;
  });
  // shuffle the cards
  const shuffledCards = allCards.sort(() => Math.random() - 0.5);
  // get the first 10 cards
  const randomWinners = shuffledCards.slice(0, 10);
  // convert the cards to the format we need
  const randomWinnersFormatted = randomWinners.map((card) => ({
    student: {
      id: card.id,
      name: card.name,
      taTeacher: {
        name: 'Unknown',
      },
    },
  }));
  return randomWinnersFormatted;
}

// get the lowest TA team level
export function getLowestTaTeamLevel(data: TaTeamData[]): number {
  const levels = data.map((team) => team.currentTaLevel);
  const lowestLevel = Math.min(...levels);
  return lowestLevel;
}

// get the new TA team level goal
export function getNewTaTeamLevelGoal(lowestTeam: number): number {
  const newGoal = lowestTeam + levelsPerSchoolWideLevel;
  return newGoal;
}

// get the teachers to update with new winners
export function getTeachersToUpdate(data: RandomWinner[]): TeacherUpdateData[] {
  const teachersToUpdate = data.map((winner) => {
    const teacherUpdateData: TeacherUpdateData = {
      where: { id: winner.student.taTeacher.name },
      data: {
        currentTaWinner: { connect: { id: winner.student.id } },
        previousTaWinner: { connect: { id: winner.student.id } },
      },
    };
    return teacherUpdateData;
  });
  return teachersToUpdate;
}

// get the TA teams to update with new data
export function getTaTeamsToUpdate(data: TaTeamData[]): TaTeamUpdateData[] {
  const taTeamsToUpdate = data.map((team) => {
    const taTeamUpdateData: TaTeamUpdateData = {
      where: { id: team.id },
      data: {
        currentLevel: team.currentTaLevel,
        averageCardsPerStudent: team.averageCardsPerStudent,
      },
    };
    return taTeamUpdateData;
  });
  return taTeamsToUpdate;
}

// get the PBIS cards to mark as collected
export function getPbisCardsToMarkCollected(
  data: { id: string }[],
): CardUpdateData[] {
  const cardsToUpdate = data.map((card) => {
    const cardUpdateData: CardUpdateData = {
      where: { id: card.id },
      data: {
        counted: true,
      },
    };
    return cardUpdateData;
  });
  return cardsToUpdate;
}

// get the list of students to update
export function getListOfStudentsToUpdate(data: TaTeam[]): string[] {
  const allStudents: string[] = [];
  data.map((team) => {
    // for each team get all the ta teachers
    const allTeachers = team.taTeacher.map((ta) => {
      // for each ta teacher get all the students
      const allTAStudents = ta.taStudents.map((student) => {
        allStudents.push(student.id);
        return student.id;
      });
      return allTAStudents;
    });
    return allTeachers;
  });
  return allStudents;
}

// chunk an array into smaller arrays
export function chunk<T>(data: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }
  return chunks;
}
