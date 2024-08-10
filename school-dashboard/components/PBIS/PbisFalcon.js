import gql from "graphql-tag";
import Image from "next/image";
import styled from "styled-components";
import { useGQLQuery } from "../../lib/useGqlQuery";
import DisplayError from "../ErrorMessage";
import Loading from "../Loading";
import * as React from "react";
// gql query to get number of cards
export const TOTAL_PBIS_CARDS = gql`
  query {
    pbisCardsCount
  }
`;

const ContainerStyles = styled.div`
  height: 150px;
  width: 150px;
  background-color: var(--red);
  border-radius: 50;
  margin: 50;
  margin: 0.5rem;
  border-radius: 3px;
  border: 3px solid var(--red);

  .filler {
    width: 100%;
    height: ${({ percentageLeft }) => percentageLeft}%;
    background-color: var(--blue);
    position: relative;
    bottom: 0px;
    transition: width 1s ease-in-out;
    text-align: right;
    border-radius: 3px 3px 0px 0px;
  }

  .label {
    position: absolute;
    /* padding: 5; */
    color: white;
    font-weight: bold;
    left: 20px;
    right: 20px;
    text-align: center;
  }
  .total {
    position: absolute;
    /* padding: 5; */
    color: white;
    font-weight: bold;
    /* left: 20px; */
    /* right: 20px; */
    /* bottom: 00px; */
    transform: translate(${({ cardOffset }) => cardOffset});
    /* text-align: center; */
  }
  img {
    position: absolute;
    top: 2px;
    left: 5%;
    width: 125px;
    height: 125px;
    /* height: 100%; */
  }
  .falcon {
    position: absolute;
    top: 2px;
    left: 5%;
    width: 125px;
    height: 125px;
  }
`;

export default function PbisFalcon({ initialCount }) {
  let queryOptions = {};
  const initialData = {};
  initialData.pbisCardsCount = initialCount;

  if (initialCount) {
    queryOptions = {
      initialData,
      staleTime: 1000 * 60 * 3,
    };
  }
  const { data, isLoading, error } = useGQLQuery(
    "totalPbisCards",
    TOTAL_PBIS_CARDS,
    {},
    queryOptions
  );
  // last years card total
  const cardGoal = 60000;
  // console.log('data', data);
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error} />;
  const percentageFull =
    Math.round((data?.pbisCardsCount / cardGoal) * 10000) / 100;
  const percentageLeft = 100 - percentageFull;
  const getTotalCardsOffset = () => {
    if (percentageLeft > 60) {
      return "30px, -30px";
    }
    if (percentageLeft > 40) {
      return "30px, -10px";
    }
    if (percentageLeft > 30) {
      return "30px, 20px";
    }

    return "30px, 30px";
  };
  const cardOffset = getTotalCardsOffset();
  return (
    <div>
      <ContainerStyles percentageLeft={percentageLeft} cardOffset={cardOffset}>
        <div className="filler">
          <img src="/falcon.svg" alt="falcon" className="falcon" />
          <span className="label">{`${percentageFull}%`}</span>
        </div>
        <span className="total">{data.pbisCardsCount} cards</span>
      </ContainerStyles>
    </div>
  );
}
