import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Authenticator, SelectField, TextField } from "@aws-amplify/ui-react";
import { fetchUserAttributes, signUp } from "aws-amplify/auth";
import { ToastContainer } from "react-toastify";

import "@aws-amplify/ui-react/styles.css";
import "react-toastify/dist/ReactToastify.css";

import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import OrderPage from "./pages/OrderPage";
import TrackPage from "./pages/TrackPage";
import AdminPage from "./pages/AdminPage";
import DeliveryPage from "./pages/DeliveryPage";
import LoginPage from "./pages/LoginPage";
import { useUserRole } from "./utils/useUserRole";

/* ================= NAVBAR ================= */
function Navigation({ user, signOut, role }) {
  const location = useLocation();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadAttributes() {
      try {
        const attrs = await fetchUserAttributes();
        if (isMounted) {
          const resolvedName = attrs?.['custom:fullName'] || attrs?.name || attrs?.fullname;
          if (resolvedName) {
            setUserName(resolvedName);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user attributes:", err);
      }
    }
    loadAttributes();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayName = userName || user?.signInDetails?.loginId || user?.username || "User";

  return (
    <nav className="navbar">
      <Link to={role === "DeliveryBoy" ? "/delivery" : "/dashboard"} className="navbar-brand">
        📦 OrderTracker
      </Link>

      <div className="nav-links">
        {role === "Customer" && (
          <Link
            to="/dashboard"
            className={`nav-link ${
              location.pathname === "/dashboard" || location.pathname === "/"
                ? "active"
                : ""
            }`}
          >
            Dashboard
          </Link>
        )}

        {(role === "Customer" || role === "Admin") && (
          <Link
            to="/order"
            className={`nav-link ${
              location.pathname === "/order" ? "active" : ""
            }`}
          >
            New Order
          </Link>
        )}

        {role === "Admin" && (
          <Link
            to="/admin"
            className={`nav-link ${
              location.pathname === "/admin" ? "active" : ""
            }`}
          >
            Admin Portal
          </Link>
        )}

        {role === "DeliveryBoy" && (
          <Link
            to="/delivery"
            className={`nav-link ${
              location.pathname === "/delivery" ? "active" : ""
            }`}
          >
            Delivery Portal
          </Link>
        )}

        <div className="user-section">
          <span className="user-name">
            {displayName} {role && <span className="user-role-badge">· {role}</span>}
          </span>

          <button className="signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ================= ROLE GATED ROUTE ================= */
function RoleGatedRoute({ allowedRoles, role, loadingRole, children }) {
  if (loadingRole) {
    return (
      <div className="card">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    if (role === "DeliveryBoy") {
      return <Navigate to="/delivery" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* ================= MAIN CONTENT WITH ROLE ROUTING ================= */
function AppContent({ user, signOut }) {
  const { role, loadingRole } = useUserRole();

  const getDefaultRedirect = () => {
    if (role === "DeliveryBoy") return "/delivery";
    if (role === "Admin") return "/admin";
    return "/dashboard";
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* NAVBAR */}
        <Navigation user={user} signOut={signOut} role={role} />

        {/* MAIN CONTENT */}
        <main>
          <Routes>
            {/* Default */}
            <Route
              path="/"
              element={
                loadingRole ? (
                  <div className="card">
                    <div className="spinner-container">
                      <div className="spinner"></div>
                    </div>
                  </div>
                ) : (
                  <Navigate to={getDefaultRedirect()} replace />
                )
              }
            />

            {/* Customer Dashboard (Customer, Admin) */}
            <Route
              path="/dashboard"
              element={
                <RoleGatedRoute
                  allowedRoles={["Customer", "Admin"]}
                  role={role}
                  loadingRole={loadingRole}
                >
                  <CustomerDashboardPage />
                </RoleGatedRoute>
              }
            />

            {/* Order Page (Customer, Admin) */}
            <Route
              path="/order"
              element={
                <RoleGatedRoute
                  allowedRoles={["Customer", "Admin"]}
                  role={role}
                  loadingRole={loadingRole}
                >
                  <OrderPage user={user} />
                </RoleGatedRoute>
              }
            />

            {/* Track Page (Customer, Admin) */}
            <Route
              path="/track/:orderId"
              element={
                <RoleGatedRoute
                  allowedRoles={["Customer", "Admin"]}
                  role={role}
                  loadingRole={loadingRole}
                >
                  <TrackPage />
                </RoleGatedRoute>
              }
            />

            {/* Admin Page (Admin only) */}
            <Route
              path="/admin"
              element={
                <RoleGatedRoute
                  allowedRoles={["Admin"]}
                  role={role}
                  loadingRole={loadingRole}
                >
                  <AdminPage />
                </RoleGatedRoute>
              }
            />

            {/* Delivery Page (DeliveryBoy only) */}
            <Route
              path="/delivery"
              element={
                <RoleGatedRoute
                  allowedRoles={["DeliveryBoy"]}
                  role={role}
                  loadingRole={loadingRole}
                >
                  <DeliveryPage />
                </RoleGatedRoute>
              }
            />

            {/* Optional login page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Fallback */}
            <Route
              path="*"
              element={
                loadingRole ? (
                  <div className="card">
                    <div className="spinner-container">
                      <div className="spinner"></div>
                    </div>
                  </div>
                ) : (
                  <Navigate to={getDefaultRedirect()} replace />
                )
              }
            />
          </Routes>
        </main>

        {/* TOASTS */}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          theme="colored"
        />
      </div>
    </BrowserRouter>
  );
}

/* ================= CUSTOM AUTHENTICATOR COMPONENTS ================= */
const authenticatorComponents = {
  SignUp: {
    FormFields() {
      return (
        <>
          <Authenticator.SignUp.FormFields />
          <TextField
            name="custom:fullName"
            label="Full Name"
            placeholder="Enter your full name"
            required
            margin="0 0 1rem 0"
          />
          <SelectField
            name="custom:role"
            label="Role"
            defaultValue="Customer"
            required
            margin="0 0 1rem 0"
          >
            <option value="Customer">Customer</option>
            <option value="DeliveryBoy">Delivery Boy</option>
          </SelectField>
        </>
      );
    },
  },
};

const authenticatorServices = {
  async handleSignUp(formData) {
    const username = formData?.username || "";
    const password = formData?.password || "";
    const userAttributes = formData?.options?.userAttributes || formData?.userAttributes || formData?.attributes || {};
    
    const selectedRole = userAttributes['custom:role'] || 'Customer';
    const selectedName = userAttributes['custom:fullName'] || '';

    return signUp({
      username,
      password,
      options: {
        ...formData?.options,
        userAttributes: {
          ...userAttributes,
          'custom:role': selectedRole,
          'custom:fullName': selectedName,
        },
      },
    });
  },
};

/* ================= APP ================= */
export default function App() {
  return (
    <Authenticator components={authenticatorComponents} services={authenticatorServices}>
      {({ signOut, user }) => <AppContent user={user} signOut={signOut} />}
    </Authenticator>
  );
}