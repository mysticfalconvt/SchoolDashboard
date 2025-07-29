import React from 'react';
import { useQueryClient } from 'react-query';
import { useUser } from './User';

interface SortedHouseProps {
  house: string;
  updateHouse: (variables: { id: string; house: string }) => void;
  me: ReturnType<typeof useUser>;
}

const SortedHouse: React.FC<SortedHouseProps> = ({
  house,
  updateHouse,
  me,
}) => {
  const queryClient = useQueryClient();
  const houseCapitalized = house.charAt(0).toUpperCase() + house.slice(1);
  return (
    <>
      <link
        href="http://fonts.cdnfonts.com/css/harrypotter7"
        rel="stylesheet"
      />
      <div className="flex flex-col justify-center items-center max-w-[1000px] mx-auto text-2xl transition-all duration-300 font-harrypotter">
        <h1 className="w-full text-4xl">You are in</h1>
        <h2 className="text-3xl text-center">{house}</h2>
        <button
          type="button"
          onClick={async () => {
            await updateHouse({
              id: me.id,
              house: '',
            });
            queryClient.refetchQueries('me');
          }}
          className="mt-5 text-white bg-gradient-to-r from-[#0e1a40] via-[#2a623d] via-[#eeba30] via-[#740001] via-[#fff4b1] via-[#ffdb00] to-[#5d5d5d] border-none rounded px-4 py-2 text-3xl cursor-pointer font-harrypotter"
        >
          Reset your choice
        </button>
      </div>
    </>
  );
};

export default SortedHouse;
