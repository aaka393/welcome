import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";

const Home = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate("/login");
    };

    return (
        <div>
            <div className="flex justify-between items-center p-4 bg-gray-100">
                <h1>Welcome</h1>
                {/* UserMenu component will handle login/logout logic */}
                <UserMenu onLoginClick={handleLogin} />
            </div>
            {/* Other home page content */}
        </div>
    );
};

export default Home;