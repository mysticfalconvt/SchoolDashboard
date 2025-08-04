interface FormSelectProps {
  currentValue: string;
  setValue: (value: string) => void;
  name: string;
  listOfOptions: string[];
}

export default function FormSelect({
  currentValue,
  setValue,
  name,
  listOfOptions,
}: FormSelectProps) {
  //   console.log(listOfOptions);
  return (
    <div className="form-control w-full">
      <label className="label" htmlFor={name}>
        <span className="label-text text-base-content font-medium">{name}</span>
      </label>
      <select
        id={name}
        name={name}
        required
        value={currentValue}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        className="select select-bordered w-full bg-base-200 text-base-content border-2 border-base-300 focus:border-[#760D08] focus:ring-2 focus:ring-[rgba(118,13,8,0.3)] focus:ring-offset-2 focus:ring-offset-transparent"
      >
        <option value="">Select an option...</option>
        {listOfOptions.map((item) => (
          <option key={`item${item}`} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
