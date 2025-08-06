import React from 'react';

interface FormCheckboxArrayProps {
  inputs: Record<string, boolean>;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  listOfCheckBoxes: string[];
}

export default function FormCheckboxArray({
  inputs,
  handleChange,
  name,
  listOfCheckBoxes,
}: FormCheckboxArrayProps) {
  return (
    <div className="form-control w-full">
      <div className="divider">
        <h3 className="text-base-content font-semibold text-lg">{name}</h3>
      </div>
      <div className="flex flex-wrap justify-around gap-3">
        {listOfCheckBoxes.map((singleCheckBox) => (
          <label
            key={`item#${singleCheckBox}`}
            htmlFor={singleCheckBox}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              id={singleCheckBox}
              name={singleCheckBox}
              checked={inputs[singleCheckBox] || false}
              onChange={handleChange}
              className="peer hidden"
            />
            <span 
              className="inline-block relative text-base px-4 py-2 rounded-lg cursor-pointer border-2 border-base-300 bg-base-200 text-base-content transition-all duration-200 hover:border-[#38B6FF] peer-checked:border-[#760D08] peer-checked:text-white shadow-sm hover:shadow-md"
              style={{
                background: inputs[singleCheckBox] 
                  ? 'linear-gradient(135deg, #760D08, #38B6FF)' 
                  : undefined
              }}
            >
              {singleCheckBox}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
