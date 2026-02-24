import { Routes, Route, useNavigate } from "react-router-dom";
import HomePage from "./pages/homepage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/MainLayout";
import HostelDetails from "./pages/HostelDetails";
import Payments from "./pages/Payments";
import PaymentReceipt from "./pages/PaymentReceipt";
import { LogoutApi } from "./services/AuthServices";
import {
  useIdleTimeout,
  setTokenExpiryTimeout,
  showSessionExpiredAlert,
} from "./hooks/useIdleTimeout";
import {
  PrivateRoute,
  ProtectedRegistrationRoute,
} from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const handleLogout = () => {
    console.log("Logging out");
    if(!localStorage.getItem("token")){
      console.log("No token found, skipping logout");
      return;
    }
    showSessionExpiredAlert(
      "Your session has expired. Please log in again.",
      () => {
        LogoutApi();
        navigate("/");
      },
    );
    // window.location.href = "/"; // Force reload to clear state
    // navigate("/");
  };
  useIdleTimeout(() => {
    handleLogout();
  });
  setTokenExpiryTimeout(() => {
    handleLogout();
  });
  // const token = localStorage.getItem("token");
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Pages WITH Header */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/payment-history"
            element={
              <PrivateRoute>
                <p>Payment History (Coming Soon)</p>{" "}
              </PrivateRoute>
            }
          />

          <Route path="/tenancy" element={<p>Tenancy Page (Coming Soon)</p>} />
          <Route path="/About" element={<p>About Page (Coming Soon)</p>} />
          <Route path="/Contact" element={<p>Contact Page (Coming Soon)</p>} />
          <Route path="/hostel/:id" element={<HostelDetails />}></Route>
          <Route
            path="/payments/hostel/:hostelId/room/:roomId"
            element={
              <PrivateRoute>
                <Payments />
              </PrivateRoute>
            }
          />
          <Route
            path="/payments/receipt/:reference"
            element={<PaymentReceipt />}
          />
        </Route>

        {/* Pages WITHOUT Header */}
        <Route path="/login" element={<LoginPage />} />
        {/* <Route
          path="/register"
          element={!token ? <RegisterPage /> : <Navigate to="/" replace />}
        /> */}
        <Route
          path="/register"
          element={
            <ProtectedRegistrationRoute>
              <RegisterPage />
            </ProtectedRegistrationRoute>
          }
        />
        {/* 404 */}
        <Route
          path="*"
          element={<p className="text-red-600">⚠️ Page not found</p>}
        />
      </Routes>
    </>
  );
}

export default App;
