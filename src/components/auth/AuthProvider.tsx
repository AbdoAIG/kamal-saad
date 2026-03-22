'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  return (
    <SessionProvider 
      refetchInterval={30} // Refetch every 30 seconds
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
