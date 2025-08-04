import gql from 'graphql-tag';
import Link from 'next/link';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';
import { useUser, type User } from '../User';

export const GET_HOMEPAGE_LINKS = gql`
  query GET_HOMEPAGE_LINKS {
    links(where: { onHomePage: { equals: true } }) {
      id
      link
      name
      forParents
      forStudents
      forTeachers
    }
  }
`;

interface Link {
  id: string;
  link: string;
  name: string;
  forParents: boolean;
  forStudents: boolean;
  forTeachers: boolean;
}

interface HomePageLinksProps {
  me?: User;
  initialData?: {
    links: Link[];
  };
}

export default function HomePageLinks({ me, initialData }: HomePageLinksProps) {
  // console.log('initialData', initialData);
  const currentUser = useUser();
  const user = me || currentUser;
  // console.log('me', me);
  const { data, isLoading, error } = useGQLQuery(
    'HomePageLinks',
    GET_HOMEPAGE_LINKS,
    {},
    {
      enabled: !!user,
      initialData,
      staleTime: 1000 * 60 * 3, // 3 minutes
    },
  );

  if (!user) return <Loading />;
  if (error) return <DisplayError error={error as any} />;
  const filteredLinks = data?.links?.filter((link) => {
    if (link.forParents && user.isParent) return true;
    if (link.forStudents && user.isStudent) return true;
    if (link.forTeachers && user.isStaff) return true;
    return false;
  });

  return (
    <>
      {filteredLinks?.map((link) => {
        const linkToUse = link.link.startsWith('http')
          ? `${link.link}`
          : `http://${link.link}`;
        return (
          <Link
            key={link.id}
            href={linkToUse}
            className="text-white py-0.5 px-6 h-max rounded-full m-2 inline-block shadow-lg hover:brightness-110 transition-all duration-200"
            style={{ background: 'linear-gradient(to top right, #760D08, #38B6FF)' }}
          >
            {link.name}
          </Link>
        );
      })}
    </>
  );
}
