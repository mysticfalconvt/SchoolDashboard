import React, { useEffect } from "react";
import { useRouter } from "next/dist/client/router";
import GradientButton from "../styles/Button";
import Form, { FormContainerStyles } from "../styles/Form";
import useForm from "../../lib/useForm";
import useRevalidatePage from "../../lib/useRevalidatePage";
import useV3PbisCollection from "./useV3PbisCollection";

export default function NewWeeklyPbisCollection() {
  const sendRevalidationRequest = useRevalidatePage("/pbis");
  const [showForm, setShowForm] = React.useState(false);
  const { inputs, handleChange, clearForm, resetForm } = useForm();
  const [running, setRunning] = React.useState(false);
  const router = useRouter();
  const { runCardCollection, data, setGetData, getData, loading } =
    useV3PbisCollection();
  useEffect(() => {
    console.log("running", running);
    if (!running) {
      setShowForm(false);
    }
  }, [running]);
  // console.log(data);
  return (
    <div>
      <GradientButton
        style={{ marginTop: "10px" }}
        onClick={() => {
          setShowForm(!showForm);
          setGetData(!getData);
        }}
      >
        Run Weekly Pbis Collection
      </GradientButton>
      <div>
        <FormContainerStyles>
          <Form
            className={showForm ? "visible" : "hidden"}
            onSubmit={async (e) => {
              e.preventDefault();
              // Submit the inputfields to the backend:
              if (inputs.confirmation === "yes") {
                setRunning(true);
                const res = await runCardCollection();
                // setShowForm(false);
                resetForm();
                if (res) {
                  const revalidateRes = await sendRevalidationRequest();
                  // wait for the revalidation to finish for a couple seconds
                  await new Promise((resolve) => setTimeout(resolve, 2000));

                  setRunning(false);
                  router.push({
                    pathname: `/pbis`,
                  });
                }
              }
            }}
          >
            <h1>Run the weekly PBIS Card Collection</h1>

            <fieldset disabled={running || !data} aria-busy={running || !data}>
              <label htmlFor="confirmation">
                Do You Really Want To Do this?
                <input
                  required
                  type="text"
                  id="confirmation"
                  name="confirmation"
                  placeholder="Do you want to do this?"
                  value={inputs.data}
                  onChange={handleChange}
                />
              </label>

              <button type="submit">Run Card Collection</button>
            </fieldset>
          </Form>
        </FormContainerStyles>
      </div>
    </div>
  );
}
