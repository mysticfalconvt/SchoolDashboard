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
  position: relative;
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
    height: ${({ 'data-percentage-left': percentageLeft }) => percentageLeft}%;
    background-color: var(--blue);
    position: relative;
    bottom: 0px;
    transition: width 1s ease-in-out;
    text-align: right;
    border-radius: 3px 3px 0px 0px;
  }

  .label {
    position: absolute;
    color: white;
    font-weight: bold;
    left: 20px;
    right: 20px;
    text-align: center;
  }
  .total {
    position: absolute;
    color: white;
    font-weight: bold;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 1000;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  }
  img {
    position: absolute;
    top: 2px;
    left: 5%;
    width: 125px;
    height: 125px;
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
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error} />;

  const displayCount = data?.pbisCardsCount;
  const percentageFull =
    Math.round((displayCount / cardGoal) * 10000) / 100;
  const percentageLeft = 100 - percentageFull;

  return (
    <ContainerStyles data-percentage-left={percentageLeft}>
      <div className="filler">
        <img src="/falcon.svg" alt="falcon" className="falcon" />
        <span className="label">{`${percentageFull}%`}</span>
      </div>
      <span className="total">{displayCount} cards</span>
    </ContainerStyles>
  );
}
