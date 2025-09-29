import PrimaryButton from "./components/PrimaryButton";

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-primary underline mb-8">
        Hello Tailwind fonctionne 🚀
      </h1>
      <PrimaryButton onClick={() => alert("Bravo !")}>Bouton principal custom</PrimaryButton>
    </div>
  );
}