import gql from 'graphql-tag';
import Link from 'next/link';
import { useGQLQuery } from '../../lib/useGqlQuery';
import DisplayError from '../ErrorMessage';
import Loading from '../Loading';
import { useUser } from '../User';

export const GET_HOMEPAGE_LINKS = gql`
  query GET_HOMEPAGE_LINKS {
    links(where: { onHomePage: {equals:true} }) {
      id
      link
      name
      forParents
      forStudents
      forTeachers
    }
  }
`;

export default function HomePageLinks({ initialData }) {
  // console.log('initialData', initialData);
  const me = useUser();
  // console.log('me', me);
  const { data, isLoading, error } = useGQLQuery(
    'HomePageLinks',
    GET_HOMEPAGE_LINKS,
    {},
    {
      enabled: !!me,
      initialData,
      staleTime: 1000 * 60 * 3, // 3 minutes
    }
  );

  if (!me) return <Loading />;
  if (error) return <DisplayError>{error.message}</DisplayError>;
  const filteredLinks = data?.links?.filter((link) => {
    if (link.forParents && me.isParent) return true;
    if (link.forStudents && me.isStudent) return true;
    if (link.forTeachers && me.isStaff) return true;
    return false;
  });

  return (
    <div className="flex flex-wrap mb-6 pl-8 justify-around">
      {filteredLinks?.map((link) => {
        const linkToUse = link.link.startsWith('http')
          ? `${link.link}`
          : `http://${link.link}`;
        return (
          <Link
            key={link.id}
            href={linkToUse}
            className="bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] text-[var(--navTextColor)] py-0.5 px-6 h-max rounded-full m-2"
          >
            {link.name}
          </Link>
        );
      })}
    </div>
  );
}
