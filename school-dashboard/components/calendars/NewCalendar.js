import { useState } from "react";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import GradientButton from "../styles/Button";
import Form, { FormContainer } from "../styles/Form";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import { useUser } from "../User";
import { todaysDateForForm } from "./formatTodayForForm";
import useRevalidatePage from "../../lib/useRevalidatePage";

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

export default function NewCalendar({ refetchCalendars, hidden }) {
  const revalidateIndexPage = useRevalidatePage("/");
  const revalidateCalendarPage = useRevalidatePage("/calendar");
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: "",
    description: "",
    status: "Both",
    date: todaysDateForForm(),
    link: "",
    linkTitle: "",
  });
  const user = useUser();
  //   console.log(`user ${user.id}`);
  const [createCalendar, { loading, error, data }] = useMutation(
    CREATE_CALENDAR_MUTATION,
    {
      variables: {
        ...inputs,
        author: user?.id,
        date: new Date(inputs.date + "T00:00:00"),
      },
    }
  );
  if (hidden) return null;
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: "100px" }}
      >
        {showForm ? "Close the form" : "Add A New Event"}
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
            onSubmit={async (e) => {
              e.preventDefault();
              // Submit the inputfields to the backend:
              const res = await createCalendar();
              if (res) {
                const indexRes = await revalidateIndexPage();
                const calendarRes = await revalidateCalendarPage();
                // console.log(indexRes);
                // console.log(calendarRes);
              }
              resetForm();
              refetchCalendars();
              setShowForm(false);
            }}
          >
            <h1 className="text-white font-bold text-xl mb-4">Add a New Calendar Event</h1>
            <DisplayError error={error} />
            <fieldset disabled={loading} aria-busy={loading}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-white font-semibold mb-1">
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
                <label htmlFor="date" className="block text-white font-semibold mb-1">
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
                <label htmlFor="description" className="block text-white font-semibold mb-1">
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
                <label htmlFor="status" className="block text-white font-semibold mb-1">
                  Who can see this event?
                </label>
                <select
                  type="select"
                  id="status"
                  name="status"
                  placeholder="Name"
                  value={inputs.status}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                >
                  <option value="Both">Students and Teachers</option>
                  <option value="Students">Students Only</option>
                  <option value="Teachers">Teachers Only</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="link" className="block text-white font-semibold mb-1">
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
                <label htmlFor="linkTitle" className="block text-white font-semibold mb-1">
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
              <button type="submit" className="mt-6">+ Add A New Event</button>
            </fieldset>
          </Form>
        </div>
      </FormContainer>
    </div>
  );
}
