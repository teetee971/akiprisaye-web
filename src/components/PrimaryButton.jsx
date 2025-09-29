export default function PrimaryButton({ children, onClick }) {
  return (
    <button
      className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded transition-colors"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
