"use client";

import { useMutation } from "convex/react";
import { GigList } from "./_components/gig-list";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

interface DashboardProps {
  searchParams: {
    search?: string;
    favorites?: string;
    filter?: string;
  };
};

const Dashboard = ({ searchParams }: DashboardProps) => {
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    // No need to pass any arguments - the mutation will handle everything
    storeUser();
  }, [storeUser]);

  return (
    <GigList query={searchParams} />
  );
};

export default Dashboard;