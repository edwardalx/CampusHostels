import { Routes, Route, useNavigate } from "react-router-dom";
import HomePage from "./pages/homepage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/MainLayout";
import HostelDetails from "./pages/HostelDetails";
import Payments from "./pages/Payments";
import PaymentHistory from "./pages/PaymentHistory";
import PaymentReceipt from "./pages/PaymentReceipt";
import TenancyAgreement from "./pages/TenancyAgreement";
import ContactPage from "./pages/ContactPage";
import RequestPasswordResetPage from "./pages/RequestPasswordResetPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";
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
    if (!localStorage.getItem("token")) {
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
                <PaymentHistory />
              </PrivateRoute>
            }
          />

          <Route
            path="/tenancy"
            element={
              <PrivateRoute>
                <TenancyAgreement />
              </PrivateRoute>
            }
          />
          <Route path="/About" element={<AboutPage />} />
          <Route path="/Contact" element={<ContactPage />} />
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
            element={
              <PrivateRoute>
                <PaymentReceipt />
              </PrivateRoute>
            }
          />
          <Route
            path="/request/password-reset"
            element={<RequestPasswordResetPage />}
          />
          <Route path="/password-reset" element={<ResetPasswordPage />} />
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Pages WITHOUT Header */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={
            <ProtectedRegistrationRoute>
              <RegisterPage />
            </ProtectedRegistrationRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
