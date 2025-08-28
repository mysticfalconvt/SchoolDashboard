import gql from 'graphql-tag';
import { GetStaticProps, NextPage } from 'next';
import { useMemo, useState } from 'react';
import DisplayError from '../components/ErrorMessage';
import EditLink from '../components/links/EditLink';
import NewLink from '../components/links/NewLink';
import Loading from '../components/Loading';
import Table from '../components/Table';
import { useUser } from '../components/User';
import { smartGraphqlClient } from '../lib/smartGraphqlClient';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

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

interface LinkData {
  id: string;
  name: string;
  link: string;
  onHomePage: boolean;
  description: string;
  forParents: boolean;
  forStudents: boolean;
  forTeachers: boolean;
  modified: string;
  modifiedBy: {
    name: string;
    id: string;
  };
}

interface LinksPageProps {
  rawLinksList?: {
    links: LinkData[];
  };
}

const Links: NextPage<LinksPageProps> = (props) => {
  const me = useUser();
  const editor = isAllowed(me, 'canManageLinks');
  const hiddenColumns = editor ? [] : ['Edit'];
  const [visibleForm, setVisibleForm] = useState('');
  const { data, isLoading, error, refetch } = useGQLQuery(
    'allLinks',
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
    },
  );
  // console.log(data)
  const filteredLinks = data?.links
    .filter((link: LinkData) => {
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
    .sort((a: LinkData, b: LinkData) => {
      if (a.name > b.name) {
        return 1;
      }
      return -1;
    });

  const columns = useMemo(
    () => [
      {
        Header: 'Links',
        columns: [
          {
            Header: 'Edit',
            Cell: ({ row }: any) => (
              <EditLink
                link={row.original}
                refetch={refetch}
                visibleForm={visibleForm}
                setVisibleForm={setVisibleForm}
              />
            ),
          },
          {
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }: any) => {
              const linkRaw = row.original.link;

              const link = linkRaw.startsWith('http')
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
            Header: 'description',
            accessor: 'description',
            Cell: ({ row }: any) => {
              const linkRaw = row.original.link;

              const link = linkRaw.startsWith('http')
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
    [refetch, visibleForm],
  );
  // console.log('editor', editor);
  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error as any} />;
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
};

export const getStaticProps: GetStaticProps<LinksPageProps> = async (
  context,
) => {
  // console.log(context);
  // fetch PBIS Page data from the server
  const fetchAllLinks = async (): Promise<{ links: LinkData[] }> =>
    smartGraphqlClient.request(GET_ALL_STATIC_LINKS_QUERY);

  const rawLinksList = await fetchAllLinks();

  return {
    props: {
      rawLinksList,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default Links;
