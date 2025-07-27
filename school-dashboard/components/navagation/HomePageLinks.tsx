import gql from 'graphql-tag';
import Link from 'next/link';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';
import { useUser, type User } from '../User';
import GradientButton from '../styles/Button';

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
  if (error) return <DisplayError>{error.message}</DisplayError>;
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
          <GradientButton key={link.id}>
            <Link
              href={linkToUse}
              className="bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] text-[var(--navTextColor)] py-0.5 px-6 h-max rounded-full m-2"
            >
              {link.name}
            </Link>
          </GradientButton>
        );
      })}
    </>
  );
}
