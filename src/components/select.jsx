
export const Select = ({ onValueChange, defaultValue, children }) => (
  <select
    className="w-full p-2 border rounded border-gray-300"
    onChange={e => onValueChange(e.target.value)}
    defaultValue={defaultValue}
  >
    {children}
  </select>
);

export const SelectTrigger = ({ children }) => children;
export const SelectValue = ({ placeholder }) => <option disabled>{placeholder}</option>;
export const SelectContent = ({ children }) => children;
export const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;
