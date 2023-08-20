import gql from "graphql-tag";
import React from "react";
import styled from "styled-components";
import { useGQLQuery } from "../../lib/useGqlQuery";
import LineChart from "../Chart/LineChart";
import Loading from "../Loading";

const LineChartStyles = styled.div`
  /* position: relative; */
  width: 90%;
  height: 300px;
  margin: 10px auto;
  padding: 0;
  /* background-color: var(y); */
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  @media print {
    display: none;
  }
`;

export default function PbisCardChart(initialData) {
  // if (isLoading) return <Loading />;
  const chartDataRaw = initialData?.cardCounts;
  //   console.log(chartDataRaw);
  // parse the data array into Json object
  const chartData = chartDataRaw?.map((singleCollection) => ({
    item: singleCollection.collectionDate,
    data: singleCollection.collectedCards,
  }));

  return (
    <LineChartStyles>
      <LineChart
        title="Marbles Per Week"
        chartData={chartData}
        label="Marbles Per Week"
      />
    </LineChartStyles>
  );
}
