import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setTokens } from "@/lib/token-manager";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

const GoogleOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const status = searchParams.get("status");

    if (status === "failure") {
      toast({
        title: "Authentication Failed",
        description: "Google authentication failed. Please try again.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (accessToken && refreshToken) {
      // Store JWT tokens
      setTokens(accessToken, refreshToken);
      
      toast({
        title: "Success",
        description: "Successfully signed in with Google!",
      });
      
      // Decode the JWT token to get the workspaceId
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const workspaceId = payload.workspaceId;
        
        if (workspaceId) {
          navigate(`/workspace/${workspaceId}`);
        } else {
          // Fallback: redirect to sign-in if no workspace found
          navigate("/");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        navigate("/");
      }
    } else {
      toast({
        title: "Authentication Error",
        description: "Missing authentication tokens. Please try again.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex flex-col items-center gap-4">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
