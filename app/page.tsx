'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(localStorage.getItem("access_token") ? "/admin" : "/login");
  }, [router]);
  return <main className="min-h-screen grid place-items-center text-sm text-slate-500">Opening your workspace...</main>;
}
