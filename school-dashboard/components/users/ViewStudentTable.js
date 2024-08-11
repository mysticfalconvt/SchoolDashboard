import { useMemo } from "react";
import Link from "next/link";
import Table from "../Table";
import QuickPbisButton from "../PBIS/QuickPbisButton";
import { callbackDisabled } from "../../config";

export default function ViewStudentTable({ users, title }) {
  const columns = useMemo(
    () => [
      {
        Header: title || "Students",
        columns: [
          {
            Header: "Name",
            accessor: "name",
            Cell: ({ row }) => {
              const { name } = row.original;
              const nameWithFirstLetterUpperCase = name
                .split(" ")
                .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
                .join(" ");

              const { preferredName } = row.original;
              const nameToShow = preferredName
                ? `${nameWithFirstLetterUpperCase} - (${preferredName})`
                : nameWithFirstLetterUpperCase;
              return (
                <>
                  <Link href={`/userProfile/${row.original.id}`}>
                    {nameToShow}
                  </Link>
                  <QuickPbisButton id={row.original.id} />
                </>
              );
            },
          },

          {
            Header: "TA Teacher",
            accessor: "taTeacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.taTeacher?.id;
              //   console.log(showLink);
              if (showLink)
                return (
                  <Link href={`/userProfile/${row.original?.taTeacher?.id}`}>
                    {row.original?.taTeacher?.name}
                  </Link>
                );
              return null;
            },
          },

          {
            Header: "Weekly PBIS",
            accessor: "PbisCardCount",
          },
          {
            Header: "Yearly PBIS",
            accessor: "YearPbisCount",
          },
          {
            Header: "Individual PBIS Level",
            accessor: "individualPbisLevel",
          },
          {
            Header: "Callback",
            accessor: "callbackCount",
          },
          {
            Header: "Average days on callback",
            accessor: "averageTimeToCompleteCallback",
          },
        ],
      },
    ],
    [title]
  );

  const sortedStudents = useMemo(() => {
    if (!users) return [];
    return users.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      // sort by last name
      const aLastName = aName.split(" ")[1];
      const bLastName = bName.split(" ")[1];
      if (aLastName < bLastName) return -1;
      if (aLastName > bLastName) return 1;
      // if last names are the same, sort by first name
      const aFirstName = aName.split(" ")[0];
      const bFirstName = bName.split(" ")[0];
      if (aFirstName < bFirstName) return -1;
      if (aFirstName > bFirstName) return 1;
      return 0;
    });
  }, [users]);
  const hiddenColumns = callbackDisabled
    ? ["callbackCount", "averageTimeToCompleteCallback"]
    : [];
  console.log(hiddenColumns);
  return (
    <div>
      <Table
        data={sortedStudents || []}
        columns={columns}
        searchColumn="name"
        showSearch={false}
        hiddenColumns={hiddenColumns}
      />
    </div>
  );
}
