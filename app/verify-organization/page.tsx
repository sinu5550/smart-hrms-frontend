"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient, parseApiError } from "@/services/api";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";

type VerificationResult = { status: "success" | "error"; message: string };

export default function VerifyOrganizationPage() {
  return <Suspense fallback={<VerificationCard status="loading" message="Opening verification link…" />}><VerifyEmail /></Suspense>;
}

function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!token) return;
    apiClient.get<{ message: string }>("/organizations/verify", { params: { token } })
      .then(response => setResult({ status: "success", message: response.data.message }))
      .catch(error => setResult({ status: "error", message: parseApiError(error) }));
  }, [token]);

  if (!token) return <VerificationCard status="error" message="Verification link is missing its token." />;
  if (!result) return <VerificationCard status="loading" message="Verifying your email address…" />;
  return <VerificationCard status={result.status} message={result.message} />;
}

function VerificationCard({ status, message }: { status: "loading" | "success" | "error"; message: string }) {
  const Icon = status === "loading" ? LoaderCircle : status === "success" ? CheckCircle2 : CircleAlert;
  return <main className="grid min-h-screen place-items-center bg-[#f4f7fb] px-5"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-9 text-center shadow-xl"><div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${status === "success" ? "bg-emerald-50 text-emerald-700" : status === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}><Icon className={status === "loading" ? "animate-spin" : ""} /></div><h1 className="mt-5 text-2xl font-semibold">{status === "success" ? "Email verified" : status === "error" ? "Could not verify email" : "Checking your email"}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>{status !== "loading" && <Link href="/login" className="mt-7 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Continue to sign in</Link>}</section></main>;
}
