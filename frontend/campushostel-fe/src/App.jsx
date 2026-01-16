import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./components/MainLayout";
import HostelDetails from "./pages/HostelDetails";
import Payments from "./pages/Payments";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Pages WITH Header */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/payment-history"
            element={<p>Payment History (Coming Soon)</p>}
          />
          <Route
            path="/tenancy"
            element={<p>Tenancy Page (Coming Soon)</p>}
          />
             <Route
            path="/About"
            element={<p>About Page (Coming Soon)</p>}
          />
             <Route
            path="/Contact"
            element={<p>Contact Page (Coming Soon)</p>}
          />
          <Route path="/hostel/:id" element={<HostelDetails />}></Route>
          <Route  path="/payments/hostel/:hostelId/room/:roomId" element={<Payments />} />
        </Route>

        {/* Pages WITHOUT Header */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 404 */}
        <Route
          path="*"
          element={<p className="text-red-600">⚠️ Page not found</p>}
        />
      </Routes>
    </Router>
  );
}

export default App;
