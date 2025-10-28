import { getCurrentUserQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { getAccessToken, isTokenValid } from "@/lib/token-manager";

const useAuth = () => {
  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: getCurrentUserQueryFn,
    staleTime: 0,
    retry: 2,
    enabled: isTokenValid(getAccessToken()), // Only run if we have a valid token
  });
  return query;
};

export default useAuth;
