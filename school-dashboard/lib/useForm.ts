import { useState } from 'react';

interface FormInputs {
  [key: string]: any;
}

export default function useForm(initial: FormInputs = {}) {
  // create a state object for our inputs
  const [inputs, setInputs] = useState<FormInputs>(initial);
  // const initialValues = Object.values(initial).join("");

  // useEffect(() => {
  //   // This function runs when the things we are watching change
  //   setInputs(initial);
  // }, [initial]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    // console.log(e.target);
    let { value, name, type } = e.target;
    let finalValue: any = value;

    if (type === 'number') {
      finalValue = parseInt(value);
    }
    if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      finalValue = files ? files[0] : null;
    }
    if (type === 'date') {
      // console.log(value);
      const theDate = new Date(value);
      theDate.setDate(theDate.getDate());
      finalValue = theDate.toISOString().split('T')[0];
      // value = new Date(value).toISOString();
      // console.log(`new ${value}`);
    }
    if (type === 'checkbox') {
      // console.log(`value: ${value}  checked: ${checked}`);
      const checked = (e.target as HTMLInputElement).checked;
      if (checked === true) {
        finalValue = true;
      }
      if (checked === false) {
        finalValue = false;
      }
    }
    // if (type === 'radio') {
    //   console.log(`value: ${value} name:${name}  checked: ${checked}`);
    //   // console.log(e);
    // }
    setInputs({
      // copy the existing state
      ...inputs,
      [name]: finalValue,
    });
  }

  function resetForm() {
    setInputs(initial);
  }

  function clearForm() {
    const blankState = Object.fromEntries(
      Object.entries(inputs).map(([key, value]) => [key, '']),
    );
    setInputs(blankState);
  }

  // return the things we want to surface from this custom hook
  return {
    inputs,
    handleChange,
    resetForm,
    clearForm,
  };
}
