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
            L&apos;environnement actuel est configuré pour le hackathon IA Student Discovery Camp avec un jeu de données fictif pour l&apos;ISET Béja.
          </p>
          <p>
            Les spécimens administratifs téléchargés en mode démonstration portent la mention « Spécimen Non Officiel » et ne remplacent aucun document officiel délivré par un établissement d&apos;enseignement supérieur.
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
