import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Card } from "@/components/ui/primitives";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 space-y-6">
        <h1 className="text-3xl font-bold">Conditions d&apos;utilisation</h1>
        <Card className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            CampusMate met à disposition des étudiants, enseignants, services administratifs et partenaires professionnels un environnement unifié pour les cours, démarches et opportunités de stage.
          </p>
          <p>
            Les utilisateurs s&apos;engagent à utiliser le portail correspondant à leur statut et à respecter la confidentialité des données académiques et des documents mis à disposition.
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
