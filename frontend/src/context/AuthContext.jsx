import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // =========================================
  // STATES
  // =========================================
  const [user, setUser] = useState(null);

  const [currentStore, setCurrentStore] = useState(null);

  const [loading, setLoading] = useState(true);

  // =========================================
  // LOAD USER + STORE
  // =========================================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedStore = localStorage.getItem("currentStore");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // =====================================
      // LOAD SAVED STORE
      // =====================================
      if (storedStore && parsedUser?.stores?.length > 0) {
        try {
          const parsedStore = JSON.parse(storedStore);
          const validStore = parsedUser.stores.find((s) => s.id === parsedStore?.id);
          if (validStore) {
            setCurrentStore(validStore);
          } else {
            const firstStore = parsedUser.stores[0];
            setCurrentStore(firstStore);
            localStorage.setItem("currentStore", JSON.stringify(firstStore));
          }
        } catch {
          const firstStore = parsedUser.stores[0];
          setCurrentStore(firstStore);
          localStorage.setItem("currentStore", JSON.stringify(firstStore));
        }
      }

      // =====================================
      // AUTO SELECT FIRST STORE
      // =====================================
      else if (!storedStore && parsedUser?.stores && parsedUser.stores.length > 0) {
        const firstStore = parsedUser.stores[0];
        setCurrentStore(firstStore);
        localStorage.setItem("currentStore", JSON.stringify(firstStore));
      }

      // Clear invalid currentStore when no valid stores exist
      else if (storedStore && (!parsedUser?.stores || parsedUser.stores.length === 0)) {
        localStorage.removeItem("currentStore");
        setCurrentStore(null);
      }
    }

    setLoading(false);
  }, []);

  // =========================================
  // LOGIN
  // =========================================
  const login = (data) => {
    localStorage.setItem("token", data.token);

    localStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user);

    // =====================================
    // SAVE CURRENT STORE - first store (backend returns in createdAt asc order)
    // =====================================
    const stores = data.user.stores || [];
    if (stores.length > 0) {
      const firstStore = stores[0];
      localStorage.setItem("currentStore", JSON.stringify(firstStore));
      setCurrentStore(firstStore);
    }
  };

  // =========================================
  // LOGOUT
  // =========================================
  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem("currentStore");

    setUser(null);

    setCurrentStore(null);

    window.location.href = "/login";
  };

  // =========================================
  // REFRESH USER (call /auth/me to get fresh tenant/subscription data)
  // =========================================
  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data) {
        const freshUser = res.data;
        localStorage.setItem("user", JSON.stringify(freshUser));
        setUser(freshUser);
      }
    } catch {
      // ignore silently — user stays as-is
    }
  };

  // =========================================
  // SWITCH STORE
  // =========================================
  const switchStore = (store) => {
    if (!store) return;

    localStorage.setItem("currentStore", JSON.stringify(store));
    setCurrentStore(store);

    window.dispatchEvent(new Event("store-changed"));
  };

  // =========================================
  // CHECK PERMISSION
  // =========================================
  const hasPermission = (permission) => {
    if (user?.isSuperAdmin) {
      return true;
    }

    return user?.permissions?.includes(permission);
  };

  // =========================================
  // CHECK ROLE
  // =========================================
  const hasRole = (role) => {
    return user?.roles?.includes(role);
  };

  // =========================================
  // TRIAL / SUBSCRIPTION STATUS
  // =========================================
  const trialEndsAt = user?.tenant?.trialEndsAt;
  const subscriptionEndsAt = user?.tenant?.subscriptionEndsAt;
  const subscriptionStatus = user?.tenant?.subscriptionStatus;

  const now = new Date();

  // Days remaining on trial (negative = expired)
  const trialDaysRemaining = trialEndsAt ? Math.ceil((new Date(trialEndsAt) - now) / (1000 * 60 * 60 * 24)) : null;

  // Days remaining on paid subscription (negative = expired)
  const subscriptionDaysRemaining = subscriptionEndsAt ? Math.ceil((new Date(subscriptionEndsAt) - now) / (1000 * 60 * 60 * 24)) : null;

  // Trial expired
  const isTrialExpired = subscriptionStatus === "trial" && trialEndsAt != null && new Date(trialEndsAt) < now;

  // Paid subscription expired (status is "active" but the subscription end date has passed)
  const isSubscriptionExpired = subscriptionStatus === "active" && subscriptionEndsAt != null && new Date(subscriptionEndsAt) < now;

  // Account is locked when either trial or paid subscription has expired
  const isAccountLocked = isTrialExpired || isSubscriptionExpired;

  // True when user can see an "All Stores" aggregate view
  const canViewAllStores = !!user?.isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,

        currentStore,
        setCurrentStore,

        stores: user?.stores || [],

        canViewAllStores,

        login,
        logout,
        refreshUser,

        switchStore,

        hasPermission,
        hasRole,

        token: localStorage.getItem("token"),

        isAuthenticated: !!user,

        loading,

        // Trial / subscription
        isTrialExpired,
        isSubscriptionExpired,
        isAccountLocked,
        trialDaysRemaining,
        subscriptionDaysRemaining,
        subscriptionEndsAt,
        subscriptionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================================
// CUSTOM HOOK
// =========================================
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
