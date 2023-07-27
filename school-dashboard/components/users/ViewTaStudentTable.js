import { useMemo, useState } from "react";
import Link from "next/link";
import Table from "../Table";

export default function ViewTaStudentTable({
  users,
  title,
  discipline = false,
}) {
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
                <Link href={`/userProfile/${row.original.id}`}>
                  {nameToShow}
                </Link>
              );
            },
          },

          {
            Header: "PBIS Cards",
            accessor: "studentPbisCardsCount",
          },
          {
            Header: "Callback",
            accessor: "callbackCount",
          },
          {
            Header: "Total Callbacks",
            accessor: "callbackItemsCount",
          },
          {
            Header: "Average days on callback",
            accessor: "averageTimeToCompleteCallback",
          },
          {
            Header: "Block 1",
            accessor: "block1Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block1Teacher?.id;
              //   console.log(showLink);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block1Teacher?.id}`}
                  >
                    {row.original?.block1Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Block 2",
            accessor: "block2Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block2Teacher?.id;
              //   console.log(showLink);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block2Teacher?.id}`}
                  >
                    {row.original?.block2Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Block 3",
            accessor: "block3Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block3Teacher?.id;
              //   console.log(showLink);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block3Teacher?.id}`}
                  >
                    {row.original?.block3Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Block 4",
            accessor: "block4Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block4Teacher?.id;
              //   console.log(showLink);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block4Teacher?.id}`}
                  >
                    {row.original?.block4Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Block 5",
            accessor: "block5Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block5Teacher?.id;
              // console.log(row);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block5Teacher?.id}`}
                  >
                    {row.original?.block5Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Block 6",
            accessor: "block6Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block6Teacher?.id;
              // console.log(row);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block6Teacher?.id}`}
                  >
                    {row.original?.block6Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Block 7",
            accessor: "block7Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block7Teacher?.id;
              // console.log(row);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block7Teacher?.id}`}
                  >
                    {row.original?.block7Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Block 8",
            accessor: "block8Teacher.name",
            Cell: ({ row }) => {
              const showLink = !!row.original?.block8Teacher?.id;
              // console.log(row);
              if (showLink)
                return (
                  <Link
                    href={`/userProfile/${row.original?.block8Teacher?.id}`}
                  >
                    {row.original?.block8Teacher?.name}
                  </Link>
                );
              return null;
            },
          },
          {
            Header: "Parent Account",
            accessor: "parent",
            Cell: ({ cell }) => {
              const parentAcountExist = cell.value?.length > 0;
              // console.log(parentAcountExist);
              return parentAcountExist ? "✅" : "❌";
            },
          },
          {
            Header: "ODR",
            accessor: "studentDisciplineCount",
          },
          {
            Header: "Chromebook",
            accessor: "ChromebookChecks",
            Cell: ({ cell }) => {
              const [showTooltip, setShowTooltip] = useState(false);
              const chromebookCheckExist = cell.value?.length > 0;
              const icon = "";
              const count = cell.value?.length;
              const passedCount = cell.value?.filter(
                (item) => item.message === "Passed"
              )?.length;
              const failedCount = cell.value?.filter(
                (item) => item.message !== "Passed"
              )?.length;
              if (count === passedCount) icon = "✅";
              if (count === failedCount) icon = "❌";
              if (!count) icon = "🅾️";
              if (count > passedCount && count > failedCount) icon = "⚠️";
              return (
                <div
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {showTooltip && (
                    <div
                      style={{
                        position: "absolute",
                        backgroundColor: "white",
                        border: "1px solid black",
                        padding: "1rem",
                        borderRadius: "5px",
                        boxShadow: "0 0 10px 0 rgba(0,0,0,0.2)",
                        zIndex: 1,
                        width: "max-content",
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div>Passed: {passedCount}</div>
                      <div>Failed: {failedCount}</div>
                      {cell.value
                        ?.filter((item) => item.message !== "Passed")
                        ?.map((item) => (
                          <div key={item.id}>
                            {item.message} -{" "}
                            {new Date(item.time).toLocaleDateString()}
                          </div>
                        ))}
                    </div>
                  )}
                  <span>{icon}</span> {count}
                </div>
              );
            },
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

  const hiddenColumns = discipline
    ? "ChromebookChecks"
    : "studentDisciplineCount";
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
