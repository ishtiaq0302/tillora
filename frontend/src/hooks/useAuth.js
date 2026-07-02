import authService from "../services/authService";

export const useAuth = () => {
  const register = async (data) => {
    return await authService.signup(data);
  };

  const login = async (data) => {
    return await authService.login(data);
  };

  const logout = () => {
    authService.logout();
  };

  return {
    register,
    login,
    logout,
  };
};
