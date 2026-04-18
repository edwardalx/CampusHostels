import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [storeUser, setStoreUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  return (
    <AuthContext.Provider value={{ storeUser, setStoreUser }}>
      {children}
    </AuthContext.Provider>
  );
};