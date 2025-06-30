import React from 'react';

export default function FormCheckboxArray({
  inputs,
  handleChange,
  name,
  listOfCheckBoxes,
}) {
  return (
    <div className="w-full">
      <h3 className="text-center border-b border-gray-400 mb-2">{name}</h3>
      <div className="flex flex-wrap justify-around gap-2">
        {listOfCheckBoxes.map((singleCheckBox) => (
          <label key={`item#${singleCheckBox}`} htmlFor={singleCheckBox} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id={singleCheckBox}
              name={singleCheckBox}
              checked={inputs[singleCheckBox] || false}
              onChange={handleChange}
              className="peer hidden"
            />
            <span className="inline-block relative text-xl px-3 py-1 rounded-xl cursor-pointer border border-transparent transition peer-checked:border-blue-600 peer-checked:bg-[var(--red)]">
              {singleCheckBox}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
