import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Card } from "@/components/ui/primitives";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 space-y-6">
        <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
        <Card className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            CampusMate applique la minimisation des données : les identifiants d&apos;inscription académique privés, les réclamations confidentielles et les documents personnels ne sont jamais exposés publiquement.
          </p>
          <p>
            Aucune reconnaissance faciale, biométrie ou géolocalisation continue n&apos;est collectée. Les documents envoyés au module IA sont isolés par institution et par droits d&apos;accès avant toute recherche sémantique.
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
