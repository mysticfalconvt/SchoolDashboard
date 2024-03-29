import gql from "graphql-tag";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GraphQLClient } from "graphql-request";
import DisplayError from "../components/ErrorMessage";
import Table from "../components/Table";
import { useGQLQuery } from "../lib/useGqlQuery";
import { useUser } from "../components/User";
import NewLink from "../components/links/NewLink";
import Loading from "../components/Loading";
import isAllowed from "../lib/isAllowed";
import EditLink from "../components/links/EditLink";
import { endpoint, prodEndpoint } from "../config";

const GET_ALL_LINKS_QUERY = gql`
  query GET_ALL_LINKS_QUERY {
    links {
      id
      name
      link
      onHomePage
      description
      forParents
      forStudents
      forTeachers
      modified
      modifiedBy {
        name
        id
      }
    }
  }
`;
const GET_ALL_STATIC_LINKS_QUERY = gql`
  query GET_ALL_STATIC_LINKS_QUERY {
    links {
      id
      name
      link
      onHomePage
      description
      modified
      forParents
      forStudents
      forTeachers
      modifiedBy {
        name
        id
      }
    }
  }
`;

export default function Links(props) {
  const me = useUser();
  const editor = isAllowed(me, "canManageLinks");
  const hiddenColumns = editor ? "" : "Edit";
  const [visibleForm, setVisibleForm] = useState("");
  const { data, isLoading, error, refetch } = useGQLQuery(
    "allLinks",
    GET_ALL_LINKS_QUERY,
    {
      forTeachers: me?.isStaff || null,
      forStudents: me?.isStudent || null,
      forParents: me?.isParent || null,
    },
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 3,
      initialData: props?.rawLinksList,
    }
  );
  // console.log(data)
  const filteredLinks = data?.links
    .filter((link) => {
      if (link.forParents && me?.isParent) {
        return true;
      }
      if (link.forStudents && me?.isStudent) {
        return true;
      }
      if (link.forTeachers && me?.isStaff) {
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      }
      return -1;
    });

  const columns = useMemo(
    () => [
      {
        Header: "Links",
        columns: [
          {
            Header: "Edit",
            Cell: ({ row }) => (
              <EditLink
                link={row.original}
                refetch={refetch}
                visibleForm={visibleForm}
                setVisibleForm={setVisibleForm}
              />
            ),
          },
          {
            Header: "Name",
            accessor: "name",
            Cell: ({ row }) => {
              const linkRaw = row.original.link;

              const link = linkRaw.startsWith("http")
                ? linkRaw
                : `http://${linkRaw}`;

              return (
                <a target="_blank" rel="noopener noreferrer" href={link}>
                  {row.original.name}
                </a>
              );
            },
          },
          {
            Header: "description",
            accessor: "description",
            Cell: ({ row }) => {
              const linkRaw = row.original.link;

              const link = linkRaw.startsWith("http")
                ? linkRaw
                : `http://${linkRaw}`;

              return (
                <a target="_blank" rel="noopener noreferrer" href={link}>
                  {row.original.description}
                </a>
              );
            },
          },
        ],
      },
    ],
    [refetch, visibleForm]
  );
  // console.log('editor', editor);
  if (isLoading) return <Loading />;
  if (error) return <DisplayError>{error.message}</DisplayError>;
  return (
    <div>
      <NewLink hidden={!editor} refetchLinks={refetch} />
      <Table
        data={filteredLinks || []}
        columns={columns}
        searchColumn="name"
        hiddenColumns={hiddenColumns}
      />
    </div>
  );
}

export async function getStaticProps(context) {
  // console.log(context);
  // fetch PBIS Page data from the server
  const headers = {
    credentials: "include",
    mode: "cors",
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
    headers
  );
  const fetchAllLinks = async () =>
    graphQLClient.request(GET_ALL_STATIC_LINKS_QUERY);

  const rawLinksList = await fetchAllLinks();

  return {
    props: {
      rawLinksList,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
