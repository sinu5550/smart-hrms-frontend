'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiClient, parseApiError } from "@/services/api";
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Input } from "@/components/ui/input";

export default function RegisterOrganizationPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      const result = await apiClient.post<{message:string}>("/organizations/register", { name, ownerEmail: email, ownerName, password });
      setMessage(result.data.message);
    } catch (cause) { setError(parseApiError(cause)); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-800"><div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-10 text-white md:flex md:flex-col md:justify-between"><div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Building2/></div><p className="mt-10 text-xs uppercase tracking-[.2em] text-emerald-200">Start your workspace</p><h1 className="mt-3 text-3xl font-semibold">One calm place for your people operations.</h1><p className="mt-4 text-sm leading-6 text-slate-200">Create your organization and set up your people operations workspace.</p></div><div className="flex items-center gap-2 text-xs text-emerald-100"><ShieldCheck className="h-4 w-4"/>An isolated tenant and employee ID prefix are generated for you.</div></section>
    <section className="p-6 sm:p-10"><Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4"/>Back to sign in</Link><h2 className="mt-7 text-2xl font-semibold">Create your organization</h2><p className="mt-2 text-sm text-slate-500">Use any email address, including Gmail, to create your workspace.</p>
      {message ? <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"><CheckCircle2 className="mb-3 h-6 w-6"/>{message}</div> : <form onSubmit={submit} className="mt-7 space-y-4">
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        <label className="block text-sm font-medium">Organization name<Input value={name} onChange={e=>setName(e.target.value)} required className="mt-2 h-11 rounded-xl" placeholder="Example Company"/></label>
        <label className="block text-sm font-medium">Your name<Input value={ownerName} onChange={e=>setOwnerName(e.target.value)} required className="mt-2 h-11 rounded-xl"/></label>
        <label className="block text-sm font-medium">Email address<Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-2 h-11 rounded-xl" placeholder="you@gmail.com"/><span className="mt-1.5 block text-xs font-normal text-slate-500">Personal email providers are accepted. Use an address not already registered.</span></label>
        <label className="block text-sm font-medium">Password<span className="mt-2 block"><PasswordInput value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete="new-password" className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-normal shadow-sm"/></span><span className="mt-1.5 block text-xs font-normal text-slate-500">At least 6 characters.</span></label>
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy?"Creating workspace...":"Create workspace"}</button>
      </form>}
    </section>
  </div></main>;
}
