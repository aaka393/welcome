import { LogOut, LogIn } from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";

// 1. Define the props interface
interface UserMenuProps {
    onLoginClick?: () => void;
}

// 2. Add the props to the component's function signature
const UserMenu: React.FC<UserMenuProps> = ({ onLoginClick }) => {
    const { user, logout } = useAuthStore();
    console.log("user", user)
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleLogin = () => {
        // 3. Use the provided onLoginClick function if it exists,
        //    otherwise fall back to the default navigation.
        if (onLoginClick) {
            onLoginClick();
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="flex items-center space-x-4">
            {user ? (
                <>
                    <span className="font-semibold text-gray-700">
                        Hello, {user.name || "User"}!
                    </span>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </>
            ) : (
                <button
                    onClick={handleLogin} // Use the new handleLogin function
                    className="p-2 flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Login"
                >
                    <LogIn className="w-5 h-5" />
                    <span className="hidden sm:inline">Login</span>
                </button>
            )}
        </div>
    );
};

export default UserMenu;