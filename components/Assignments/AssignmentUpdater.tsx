import { useUser } from '@/components/User';
import { blockName, pairedBlockName } from '@/lib/blockNames';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { NUMBER_OF_BLOCKS } from '../../config';

interface AssignmentData {
  [key: string]: string | Date;
}

interface AssignmentUpdaterProps {
  assignments: AssignmentData;
  /** The blocks this card stands for — an A/B pair when they're identical. */
  blocks: number[];
  hide: (show: boolean) => void;
  refetch: () => Promise<void>;
}

interface FormInputs {
  classTitle: string;
  assignment: string;
}

const UPDATE_ASSIGNMENTS = gql`
  mutation UPDATE_ASSIGNMENTS(
    $id: ID!
    $block1Assignment: String
    $block1ClassName: String
    $block1AssignmentLastUpdated: DateTime
    $block2Assignment: String
    $block2ClassName: String
    $block2AssignmentLastUpdated: DateTime
    $block3Assignment: String
    $block3ClassName: String
    $block3AssignmentLastUpdated: DateTime
    $block4Assignment: String
    $block4ClassName: String
    $block4AssignmentLastUpdated: DateTime
    $block5Assignment: String
    $block5ClassName: String
    $block5AssignmentLastUpdated: DateTime
    $block6Assignment: String
    $block6ClassName: String
    $block6AssignmentLastUpdated: DateTime
    $block7Assignment: String
    $block7ClassName: String
    $block7AssignmentLastUpdated: DateTime
    $block8Assignment: String
    $block8ClassName: String
    $block8AssignmentLastUpdated: DateTime
    $block9Assignment: String
    $block9ClassName: String
    $block9AssignmentLastUpdated: DateTime
    $block10Assignment: String
    $block11Assignment: String
    $block12Assignment: String
    $block10ClassName: String
    $block11ClassName: String
    $block12ClassName: String
    $block10AssignmentLastUpdated: DateTime
    $block11AssignmentLastUpdated: DateTime
    $block12AssignmentLastUpdated: DateTime
  ) {
    updateUser(
      where: { id: $id }
      data: {
        block1Assignment: $block1Assignment
        block1ClassName: $block1ClassName
        block1AssignmentLastUpdated: $block1AssignmentLastUpdated
        block2Assignment: $block2Assignment
        block2ClassName: $block2ClassName
        block2AssignmentLastUpdated: $block2AssignmentLastUpdated
        block3Assignment: $block3Assignment
        block3ClassName: $block3ClassName
        block3AssignmentLastUpdated: $block3AssignmentLastUpdated
        block4Assignment: $block4Assignment
        block4ClassName: $block4ClassName
        block4AssignmentLastUpdated: $block4AssignmentLastUpdated
        block5Assignment: $block5Assignment
        block5ClassName: $block5ClassName
        block5AssignmentLastUpdated: $block5AssignmentLastUpdated
        block6Assignment: $block6Assignment
        block6ClassName: $block6ClassName
        block6AssignmentLastUpdated: $block6AssignmentLastUpdated
        block7Assignment: $block7Assignment
        block7ClassName: $block7ClassName
        block7AssignmentLastUpdated: $block7AssignmentLastUpdated
        block8Assignment: $block8Assignment
        block8ClassName: $block8ClassName
        block8AssignmentLastUpdated: $block8AssignmentLastUpdated
        block9Assignment: $block9Assignment
        block9ClassName: $block9ClassName
        block9AssignmentLastUpdated: $block9AssignmentLastUpdated
        block10Assignment: $block10Assignment
        block11Assignment: $block11Assignment
        block12Assignment: $block12Assignment
        block10ClassName: $block10ClassName
        block11ClassName: $block11ClassName
        block12ClassName: $block12ClassName
        block10AssignmentLastUpdated: $block10AssignmentLastUpdated
        block11AssignmentLastUpdated: $block11AssignmentLastUpdated
        block12AssignmentLastUpdated: $block12AssignmentLastUpdated
      }
    ) {
      id
    }
  }
`;

const AssignmentUpdater: React.FC<AssignmentUpdaterProps> = ({
  assignments,
  blocks,
  hide,
  refetch,
}) => {
  const me = useUser();
  const block = blocks[0];
  const isPair = blocks.length > 1;
  const label = isPair ? pairedBlockName(block) : blockName(block);
  // A merged card writes both rotations by default; a teacher whose two halves
  // have only looked identical so far can still split them back apart here.
  const [target, setTarget] = useState<string>('both');
  const targetBlocks = !isPair || target === 'both' ? blocks : [Number(target)];
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    classTitle: (assignments[`block${block}ClassName`] as string) || '',
    assignment: (assignments[`block${block}Assignment`] as string) || '',
  });
  const updateData: AssignmentData = {};
  const [updateAssignment, { loading, error, data }] =
    useGqlMutation(UPDATE_ASSIGNMENTS);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => hide(false)}
      />

      {/* Modal */}
      <div className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-4xl h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[var(--blue)]">
          <h4 className="text-white text-xl font-semibold">
            Update Class Assignment for {label}
          </h4>
          <button
            type="button"
            onClick={() => hide(false)}
            className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)]  rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
          >
            ×
          </button>
        </div>
        <form className="flex flex-col justify-center text-white">
          {isPair && (
            <label htmlFor="rotationTarget" className="p-2.5 text-left">
              Applies to:
              <select
                id="rotationTarget"
                name="rotationTarget"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mx-8 text-black"
              >
                <option value="both">{label} (both rotations)</option>
                {blocks.map((b) => (
                  <option key={b} value={String(b)}>
                    {blockName(b)} only
                  </option>
                ))}
              </select>
            </label>
          )}
          <label htmlFor="Class Name" className="p-2.5 text-left">
            Class Name:
            <input
              type="text"
              id="classTitle"
              name="classTitle"
              placeholder="student Message"
              value={inputs.classTitle}
              onChange={handleChange}
              className="mx-8 min-w-[90%] text-black"
            />
          </label>
          <label htmlFor="message" className="p-2.5 text-left">
            Current Assignment:
            <textarea
              id="assignment"
              name="assignment"
              placeholder="Current Assignment"
              value={inputs.assignment}
              onChange={handleChange}
              className="mx-8 min-w-[90%] text-black"
            />
          </label>
          <div className="flex flex-row justify-around items-center">
            <button
              type="button"
              onClick={async () => {
                const now = new Date();
                targetBlocks.forEach((b) => {
                  updateData[`block${b}AssignmentLastUpdated`] = now;
                  updateData[`block${b}Assignment`] = inputs.assignment;
                  updateData[`block${b}ClassName`] = inputs.classTitle;
                });
                updateData.id = me.id;
                await updateAssignment(updateData);
                toast.success(
                  `Updated Assignment for ${targetBlocks
                    .map((b) => blockName(b))
                    .join(' and ')}`,
                );
                await refetch();
                hide(false);
              }}
              className="text-white bg-[var(--blueTrans)] border-none rounded-full m-0.5 mb-4 px-8 text-center"
            >
              Update
            </button>
            <button
              type="button"
              className="w-80 text-white bg-[var(--blueTrans)] border-none rounded-full m-0.5 mb-4 px-8 text-center"
              onClick={async () => {
                const todaysDate = new Date();
                for (let b = 1; b <= NUMBER_OF_BLOCKS; b++) {
                  updateData[`block${b}AssignmentLastUpdated`] = todaysDate;
                  updateData[`block${b}Assignment`] = inputs.assignment;
                }
                updateData.id = me.id;
                await updateAssignment(updateData);
                toast.success('Updated Assignment for every block');
                await refetch();
                hide(false);
              }}
            >
              Update All Blocks
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AssignmentUpdater;
