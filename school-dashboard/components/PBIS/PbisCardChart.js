import gql from "graphql-tag";
import React from "react";
import { useGQLQuery } from "../../lib/useGqlQuery";
import LineChart from "../Chart/LineChart";
import Loading from "../Loading";

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
    <div className="w-[90%] h-[300px] mx-auto my-2 p-0 shadow-[0_0_10px_0_rgba(0,0,0,0.1)] print:hidden">
      <LineChart
        title="Marbles Per Week"
        chartData={chartData}
        label="Marbles Per Week"
      />
    </div>
  );
}
