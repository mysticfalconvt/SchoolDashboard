import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import useForm from '../../lib/useForm';
import useRevalidatePage from '../../lib/useRevalidatePage';
import DisplayError from '../ErrorMessage';
import GradientButton from '../styles/Button';
import Form, { FormContainer } from '../styles/Form';
import { useUser } from '../User';

interface CalendarEvent {
  id: string;
  name: string;
  description?: string;
  link?: string;
  linkTitle?: string;
  date: string;
}

interface EditCalendarEventProps {
  calendar: CalendarEvent;
  refetch?: () => void;
}

interface FormInputs {
  name: string;
  description: string;
  link: string;
  linkTitle: string;
  date: string;
}

const UPDATE_CALENDAR_MUTATION = gql`
  mutation UPDATE_CALENDAR_MUTATION(
    $id: ID!
    $name: String!
    $date: DateTime!
    $description: String
    $link: String
    $linkTitle: String
  ) {
    updateCalendar(
      where: { id: $id }
      data: {
        name: $name
        date: $date
        description: $description
        link: $link
        linkTitle: $linkTitle
      }
    ) {
      id
    }
  }
`;

const DELETE_CALENDAR_MUTATION = gql`
  mutation DELETE_CALENDAR_MUTATION($id: ID!) {
    deleteCalendar(where: { id: $id }) {
      id
    }
  }
`;

const EditCalendarEvent: React.FC<EditCalendarEventProps> = ({
  calendar,
  refetch,
}) => {
  const initialDate = new Date(calendar.date);
  const revalidateIndex = useRevalidatePage('/');
  const revalidateCalendarPage = useRevalidatePage('/calendar');
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: calendar.name,
    description: calendar.description || '',
    link: calendar.link || '',
    linkTitle: calendar.linkTitle || '',
    date: initialDate.toISOString().split('T')[0],
  });
  const user = useUser();

  const [updateLink, { loading, error }] = useMutation(
    UPDATE_CALENDAR_MUTATION,
    {
      variables: {
        ...inputs,
        id: calendar.id,
        date: new Date(inputs.date + 'T00:00:00'),
      },
    },
  );

  const [deleteLink, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_CALENDAR_MUTATION, {
      variables: {
        id: calendar.id,
      },
    });

  const queryClient = useQueryClient();

  return (
    <div>
      <GradientButton onClick={() => setShowForm(!showForm)}>
        {showForm ? 'close' : 'Edit Event'}
      </GradientButton>
      <FormContainer visible={showForm}>
        <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-full max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-40 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
          <Form
            className="w-full bg-transparent border-0 shadow-none p-0"
            onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const res = await updateLink();
              revalidateIndex();
              revalidateCalendarPage();
              setShowForm(false);
              router.reload();
            }}
          >
            <h1 className="text-white font-bold text-xl mb-4">
              Edit Calendar Event
            </h1>
            <DisplayError error={error as any} />
            <fieldset disabled={loading} aria-busy={loading}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-white font-semibold mb-1"
                >
                  Event Title
                </label>
                <input
                  required
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Event Title"
                  value={inputs.name}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="date"
                  className="block text-white font-semibold mb-1"
                >
                  Date of Event
                </label>
                <input
                  required
                  type="date"
                  id="date"
                  name="date"
                  value={inputs.date}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-white font-semibold mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Description"
                  required
                  value={inputs.description}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="link"
                  className="block text-white font-semibold mb-1"
                >
                  Link
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  placeholder="Input Link Here"
                  value={inputs.link}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="linkTitle"
                  className="block text-white font-semibold mb-1"
                >
                  Link Title
                </label>
                <input
                  type="text"
                  id="linkTitle"
                  name="linkTitle"
                  placeholder="Input Link Here"
                  value={inputs.linkTitle}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                />
              </div>
              <button type="submit" className="mt-6">
                Publish
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await deleteLink();
                  revalidateIndex();
                  revalidateCalendarPage();
                  queryClient.refetchQueries('allCalendars');
                  router.push('/calendar');
                }}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </fieldset>
          </Form>
        </div>
      </FormContainer>
    </div>
  );
};

export default EditCalendarEvent;
