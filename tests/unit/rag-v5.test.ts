import { describe, expect, it } from "vitest";
import { answerWithRag } from "@/lib/ai/service";
import { getAuthorizedChunksForUser, getStore } from "@/lib/data/store";
import { DEMO_IDS } from "@/lib/demo/seed";
import { buildValidatedCitations } from "@/lib/knowledge/citations";
import { hybridRetrieveAndRerank } from "@/lib/knowledge/retriever";
import { isAllowedUniversityUrl, validateExtractedSource } from "@/lib/knowledge/validator";

describe("CampusMate V5 Genuine RAG, Source Quality, Multilingual Retrieval & Security", () => {
  it("validates official isetb.rnu.tn URLs and blocks SSRF targets", () => {
    expect(isAllowedUniversityUrl("https://www.isetb.rnu.tn/licences/")).toBe(true);
    expect(isAllowedUniversityUrl("https://isetb.rnu.tn/contact-2/")).toBe(true);
    expect(isAllowedUniversityUrl("http://www.isetb.rnu.tn/")).toBe(false);
    expect(isAllowedUniversityUrl("https://localhost:3000/api/health")).toBe(false);
    expect(isAllowedUniversityUrl("https://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isAllowedUniversityUrl("https://evil.example.com/")).toBe(false);
  });

  it("rejects spam, empty pages, and unrelated institutional content (FSEGT) while labeling historical calendars", () => {
    const spamRes = validateExtractedSource({
      url: "https://www.isetb.rnu.tn/promo/",
      title: "Page promo",
      cleanText: "Welcome to 1xbet casino jackpot bonus slot machine online betting now with many characters here.",
    });
    expect(spamRes.status).toBe("rejected");

    const fsegtRes = validateExtractedSource({
      url: "https://www.isetb.rnu.tn/old-page/",
      title: "Examens",
      cleanText: "Calendrier des examens de la FSEGT Faculté des Sciences Économiques et de Gestion de Tunis pour la session.",
    });
    expect(fsegtRes.status).toBe("rejected");

    const histRes = validateExtractedSource({
      url: "https://www.isetb.rnu.tn/calendrier-2022/",
      title: "Calendrier 2022-2023",
      cleanText: "Calendrier officiel des examens ISET Béja pour l'année universitaire 2022-2023 semestre 1 et 2.",
    });
    expect(histRes.status).toBe("historical");
    expect(histRes.isHistorical).toBe(true);
    expect(histRes.detectedAcademicYear).toBe("2022-2023");
  });

  it("retrieves relevant French ISET Béja sources for French, Arabic, and English queries", () => {
    const store = getStore();
    const amira = store.users.find((u) => u.id === DEMO_IDS.studentAmira)!;
    const chunks = getAuthorizedChunksForUser({ user: amira, scope: "university_assistant" });

    // French query
    const fr = hybridRetrieveAndRerank({
      query: "Quelles sont les licences en technologies de l'informatique à l'ISET Béja ?",
      authorizedChunks: chunks,
      limit: 3,
    });
    expect(fr.length).toBeGreaterThan(0);

    // Arabic query matching French university docs via multilingual synonym bridge
    const ar = hybridRetrieveAndRerank({
      query: "ما هي الاختصاصات المتوفرة و شهادة التسجيل ؟",
      authorizedChunks: chunks,
      limit: 3,
    });
    expect(ar.length).toBeGreaterThan(0);

    // English query
    const en = hybridRetrieveAndRerank({
      query: "Where can I find information about internships and PFE?",
      authorizedChunks: chunks,
      limit: 3,
    });
    expect(en.length).toBeGreaterThan(0);
  });

  it("validates citations strictly against retrieved chunks and rejects invented IDs", () => {
    const store = getStore();
    const amira = store.users.find((u) => u.id === DEMO_IDS.studentAmira)!;
    const chunks = getAuthorizedChunksForUser({ user: amira, scope: "university_assistant" }).slice(0, 2);

    const validated = buildValidatedCitations(chunks, [chunks[0].documentId, "invented-fake-doc-id"]);
    expect(validated.length).toBe(1);
    expect(validated[0].documentId).toBe(chunks[0].documentId);
  });

  it("returns explicit uncertainty response when no official source supports a query", async () => {
    const store = getStore();
    const amira = store.users.find((u) => u.id === DEMO_IDS.studentAmira)!;
    const chunks = getAuthorizedChunksForUser({ user: amira, scope: "university_assistant" });

    const res = await answerWithRag({
      question: "Quel est le prix du billet de fusée spatiale depuis Béja ?",
      locale: "fr",
      scope: "university_assistant",
      authorizedChunks: chunks,
    });
    expect(res.foundInSources).toBe(false);
    expect(res.citations.length).toBe(0);
  });
});
