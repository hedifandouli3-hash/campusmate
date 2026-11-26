"use client";

import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { Department } from "@/types/domain";

export default function AdminDepartmentsPage() {
  const { notify } = useApp();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setDepartments(d.departments || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_department", code, name, description }),
    });
    if (res.ok) {
      notify("Département ajouté !", "success");
      setCode("");
      setName("");
      setDescription("");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Building2 className="w-6 h-6 text-blue-600" /> Départements Académiques
      </h1>
      <Card>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-3">
          <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (ex: GC)" />
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du département" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <Button type="submit">Ajouter</Button>
        </form>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {departments.map((d) => (
          <Card key={d.id} className="space-y-1">
            <Badge variant="primary">{d.code}</Badge>
            <h2 className="font-semibold">{d.name}</h2>
            <p className="text-xs text-slate-500">{d.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
