import React from "react";
import { useAuth } from "../../context/AuthContext";
import DemoBanner from "./DemoBanner";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return (
    <>
      {!user && <DemoBanner />}
      {children}
    </>
  );
};

export default PublicRoute;