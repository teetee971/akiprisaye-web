
export const Card = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-lg shadow p-4 ${className || ''}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);
