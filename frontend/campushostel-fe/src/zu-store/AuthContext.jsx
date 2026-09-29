import React, { useState } from "react";
import { AuthContext } from "./AuthContextInstance";

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