import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const OAuthDebug = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("OAuth Debug - Current location:", location);
    console.log("OAuth Debug - Search params:", location.search);
    console.log("OAuth Debug - Pathname:", location.pathname);
  }, [location]);

  return (
    <div className="p-8">
      <h1>OAuth Debug Page</h1>
      <p>Current path: {location.pathname}</p>
      <p>Search params: {location.search}</p>
      <p>Full URL: {window.location.href}</p>
    </div>
  );
};

export default OAuthDebug;