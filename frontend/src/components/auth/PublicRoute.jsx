import React from "react";
import { useAuth } from "../../context/AuthContext";
import DemoBanner from "./DemoBanner";

const PublicRoute = ({ children, requireAuth = false }) => {
  const { user } = useAuth();

  if (requireAuth && !user) {
    return <DemoBanner />;
  }

  return (
    <>
      {!user && <DemoBanner />}
      {children}
    </>
  );
};

export default PublicRoute;