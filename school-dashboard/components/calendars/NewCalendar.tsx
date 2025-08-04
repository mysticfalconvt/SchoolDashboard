import useRevalidatePage from '@/components/../lib/useRevalidatePage';
import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import { FormDialog } from '@/components/styles/Dialog';
import Form from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { todaysDateForForm } from './formatTodayForForm';

const CREATE_CALENDAR_MUTATION = gql`
  mutation CREATE_CALENDAR_MUTATION(
    $name: String!
    $description: String!
    $status: String!
    $date: DateTime!
    $link: String
    $linkTitle: String
    $author: ID!
  ) {
    createCalendar(
      data: {
        name: $name
        description: $description
        status: $status
        date: $date
        link: $link
        linkTitle: $linkTitle
        author: { connect: { id: $author } }
      }
    ) {
      id
    }
  }
`;

interface CalendarInputs {
  name: string;
  description: string;
  status: string;
  date: string;
  link: string;
  linkTitle: string;
}

interface NewCalendarProps {
  refetchCalendars: () => void;
  hidden: boolean;
}

const NewCalendar: React.FC<NewCalendarProps> = ({
  refetchCalendars,
  hidden,
}) => {
  const revalidateIndexPage = useRevalidatePage('/');
  const revalidateCalendarPage = useRevalidatePage('/calendar');
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: '',
    description: '',
    status: 'Both',
    date: todaysDateForForm(),
    link: '',
    linkTitle: '',
  });
  const user = useUser();
  //   console.log(`user ${user.id}`);
  const [createCalendar, { data, loading, error }] = useGqlMutation(
    CREATE_CALENDAR_MUTATION,
  );
  if (hidden) return null;
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: '100px' }}
      >
        {showForm ? 'Close the form' : 'Add A New Event'}
      </GradientButton>
      <FormDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add a New Calendar Event"
        size="lg"
      >
        <Form
          className="w-full border-0 shadow-none p-0"
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the inputfields to the backend:
            await createCalendar({
              ...inputs,
              author: user?.id,
              date: new Date(inputs.date + 'T00:00:00'),
            });
            await revalidateIndexPage();
            await revalidateCalendarPage();
            resetForm();
            refetchCalendars();
            setShowForm(false);
          }}
        >
          <DisplayError error={error as any} />
          <fieldset disabled={loading} aria-busy={loading}>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="name">
                <span className="label-text text-white font-semibold">Event Title</span>
              </label>
              <input
                required
                type="text"
                id="name"
                name="name"
                placeholder="Event Title"
                value={inputs.name}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="date">
                <span className="label-text text-white font-semibold">Date of Event</span>
              </label>
              <div className="relative">
                <input
                  required
                  type="date"
                  id="date"
                  name="date"
                  value={inputs.date}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)] pr-10"
                  placeholder="Select date"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="description">
                <span className="label-text text-white font-semibold">Description</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Description"
                required
                value={inputs.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)] resize-none"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="status">
                <span className="label-text text-white font-semibold">Who can see this event?</span>
              </label>
              <select
                id="status"
                name="status"
                value={inputs.status}
                onChange={handleChange}
                className="select select-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              >
                <option value="Both">Students and Teachers</option>
                <option value="Students">Students Only</option>
                <option value="Teachers">Teachers Only</option>
              </select>
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="link">
                <span className="label-text text-white font-semibold">Link</span>
              </label>
              <input
                type="text"
                id="link"
                name="link"
                placeholder="Input Link Here"
                value={inputs.link}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <div className="form-control w-full mb-4">
              <label className="label" htmlFor="linkTitle">
                <span className="label-text text-white font-semibold">Link Title</span>
              </label>
              <input
                type="text"
                id="linkTitle"
                name="linkTitle"
                placeholder="Link Title"
                value={inputs.linkTitle}
                onChange={handleChange}
                className="input input-bordered w-full bg-base-100 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)]"
              />
            </div>
            <button 
              type="submit" 
              className="mt-6 w-full text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:brightness-110 transition-all duration-200 border-none"
              style={{ background: 'linear-gradient(135deg, #760D08, #38B6FF)' }}
            >
              + Add A New Event
            </button>
          </fieldset>
        </Form>
      </FormDialog>
    </div>
  );
};

export default NewCalendar;
