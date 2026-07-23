"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }

    router.replace("/events");
    router.refresh();
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      <div className="brand-gradient pointer-events-none absolute inset-0 opacity-90" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 0%, white 0, transparent 40%)",
        }}
      />

      <Card className="relative w-full max-w-sm border-0 shadow-2xl shadow-black/20">
        <CardContent className="flex flex-col items-center gap-6 pt-2 pb-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/5">
              <Image src="/logo.jpg" alt="Pascom" width={64} height={64} className="rounded-lg" priority />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold tracking-tight">
                Paróquia Santíssima Virgem
              </h1>
              <p className="text-sm font-medium text-primary">Pascom · Pastoral de Comunicação</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2 brand-gradient border-0 text-white hover:opacity-90">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
