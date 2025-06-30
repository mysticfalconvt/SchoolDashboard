import gql from "graphql-tag";
import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useQueryClient } from "react-query";
import Loading from "../components/Loading";
import SortingHatQuestions from "../components/SortingHatQuestions";
import { useGQLQuery } from "../lib/useGqlQuery";
import { useUser } from "../components/User";
import SortedHouse from "../components/SortedHouse";
import isAllowed from "../lib/isAllowed";
import NewSortingHatQuestion from "../components/NewSortingHatQuestionButton";

function arrayOfNumbersOneToFourInRandomOrder() {
  return [1, 2, 3, 4].sort(() => Math.random() - 0.5);
}

const SORTING_HAT_QUESTION_QUERY = gql`
  query SORTING_HAT_QUESTION_QUERY {
    sortingHatQuestions {
      id
      question
      gryffindorChoice
      slytherinChoice
      ravenclawChoice
      hufflepuffChoice
      createdBy {
        id
        name
      }
    }
  }
`;

const UPDATE_HOUSE = gql`
  mutation UPDATE_HOUSE($id: ID!, $house: String) {
    updateUser(id: $id, data: { sortingHat: $house }) {
      id
    }
  }
`;

export default function GetSorted() {
  const me = useUser();
  const queryClient = useQueryClient();
  const [questionNumber, setQuestionNumber] = useState(0);
  const [housePoints, setHousePoints] = useState({
    gryffindor: 0,
    hufflepuff: 0,
    ravenclaw: 0,
    slytherin: 0,
  });

  const [randomOrder, setRandomOrder] = useState(
    arrayOfNumbersOneToFourInRandomOrder()
  );

  const [updateHouse] = useMutation(UPDATE_HOUSE);

  const { data, isLoading, refetch } = useGQLQuery(
    "SortingHatQuestions",
    SORTING_HAT_QUESTION_QUERY,
    {}
  );
  // console.log(data);

  if (isLoading) return <Loading />;
  const maxQuestionNumber = data?.sortingHatQuestions.length - 1;

  const currentQuestion = data?.sortingHatQuestions[questionNumber];
  const winningHouse = Object.keys(housePoints).reduce((a, b) =>
    housePoints[a] > housePoints[b] ? a : b
  );

  function onAnswer(answer) {
    if (answer === currentQuestion.gryffindorChoice) {
      setHousePoints((prev) => ({
        ...prev,
        gryffindor: prev.gryffindor + 1,
      }));
    }
    if (answer === currentQuestion.hufflepuffChoice) {
      setHousePoints((prev) => ({
        ...prev,
        hufflepuff: prev.hufflepuff + 1,
      }));
    }
    if (answer === currentQuestion.ravenclawChoice) {
      setHousePoints((prev) => ({
        ...prev,
        ravenclaw: prev.ravenclaw + 1,
      }));
    }
    if (answer === currentQuestion.slytherinChoice) {
      setHousePoints((prev) => ({
        ...prev,
        slytherin: prev.slytherin + 1,
      }));
    }
    setRandomOrder(arrayOfNumbersOneToFourInRandomOrder());
    setQuestionNumber(questionNumber + 1);
  }

  if (me?.sortingHat)
    return (
      <SortedHouse house={me.sortingHat} updateHouse={updateHouse} me={me} />
    );

  return (
    <>
      <link
        href="http://fonts.cdnfonts.com/css/harrypotter7"
        rel="stylesheet"
      />
      {isAllowed(me, "isStaff") && <NewSortingHatQuestion />}
      <div className="flex flex-col justify-center items-center max-w-[1000px] mx-auto text-2xl transition-all duration-300 font-harrypotter">
        <h1 className="w-full text-4xl">Get Sorted into your house</h1>
        {questionNumber <= maxQuestionNumber ? (
          <SortingHatQuestions
            currentQuestion={currentQuestion}
            onAnswer={onAnswer}
          />
        ) : (
          <>
            <h2 className="text-3xl text-center">You are {winningHouse}</h2>
            <button
              type="button"
              onClick={async () => {
                await updateHouse({
                  variables: {
                    id: me.id,
                    house: winningHouse,
                  },
                });
                await queryClient.refetchQueries("me");
                setQuestionNumber(0);
              }}
              className="mt-5 text-white bg-gradient-to-r from-[#0e1a40] via-[#2a623d] via-[#eeba30] via-[#740001] via-[#fff4b1] via-[#ffdb00] to-[#5d5d5d] border-none rounded px-4 py-2 text-3xl cursor-pointer font-harrypotter"
            >
              Accept your choice
            </button>
            <button
              type="button"
              onClick={() => {
                setHousePoints({
                  gryffindor: 0,
                  hufflepuff: 0,
                  ravenclaw: 0,
                  slytherin: 0,
                });
                setQuestionNumber(0);
              }}
              className="mt-5 text-white bg-gradient-to-r from-[#0e1a40] via-[#2a623d] via-[#eeba30] via-[#740001] via-[#fff4b1] via-[#ffdb00] to-[#5d5d5d] border-none rounded px-4 py-2 text-3xl cursor-pointer font-harrypotter"
            >
              {" "}
              Start Over
            </button>
          </>
        )}
      </div>
    </>
  );
}
