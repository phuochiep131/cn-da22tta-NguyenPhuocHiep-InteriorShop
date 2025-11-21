import { createContext, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = async (userId, token) => {
    if (!userId || !token) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/cart/count/user/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch cart count");

      const count = await res.json();      
      setCartCount(count);
    } catch (err) {
      console.error("CartContext error:", err);
    }
  };

  const resetCartCount = () => setCartCount(0);


  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCartCount, resetCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
