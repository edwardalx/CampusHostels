import { useNavigate, Navigate} from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";


export  function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      toast("Please login before accessing this page");
    }
  }, [token]);

  if (!token) {
    return (
      <div>
        <div className="flex flex-col justify-center items-center p-10 gap-5 my-10 font-medium italic text-gray-700">
          <h1>To access this page, you have to login</h1>
          <p>Click the button below to login</p>
          <button
            className="bg-teal-400 border rounded-xl w-20 not-italic"
            onClick={() => navigate("/login")}
            type="button"
          >
            Login
          </button>
        </div>
      </div>
    );
  }
  return children;
}

export const ProtectedRegistrationRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};
