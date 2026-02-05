import Header from '../components/Navbar/navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="min-h-screen">
            <Header />
            
            <div className="pt-[50px] px-[45px] flex-1">
                <Outlet />
            </div>
        </div>
    );
    };       

export default Layout;