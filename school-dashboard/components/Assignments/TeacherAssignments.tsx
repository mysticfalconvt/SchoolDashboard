import gql from 'graphql-tag';
import React, { useState } from 'react';
import { NUMBER_OF_BLOCKS } from '../../config';
import { useGQLQuery } from '../../lib/useGqlQuery';
import Loading from '../Loading';
import { useUser } from '../User';
import MessageUpdater from './AssignmentUpdater';

interface AssignmentData {
  id: string;
  block1Assignment?: string;
  block1ClassName?: string;
  block1AssignmentLastUpdated?: string;
  block2Assignment?: string;
  block2ClassName?: string;
  block2AssignmentLastUpdated?: string;
  block3Assignment?: string;
  block3ClassName?: string;
  block3AssignmentLastUpdated?: string;
  block4Assignment?: string;
  block4ClassName?: string;
  block4AssignmentLastUpdated?: string;
  block5Assignment?: string;
  block5ClassName?: string;
  block5AssignmentLastUpdated?: string;
  block6Assignment?: string;
  block6ClassName?: string;
  block6AssignmentLastUpdated?: string;
  block7Assignment?: string;
  block7ClassName?: string;
  block7AssignmentLastUpdated?: string;
  block8Assignment?: string;
  block8ClassName?: string;
  block8AssignmentLastUpdated?: string;
  block9Assignment?: string;
  block9ClassName?: string;
  block9AssignmentLastUpdated?: string;
  block10Assignment?: string;
  block10ClassName?: string;
  block10AssignmentLastUpdated?: string;
  [key: string]: any;
}

const GET_MESSAGES = gql`
  query {
    authenticatedItem {
      ... on User {
        id
        block1Assignment
        block1ClassName
        block1AssignmentLastUpdated
        block2Assignment
        block2ClassName
        block2AssignmentLastUpdated
        block3Assignment
        block3ClassName
        block3AssignmentLastUpdated
        block4Assignment
        block4ClassName
        block4AssignmentLastUpdated
        block5Assignment
        block5ClassName
        block5AssignmentLastUpdated
        block6Assignment
        block6ClassName
        block6AssignmentLastUpdated
        block7Assignment
        block7ClassName
        block7AssignmentLastUpdated
        block8Assignment
        block8ClassName
        block8AssignmentLastUpdated
        block9Assignment
        block9ClassName
        block9AssignmentLastUpdated
        block10Assignment
        block10ClassName
        block10AssignmentLastUpdated
      }
    }
  }
`;

const TeacherAssignments: React.FC = () => {
  const me = useUser();
  const [showUpdater, setShowUpdater] = useState(false);
  const [block, setBlock] = useState<number>();

  // get messages data
  const { data, isLoading, error, refetch } = useGQLQuery(
    'myTeacherMessages',
    GET_MESSAGES,
  );

  if (!me) return <Loading />;
  if (isLoading) return <Loading />;

  const assignments: AssignmentData = data?.authenticatedItem || {};

  return (
    <>
      {showUpdater && block && (
        <MessageUpdater
          block={block}
          assignments={assignments}
          hide={setShowUpdater}
          refetch={async () => {
            await refetch();
          }}
        />
      )}
      <div className="flex flex-col text-center border-2 border-[var(--blue)] rounded-3xl m-2.5 justify-around w-full">
        <h3 className="m-2">Current Class Assignments</h3>

        <div className="grid grid-cols-1 md:grid-cols-10">
          {[...Array(NUMBER_OF_BLOCKS)].map((e, i) => {
            const num = i + 1;
            const today = new Date();
            const messageDate = new Date(
              assignments[`block${num}AssignmentLastUpdated`] || '',
            );
            const late = today.getTime() - messageDate.getTime() > 600000000;

            return (
              <div
                className={`flex flex-col m-2 p-2 rounded-3xl shadow-[2px_2px_var(--blue)] bg-gradient-to-tr from-[var(--blueTrans)] to-[var(--redTrans)] text-xl ${
                  late
                    ? 'needsUpdate bg-gradient-to-tr from-[var(--red)] to-[var(--redTrans)] bg-[length:400%_400%] shadow-[2px_2px_var(--red)]'
                    : ''
                }`}
                key={`key ${num}`}
                onClick={() => {
                  setBlock(num);
                  setShowUpdater(true);
                }}
              >
                <h4>Block {num}</h4>
                <p>{assignments[`block${num}ClassName`]}</p>
                <p>{assignments[`block${num}Assignment`]}</p>
                <p>
                  {
                    new Date(
                      assignments[`block${num}AssignmentLastUpdated`] || '',
                    )
                      .toLocaleString()
                      .split(',')[0]
                  }
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        @keyframes AnimationName {
          0% {
            background-position: 0% 57%;
          }
          50% {
            background-position: 100% 44%;
          }
          100% {
            background-position: 0% 57%;
          }
        }
        .needsUpdate {
          animation: AnimationName 3s ease infinite;
        }
      `}</style>
    </>
  );
};

export default TeacherAssignments;
