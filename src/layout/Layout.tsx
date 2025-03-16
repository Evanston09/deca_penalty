import { Outlet } from "react-router";
import Footer from "../components/Footer.tsx";

function Layout() {
    return (
    <div className="h-screen text-white bg-gray-950 flex flex-col items-center">
        <main className='grow flex flex-col items-center justify-center'>
                <Outlet />
        </main>
        <Footer />
    </div>
    )
}

export default Layout
