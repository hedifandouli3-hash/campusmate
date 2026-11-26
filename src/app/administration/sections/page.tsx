"use client";

import React, { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import type { AcademicSection } from "@/types/domain";

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<AcademicSection[]>([]);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => setSections(d.sections || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Compass className="w-6 h-6 text-indigo-600" /> Classes & Sections
      </h1>
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Card key={s.id} className="space-y-1">
            <Badge variant="indigo">{s.code}</Badge>
            <h2 className="font-semibold">{s.name}</h2>
          </Card>
        ))}
      </div>
    </div>
  );
}
