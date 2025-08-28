import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

export default function CallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:8000/auth/me", {
          credentials: "include"
        });
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
          navigate("/dashboard");
        } else {
          navigate("/login?error=true");
        }
      } catch (err) {
        console.error(err);
        navigate("/login?error=true");
      }
    };

    fetchUser();
  }, [navigate, setUser]);

  return <p>Processing login...</p>;
}
