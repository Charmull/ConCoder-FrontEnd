import React, { SetStateAction, Dispatch } from "react";

interface OptionPropType {
  name: string;
  value: number;
}

interface PropType {
  options: Array<OptionPropType>;
  setSelection: Dispatch<SetStateAction<string>>;
  placeholder: string;
  className: string;
  label: string;
}

const SelectBox = ({
  options,
  setSelection,
  placeholder = "Select an option",
  className = "select select-xs select-ghost w-full max-w-xs",
  label,
}: PropType) => {
  const onSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target);

    setSelection(e.target.value);
  };
  return (
    <div className="w-full py-[4px] pl-[12px]">
      <div className="w-full text-left text-xs font-bold">
        {label != undefined && `· ${label}`}
      </div>
      <select
        defaultValue={-1}
        className={className}
        onChange={onSelectionChange}
      >
        <option value={-1}>{placeholder}</option>
        {options.forEach((e) => (
          <option value={e.value}>{e.name}</option>
        ))}
      </select>
    </div>
  );
};

export default SelectBox;