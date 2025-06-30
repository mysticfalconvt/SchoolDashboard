import gql from "graphql-tag";
import React, { useMemo } from "react";
import Link from "next/link";
import NewBullying from "../components/discipline/BullyingButton";
import Loading from "../components/Loading";
import Table from "../components/Table";
import { useUser } from "../components/User";
import { useGQLQuery } from "../lib/useGqlQuery";

const BULLYING_DATA_QUERY = gql`
  query BULLYING_DATA_QUERY {
    bullyings(orderBy: { dateReported: desc }) {
      id
      studentOffender {
        id
        name
      }
      teacherAuthor {
        id
        name
      }
      dateReported
    }
  }
`;

export default function Bullying() {
  const me = useUser();
  const { data, isLoading, isError, refetch } = useGQLQuery(
    "allBullyings",
    BULLYING_DATA_QUERY
  );

  const columns = useMemo(
    () => [
      {
        Header: "Discipline",
        columns: [
          {
            Header: "Student",
            accessor: "studentOffender.name",
            Cell: ({ cell }) => (
              <Link href={`/hhb/${cell?.row?.original?.id || ""}`}>
                {cell?.value || "N/A"}
              </Link>
            ),
          },
          {
            Header: "Teacher",
            accessor: "teacherAuthor.name",
            Cell: ({ cell }) => (
              <Link href={`/hhb/${cell?.row?.original?.id || ""}`}>
                {cell?.value || "N/A"}
              </Link>
            ),
          },

          {
            Header: "Date ",
            accessor: "dateReported",
            Cell: ({ cell: { value } }) => {
              const today = new Date().toLocaleDateString();
              const displayDate = new Date(value).toLocaleDateString();
              const isToday = today === displayDate;
              return isToday ? `📆 Today 📆` : displayDate;
            },
          },
        ],
      },
    ],
    []
  );
  if (isLoading) return <Loading />;
  return (
    <div className="flex flex-col flex-wrap justify-around">
      <div className="max-w-[500px]">
        <NewBullying refetch={refetch} />
      </div>
      <h2 className="text-center">Hazing Harassment Bullying</h2>
      <div className="flex-basis-full w-[1000px]">
        <Table
          columns={columns}
          data={data?.bullyings}
          searchColumn="studentOffender.name"
        />
      </div>
    </div>
  );
}
