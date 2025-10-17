import Header from "../components/Header";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-[64px] py-4 mt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
