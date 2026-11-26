import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Card } from "@/components/ui/primitives";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="space-y-3">
          <Badge variant="primary">À propos de CampusMate</Badge>
          <h1 className="text-3xl font-bold">Un campus. Une plateforme. Des possibilités infinies.</h1>
          <p className="text-slate-600 dark:text-slate-300">
            CampusMate est un écosystème SaaS universitaire propulsé par l&apos;intelligence artificielle, conçu pour connecter étudiants, enseignants, administrations universitaires et entreprises partenaires.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Card className="space-y-2">
            <h2 className="font-semibold text-lg">Architecture Multi-Tenant</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Déployé pour l&apos;ISET Béja et conçu pour toutes les universités tunisiennes, CampusMate repose sur une hiérarchie complète : Université → Département → Filière → Année → Section → Matière.
            </p>
          </Card>
          <Card className="space-y-2">
            <h2 className="font-semibold text-lg">Sécurité & Contrôle d&apos;Accès</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Portails de connexion séparés par rôle, vérification côté serveur, isolation stricte par établissement et protection contre les injections dans les documents RAG.
            </p>
          </Card>
        </div>

        <Link href="/login" className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          Accéder aux portails de connexion
        </Link>
      </main>
      <PublicFooter />
    </div>
  );
}
