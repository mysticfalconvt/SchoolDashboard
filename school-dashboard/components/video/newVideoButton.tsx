import useRevalidatePage from '@/components/../lib/useRevalidatePage';
import DisplayError from '@/components/ErrorMessage';
import GradientButton from '@/components/styles/Button';
import { FormDialog } from '@/components/styles/Dialog';
import Form from '@/components/styles/Form';
import { useUser } from '@/components/User';
import useForm from '@/lib/useForm';
import { useGqlMutation } from '@/lib/useGqlMutation';
import gql from 'graphql-tag';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';

const CREATE_VIDEO_MUTATION = gql`
  mutation CREATE_VIDEO_MUTATION(
    $name: String!
    $description: String!
    $type: String!
    $onHomePage: Boolean!
    $link: String
  ) {
    createVideo(
      data: {
        name: $name
        description: $description
        onHomePage: $onHomePage
        link: $link
        type: $type
      }
    ) {
      id
    }
  }
`;

interface NewVideoProps {
  refetchLinks?: any;
  hidden?: boolean;
}

interface VideoInputs {
  name: string;
  link: string;
  description: string;
  onHomePage: boolean;
  type: string;
}

const NewVideo: React.FC<NewVideoProps> = ({ refetchLinks, hidden }) => {
  const revalidateIndexPage = useRevalidatePage('/');
  const revalidateLinkPage = useRevalidatePage('/movies');
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm({
    name: '',
    link: '',
    description: '',
    onHomePage: false,
    type: '',
  });
  const user = useUser();
  //   console.log(`user ${user.id}`);
  const [createLink, { loading, error, data }] = useGqlMutation(
    CREATE_VIDEO_MUTATION,
  );
  // console.log(inputs);
  if (hidden) return null;
  return (
    <div>
      <GradientButton
        onClick={() => setShowForm(!showForm)}
        style={{ marginLeft: '100px' }}
      >
        {showForm ? 'Close the form' : 'Add A New Video'}
      </GradientButton>
      <FormDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add a New Video"
        size="lg"
      >
        <Form
          className="w-full bg-transparent border-0 shadow-none p-0"
          onSubmit={async (e) => {
            e.preventDefault();
            // Submit the inputfields to the backend:
            await createLink(inputs);
            if (inputs.onHomePage) {
              revalidateIndexPage();
            }
            resetForm();

            await revalidateLinkPage();
            router.push('/movies');
            setShowForm(false);
          }}
        >
          <DisplayError error={error as any} />
          <fieldset disabled={loading} aria-busy={loading}>
            <label htmlFor="name">
              Link Title
              <input
                required
                type="text"
                id="name"
                name="name"
                placeholder="Video Title"
                value={inputs.name}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="description">
              Description
              <textarea
                id="description"
                name="description"
                placeholder="Description"
                required
                value={inputs.description}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="link">
              Link (YouTube or Google Drive) <br />
              For Google Drive this is the code to the file: eg:
              https://drive.google.com/file/d/1xz2y3w4e5r6t7u8i9o0p1q2r3e4r5e6/view
              This is the code between the /d/ and /view
              <br />
              For YouTube this is the code to the video: eg:
              https://www.youtube.com/watch?v=gxBkghlglTg This is the code after
              the /watch?v=
              <input
                type="text"
                id="link"
                name="link"
                required
                placeholder="Input Link Here"
                value={inputs.link}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="onHomePage">
              <span>Show on The HomePage </span>
              <Toggle
                id="onHomePage"
                name="onHomePage"
                checked={inputs.onHomePage}
                onChange={handleChange}
              />
            </label>
            <label htmlFor="type">
              <span>Type </span>
              <select
                id="type"
                name="type"
                value={inputs.type}
                onChange={handleChange}
                required
              >
                <option value="">Select a type</option>
                <option value="youtube">YouTube</option>
                <option value="google drive">Google Drive</option>
              </select>
            </label>

            <button type="submit">+ Add A New Video</button>
          </fieldset>
        </Form>
      </FormDialog>
    </div>
  );
};

export default NewVideo;
