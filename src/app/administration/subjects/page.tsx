"use client";

import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import type { Department, Subject } from "@/types/domain";

export default function AdminSubjectsPage() {
  const { notify } = useApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [semester, setSemester] = useState("1");

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setSubjects(d.subjects || []);
      setDepartments(d.departments || []);
      setDepartmentId((prev) => prev || d.departments?.[0]?.id || "");
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
      body: JSON.stringify({ action: "add_subject", code, name, departmentId, semester: Number(semester) }),
    });
    if (res.ok) {
      notify("Matière ajoutée !", "success");
      setCode("");
      setName("");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-600" /> Matières Enseignées
      </h1>
      <Card>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-3">
          <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (ex: TI-204)" />
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Intitulé de la matière" />
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="1">S1</option>
              <option value="2">S2</option>
            </Select>
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Card>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <Card key={s.id} className="space-y-1">
            <div className="flex justify-between">
              <Badge variant="primary">{s.code}</Badge>
              <Badge>S{s.semester}</Badge>
            </div>
            <h2 className="font-semibold">{s.name}</h2>
          </Card>
        ))}
      </div>
    </div>
  );
}
