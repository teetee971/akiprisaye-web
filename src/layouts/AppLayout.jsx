import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AppLayout({children}){
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-app py-6">{children}</main>
      <Footer />
    </div>
  );
}
