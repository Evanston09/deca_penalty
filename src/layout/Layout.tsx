import { Outlet, Link } from "react-router";
import Footer from "../components/Footer.tsx";
import logo from "../assets/DECA Logo.png";

function Layout() {
    return (
        <>
            <div className="min-h-screen text-white bg-gray-950 flex flex-col">
                <Link to="/">
                    <img src={logo} alt="Deca Logo" className="w-48 m-4" />
                </Link>
                <main className="p-4 grow flex flex-col items-center justify-center">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </>
    );
}

export default Layout;
