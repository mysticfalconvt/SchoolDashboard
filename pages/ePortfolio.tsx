import gql from 'graphql-tag';
import type { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import DisplayError from '../components/ErrorMessage';
import Loading from '../components/Loading';
import Table from '../components/Table';
import { useUser } from '../components/User';
import { smartGraphqlClient } from '../lib/smartGraphqlClient';
import isAllowed from '../lib/isAllowed';
import { useGQLQuery } from '../lib/useGqlQuery';

const GET_ALL_PORTFOLIO_LINKS_QUERY = gql`
  query GET_ALL_PORTFOLIO_LINKS_QUERY {
    links(where: { forEPortfolio: { equals: true } }) {
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

interface Link {
  id: string;
  name: string;
  link: string;
  onHomePage: boolean;
  description: string;
  modified: string;
  forParents: boolean;
  forStudents: boolean;
  forTeachers: boolean;
  modifiedBy: {
    name: string;
    id: string;
  };
}

interface EPortfolioPageProps {
  rawLinksList?: {
    links: Link[];
  };
}

const EPortfolio: NextPage<EPortfolioPageProps> = (props) => {
  const me = useUser();
  const editor = isAllowed(me, 'canManageLinks');
  const hiddenColumns = editor ? [] : ['Edit'];
  const [visibleForm, setVisibleForm] = useState('');
  const { data, isLoading, error, refetch } = useGQLQuery(
    'ePortfolioLinks',
    GET_ALL_PORTFOLIO_LINKS_QUERY,
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
    .filter((link: Link) => {
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
    .sort((a: Link, b: Link) => {
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
            Header: 'Name',
            accessor: 'name',
            Cell: ({ row }: any) => {
              const linkRaw = row.original.link;

              const link = linkRaw.startsWith('http')
                ? linkRaw
                : `http://${linkRaw}`;

              return (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl"
                  href={link}
                >
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
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl"
                  href={link}
                >
                  {row.original.description}
                </a>
              );
            },
          },
        ],
      },
    ],
    [],
  );

  if (isLoading) return <Loading />;
  if (error) return <DisplayError error={error} />;
  return (
    <div>
      <h1 className="text-4xl mb-5 text-center">E-Portfolio Information</h1>
      <Table
        data={filteredLinks || []}
        columns={columns}
        searchColumn="name"
        hiddenColumns={hiddenColumns}
      />
    </div>
  );
};

export const getStaticProps: GetStaticProps<EPortfolioPageProps> = async (
  context,
) => {
  // console.log(context);
  // fetch PBIS Page data from the server
  const fetchAllLinks = async (): Promise<{ links: Link[] }> =>
    smartGraphqlClient.request(GET_ALL_PORTFOLIO_LINKS_QUERY);

  const rawLinksList = await fetchAllLinks();

  return {
    props: {
      rawLinksList,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default EPortfolio;
