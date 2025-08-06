import { resetIdCounter, useCombobox } from 'downshift';
import gql from 'graphql-tag';
import { useRouter } from 'next/dist/client/router';
import React, { useMemo, useState } from 'react';
import { commandPallettePaths } from '../lib/CommandPallettePaths';
import getDisplayName from '../lib/displayName';
import { capitalizeFirstLetter, UserTypeDisplay } from '../lib/nameUtils';
import { useGQLQuery } from '../lib/useGqlQuery';
import { GET_CALENDARS } from './calendars/Calendars';
import { useUser } from './User';

const SEARCH_ALL_LINKS_QUERY = gql`
  query GET_ALL_LINKS {
    links(where: { forTeachers: { equals: true } }) {
      id
      name
      description
      link
    }
  }
`;

interface User {
  id: string;
  name: string;
  email: string;
  preferredName?: string;
  isStaff: boolean;
  isParent: boolean;
  isStudent: boolean;
}

interface Link {
  id: string;
  name: string;
  description: string;
  link: string;
}

interface Calendar {
  id: string;
  name: string;
  date: string;
  description: string;
}

interface SearchItem {
  id: string;
  name: string;
  icon: string;
  path: string;
}

function formatUsers(users: User[] = []): SearchItem[] {
  return users.map((user) => {
    const name = capitalizeFirstLetter(getDisplayName(user));
    return {
      id: user.id,
      name: name,
      icon: UserTypeDisplay(user),
      path: `/userProfile/${user.id}`,
    };
  });
}

function formatLinks(links: Link[] = []): SearchItem[] {
  return links.map((link) => {
    // if path doesnt have http add it
    const formattedPath = link.link.startsWith('http')
      ? link.link
      : `http://${link.link}`;
    const nameAndDescription = `${link.name} - ${link.description}`;
    return {
      id: link.id,
      name: nameAndDescription,
      icon: '🔗',
      path: formattedPath,
    };
  });
}

function formatCalendars(calendars: Calendar[] = []): SearchItem[] {
  return calendars.map((calendar) => {
    const date = new Date(calendar.date).toLocaleDateString();
    const nameAndDescription = `${calendar.name} - ${date} - ${calendar.description}`;
    return {
      id: calendar.id,
      name: nameAndDescription,
      icon: '📅',
      path: `/calendarEvent/${calendar.id}`,
    };
  });
}

export const SEARCH_ALL_USERS_QUERY = gql`
  query SEARCH_ALL_USERS_QUERY {
    users {
      id
      name
      preferredName
      isStaff
      isParent
      isStudent
    }
  }
`;

const Search: React.FC = () => {
  const me = useUser();
  const router = useRouter();
  const { data: allUsers, isLoading } = useGQLQuery(
    'allUsers',
    SEARCH_ALL_USERS_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
    },
  );
  const { data: allLinks } = useGQLQuery(
    'searchLinks',
    SEARCH_ALL_LINKS_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
    },
  );

  const { data: allCalendars } = useGQLQuery(
    'allCalendars',
    GET_CALENDARS,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
    },
  );

  const [itemsToDisplay, setItemsToDisplay] = useState<SearchItem[]>([]);

  // memoized list of data to display
  const formatedItems = useMemo(() => {
    // list of paths if staff
    const extraPaths = me?.isStaff ? commandPallettePaths : [];
    if (allUsers) {
      return [
        ...formatUsers(allUsers?.users),
        ...extraPaths,
        ...formatLinks(allLinks?.links),
        ...formatCalendars(allCalendars?.calendars),
      ];
    }
    return [];
  }, [me?.isStaff, allUsers, allLinks?.links, allCalendars?.calendars]);

  const items = itemsToDisplay;

  const filterUsers = (valueToFilter: string) => {
    if (valueToFilter === '') {
      setItemsToDisplay([]);
      return;
    }
    const itemsToShow = formatedItems.filter((user) =>
      user.name.toLowerCase().includes(valueToFilter?.toLowerCase()),
    );
    const eightItems = itemsToShow?.slice(0, 8);
    setItemsToDisplay(eightItems || []);
  };

  // if in dev mode display users without role
  if (process.env.NODE_ENV !== 'production') {
    const allUsersWithoutRole = allUsers?.users.filter(
      (user: User) => !user.isStaff && !user.isParent && !user.isStudent,
    );
  }

  resetIdCounter();
  const {
    isOpen,
    inputValue,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    getItemProps,
    highlightedIndex,
    reset,
  } = useCombobox({
    items,
    onInputValueChange(e) {
      filterUsers(e.inputValue);
    },
    onSelectedItemChange({ selectedItem }) {
      // if selected item.path is a relative path
      if (selectedItem?.path.startsWith('/')) {
        router.push(selectedItem?.path);
      }
      // if selected item.path is an absolute path
      if (selectedItem?.path.startsWith('http')) {
        window.open(selectedItem?.path);
      }
      // reset input value
      filterUsers('');
      reset();
    },
    itemToString: (item) => item?.name || '',
  });

  return (
    <div className="relative">
      <div {...getComboboxProps()}>
        <input
          {...getInputProps({
            type: 'search',
            placeholder: 'Search for anything...',
            id: 'search',
            tabIndex: 1,
            className: `w-full p-2 bg-[var(--backgroundColor)] text-[var(--textColor)] border-0 text-2xl focus:ring-2 focus:ring-yellow-300 rounded dark:bg-gray-900 dark:text-[var(--textColorDark)] ${isLoading ? 'animate-pulse ring-2 ring-yellow-300' : ''}`,
          })}
        />
      </div>
      <div
        {...getMenuProps()}
        className="absolute w-full z-30 border border-[var(--lightGrey)] bg-white rounded-b shadow-lg mt-1 dark:bg-gray-900 dark:border-gray-700"
      >
        {isOpen &&
          items.map((item, index) => {
            const highlighted = index === highlightedIndex;
            return (
              <div
                {...getItemProps({ item, index })}
                key={item.id}
                className={`flex items-center border-b border-[var(--lightGrey)] px-4 py-3 transition-all duration-200 cursor-pointer ${highlighted ? 'bg-gray-100 dark:bg-gray-800 dark:text-white pl-8 border-l-4 border-yellow-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {item.icon} {item.name}
              </div>
            );
          })}
        {isOpen && !items.length && !isLoading && (
          <div className="flex items-center border-b border-[var(--lightGrey)] px-4 py-3">
            Sorry, Not found for {inputValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
