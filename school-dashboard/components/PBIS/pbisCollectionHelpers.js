const cardsPerPersonalLevel = 75;
const cardsPerTaLevel = 24;
const levelsPerSchoolWideLevel = 2;

// get the number of students in teh team
// get the average number of cards per student in the team
export function getTaTeamData(data) {
  console.log("getting TA Team Data");
  const taTeamData = data.map((team) => {
    // for each team, get the team data
    const newCardsPerTeacher = team.taTeacher.map((ta) =>
      ta.taStudents
        .map((student) => student.uncountedCards)
        .reduce((a, b) => Number(a) + Number(b), 0)
    );
    const newCardsPerTeam = newCardsPerTeacher.reduce(
      (a, b) => Number(a) + Number(b),
      0
    );
    // console.log('cards per team', newCardsPerTeam);
    const numberOfStudentInTeam = team.taTeacher.reduce(
      (a, b) => a + b.taStudents.length,
      0
    );
    // console.log('number of student in team', numberOfStudentInTeam);

    const newAverageCardsPerStudent = newCardsPerTeam / numberOfStudentInTeam;
    const totalAverageCardsPerStudent =
      (team.averageCardsPerStudent || 0) + newAverageCardsPerStudent || 0;
    const newTeamLevel = Math.floor(
      totalAverageCardsPerStudent / cardsPerTaLevel
    );
    const taTeam = {
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
export function getPersonalLevel(data) {
  const allStudents = [];
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
      newCardsPerStudent / cardsPerPersonalLevel
    );
    const isNewLevel =
      Number(newPersonalLevel) > (Number(student.individualPbisLevel) || 0);
    const newStudent = {
      name: student.name,
      id: student.id,
      individualPbisLevel: newPersonalLevel || 0,
      isNewLevel: isNewLevel,
    };
    return newStudent;
  });
  const studentsAtNewLevel = newStudentData.filter(
    (student) => student.isNewLevel
  );
  const studentsAtNewLevelWithoutIsNewLevel = studentsAtNewLevel.map(
    (student) => {
      const newStudent = {
        name: student.name,
        id: student.id,
        individualPbisLevel: student.individualPbisLevel,
      };
      return newStudent;
    }
  );

  //   console.log('studentsAtNewLevel', studentsAtNewLevelWithoutIsNewLevel);
  return studentsAtNewLevelWithoutIsNewLevel;
}

// create a card to choose from for each card in students count
function createCardsForStudent(student) {
  const numberOfCardsToCreate = student.uncountedCards;
  const cards = [];
  for (let i = 0; i < numberOfCardsToCreate; i++) {
    cards.push({
      id: student.id,
      name: student.name,
    });
  }
  return cards;
}

// get the random winner for each TA
export function getRandomWinners(data) {
  const listOfAllTaTeachers = [];
  const taToGetWinners = data.map((team) => {
    // for each team get all the ta teachers
    const allTeachers = team.taTeacher.map((teacher) => {
      listOfAllTaTeachers.push(teacher);
      return teacher;
    });
    return allTeachers;
  });
  const randomWinners = listOfAllTaTeachers.map((teacher) => {
    const cardsToChooseFrom = [];
    teacher.taStudents.forEach((student) => {
      cardsToChooseFrom.push(...createCardsForStudent(student));
    });

    const cardsToChooseFromWithoutLastWinner = cardsToChooseFrom.filter(
      (card) => card.id !== teacher.currentTaWinner?.id
    );
    // console.log(
    //   'cardsToChooseFromWithoutLastWinner',
    //   cardsToChooseFromWithoutLastWinner
    // );
    const randomWinner = {};
    if (cardsToChooseFrom.length === 0) {
      randomWinner.name = "No Winner";
    } else if (cardsToChooseFromWithoutLastWinner.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * cardsToChooseFromWithoutLastWinner.length
      );
      randomWinner.id = cardsToChooseFromWithoutLastWinner[randomIndex].id;
      randomWinner.name = cardsToChooseFromWithoutLastWinner[randomIndex].name;
    } else {
      randomWinner.id = teacher.currentTaWinner.id;
      randomWinner.name = teacher.currentTaWinner.name;
    }

    const newTeacher = {
      name: teacher.name,
      id: teacher.id,
      randomWinner,
    };
    if (teacher.currentTaWinner) {
      newTeacher.previousTaWinner = teacher.currentTaWinner;
    }
    return newTeacher;
  });
  return randomWinners;
}

export function getLowestTaTeamLevel(data) {
  const lowestTaTeamLevel = data.reduce((a, b) =>
    a.currentTaLevel < b.currentTaLevel ? a : b
  ).currentTaLevel;

  return lowestTaTeamLevel;
}

export function getNewTaTeamLevelGoal(lowestTeam) {
  const newTaTeamLevelGoal =
    lowestTeam % levelsPerSchoolWideLevel ? lowestTeam + 1 : lowestTeam + 2;
  return newTaTeamLevelGoal;
}

export function getTeachersToUpdate(data) {
  const teachersToUpdate = data
    .map((teacher) => {
      const dataToReturn = {};
      if (teacher.randomWinner?.id && teacher.previousTaWinner?.id) {
        dataToReturn.where = { id: teacher.id };
        dataToReturn.data = {
          currentTaWinner: {
            connect: {
              id: teacher.randomWinner.id,
            },
          },
          previousTaWinner: {
            connect: {
              id: teacher.previousTaWinner.id,
            },
          },
        };
        return dataToReturn;
      }
      if (teacher.randomWinner?.id) {
        dataToReturn.where = { id: teacher.id };
        dataToReturn.data = {
          currentTaWinner: {
            connect: {
              id: teacher.randomWinner.id,
            },
          },
        };
        return dataToReturn;
      }
      return null;
    })
    .filter((teacher) => teacher);
  return teachersToUpdate;
}

export function getTaTeamsToUpdate(data) {
  const taTeamsToUpdate = data.map((team) => {
    const dataToReturn = {};

    dataToReturn.where = { id: team.id };
    dataToReturn.data = {
      currentLevel: team.currentTaLevel,
      averageCardsPerStudent: Math.round(team.averageCardsPerStudent),
      numberOfStudents: team.numberOfStudents,
    };
    return dataToReturn;
  });
  return taTeamsToUpdate;
}

export function getPbisCardsToMarkCollected(data) {
  const pbisCardsToMarkCollected = data.map((card) => {
    const dataToReturn = {};
    dataToReturn.where = { id: card.id };
    dataToReturn.data = {
      counted: true,
    };
    return dataToReturn;
  });
  return pbisCardsToMarkCollected;
}

export function getListOfStudentsToUpdate(data) {
  const allStudents = [];
  const students = data.map((team) => {
    // for each team get all the ta teachers
    const allTeachers = team.taTeacher.map((ta) => {
      // for each ta teacher get all the students
      const allTAStudents = ta.taStudents.map((student) => {
        allStudents.push(student.id);
        return student;
      });
      return allTAStudents;
    });
    return allTeachers;
  });
  return allStudents;
}

export function chunk(data, size) {
  const chunkedArray = [];
  for (let i = 0; i < data.length; i += size) {
    chunkedArray.push(data.slice(i, i + size));
  }
  return chunkedArray;
}
