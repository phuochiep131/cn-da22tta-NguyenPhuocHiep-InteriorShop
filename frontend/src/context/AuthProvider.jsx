import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (userData, token) => {
    Cookies.set("jwt", token, { expires: 1 / 24, sameSite: "Lax" });

    try {
      const res = await fetch("http://localhost:8080/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải thông tin người dùng");
      
      const data = await res.json();
      setUser(data);

      if (data.userId) {
        Cookies.set("user_id", data.userId, {
          expires: 1 / 24,
          sameSite: "Lax",
        });
      }
      if (data.email) {
        Cookies.set("user_email", data.email, {
          expires: 1 / 24,
          sameSite: "Lax",
        });
      }
      return data; 
    } catch (error) {
      console.error("❌ Lỗi khi tải profile:", error);
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove("jwt");
    Cookies.remove("user_id");
    setUser(null);
  };

  useEffect(() => {
    const token = Cookies.get("jwt");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:8080/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => {
        Cookies.remove("jwt");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;