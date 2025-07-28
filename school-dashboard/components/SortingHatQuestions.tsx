import React from 'react';

interface SortingHatQuestion {
  question: string;
  gryffindorChoice: string;
  slytherinChoice: string;
  hufflepuffChoice: string;
  ravenclawChoice: string;
}

interface SortingHatQuestionsProps {
  currentQuestion: SortingHatQuestion;
  onAnswer: (answer: string) => void;
}

const SortingHatQuestions: React.FC<SortingHatQuestionsProps> = ({
  currentQuestion,
  onAnswer,
}) => {
  return (
    <>
      <h2>{currentQuestion.question}</h2>
      <div className="questionContainer">
        <button onClick={() => onAnswer(currentQuestion.gryffindorChoice)}>
          {currentQuestion.gryffindorChoice}
        </button>
        <button onClick={() => onAnswer(currentQuestion.slytherinChoice)}>
          {currentQuestion.slytherinChoice}
        </button>
        <button onClick={() => onAnswer(currentQuestion.hufflepuffChoice)}>
          {currentQuestion.hufflepuffChoice}
        </button>
        <button onClick={() => onAnswer(currentQuestion.ravenclawChoice)}>
          {currentQuestion.ravenclawChoice}
        </button>
      </div>
    </>
  );
};

export default SortingHatQuestions;
