import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface EnvModeGuardProps {
  children: React.ReactNode;
}

const EnvModeGuard: React.FC<EnvModeGuardProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the environment mode from environment variables
  const envMode = import.meta.env.VITE_ENV_MODE || 'DEV';
  
  useEffect(() => {
    // If environment mode is PROD and we're not already on the coming soon page
    if (envMode === 'PROD' && location.pathname !== '/coming-soon') {
      navigate('/coming-soon', { replace: true });
    }
  }, [envMode, location.pathname, navigate]);

  // In production mode, only allow /coming-soon route to render normally
  // All other routes will be redirected via useEffect
  if (envMode === 'PROD' && location.pathname !== '/coming-soon') {
    // Return null while redirect is happening to avoid flash
    return null;
  }

  // In development mode or on /coming-soon route, show normal content
  return <>{children}</>;
};

export default EnvModeGuard;
