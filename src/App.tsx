import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/UI/ScrollToTop";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-white text-black">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
