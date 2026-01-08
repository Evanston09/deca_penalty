import { Outlet } from "react-router";
import Footer from "../components/Footer.tsx";

function Layout() {
  return (
    <>
      <div className="min-h-screen text-white bg-gray-950 flex flex-col">
        <main className="p-4 grow flex flex-col items-center justify-center">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default Layout;
