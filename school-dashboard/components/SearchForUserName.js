import { useLazyQuery } from "@apollo/client";
import { resetIdCounter, useCombobox } from "downshift";
import gql from "graphql-tag";
import debounce from "lodash.debounce";
import { useRouter } from "next/dist/client/router";
import { useState } from "react";
import { useGQLQuery } from "../lib/useGqlQuery";
import { useUser } from "./User";

export const SEARCH_ALL_USERS_QUERY = gql`
  query SEARCH_ALL_USERS_QUERY {
    users {
      id
      name
      isStaff
      isParent
      isStudent
    }
  }
`;

export default function SearchForUserName({
  name,
  value,
  updateUser,
  userType,
}) {
  const me = useUser();
  const [usersToDisplay, setUsersToDisplay] = useState([]);

  const { data: allUsers, isLoading } = useGQLQuery(
    "allUsers",
    SEARCH_ALL_USERS_QUERY,
    {},
    {
      enabled: !!me,
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  );
  const usersFilteredByType =
    allUsers?.users?.filter((item) =>
      userType ? item[userType] === true : true
    ) || [];

  const items = usersToDisplay;
  const filterUsers = (valueToFilter) => {
    if (valueToFilter === "") {
      setUsersToDisplay([]);

      return;
    }
    const itemsToShow = usersFilteredByType.filter((user) =>
      user.name.toLowerCase().includes(valueToFilter?.toLowerCase())
    );
    const eightItems = itemsToShow?.slice(0, 8);
    setUsersToDisplay(eightItems || []);
  };

  resetIdCounter();

  const {
    isOpen,
    inputValue,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox({
    items,
    onInputValueChange() {
      filterUsers(inputValue);
    },
    onSelectedItemChange({ selectedItem }) {
      updateUser({ userId: selectedItem.id, userName: selectedItem.name });
    },
    itemToString: (item) => item?.name || "",
  });

  return (
    <div className="relative">
      <div {...getComboboxProps()}>
        <input
          {...getInputProps({
            type: "search",
            placeholder: "Search for a User",
            id: name,
            name,
            className: `w-full p-2 bg-[var(--backgroundColor)] text-[var(--textColor)] border-0 text-2xl focus:ring-2 focus:ring-yellow-300 rounded dark:bg-[var(--backgroundColorDark)] dark:text-[var(--textColorDark)] ${isLoading ? 'animate-pulse ring-2 ring-yellow-300' : ''}`,
          })}
        />
      </div>
      <div {...getMenuProps()} className="absolute w-full z-20 border border-[var(--lightGrey)] bg-white rounded-b shadow-lg mt-1 dark:bg-gray-900 dark:border-gray-700">
        {isOpen &&
          items.map((item, index) => {
            const highlighted = index === highlightedIndex;
            return (
              <div
                {...getItemProps({ item, index })}
                key={item.id}
                className={`flex items-center border-b border-[var(--lightGrey)] px-4 py-3 transition-all duration-200 cursor-pointer ${highlighted ? 'bg-gray-100 dark:bg-gray-800 dark:text-white pl-8 border-l-4 border-yellow-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {item.name}
              </div>
            );
          })}
        {isOpen && !items.length && !isLoading && (
          <div className="flex items-center border-b border-[var(--lightGrey)] px-4 py-3">Sorry, No users found for {inputValue}</div>
        )}
      </div>
    </div>
  );
}
