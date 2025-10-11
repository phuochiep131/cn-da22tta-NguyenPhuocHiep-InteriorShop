import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (userData, token) => {
    Cookies.set("jwt", token, { expires: 1 / 24, sameSite: "Lax" });

    try {
      const res = await fetch("http://localhost:8080/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải thông tin người dùng");
      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error("❌ Lỗi khi tải profile:", error);
    }
  };

  const logout = () => {
    Cookies.remove("jwt");
    setUser(null);
  };

  useEffect(() => {
    const token = Cookies.get("jwt");
    if (!token) return;
    fetch("http://localhost:8080/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => {
        Cookies.remove("jwt");
        setUser(null);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
