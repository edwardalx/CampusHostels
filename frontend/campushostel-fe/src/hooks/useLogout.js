import { useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LogoutApi } from "../services/AuthServices";
import { AuthContext } from "../zu-store/AuthContextInstance";
import { showSessionExpiredAlert } from "./useIdleTimeout";
import { AUTH_CHANGED_EVENT } from "./useAuthToken";

/** Logs the user out, tells the rest of the UI, and returns them to the home page. */
export default function useLogout() {
  const navigate = useNavigate();
  const { setStoreUser } = useContext(AuthContext);

  return useCallback(() => {
    LogoutApi();
    setStoreUser(null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    showSessionExpiredAlert(
      "You have logged out successfully, please log back in.",
      () => navigate("/"),
    );
  }, [navigate, setStoreUser]);
}
