"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Bot,
  Calendar,
  EyeOff,
  Flag,
  Heart,
  MessageCircle,
  Pin,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import type { ClubProfile, ExamItem, SocialPostType } from "@/types/domain";

interface FeedItem {
  id: string;
  sourceKind: string;
  postType: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  href: string;
  sourceAttribution?: string;
  sourceUrl?: string;
  isPinned: boolean;
  likesCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  comments: Array<{ id: string; authorName: string; content: string; createdAt: string }>;
  createdAt: string;
}

const FILTERS = [
  { id: "all", labelFr: "Tout le campus", labelEn: "All", labelAr: "الكل" },
  { id: "official", labelFr: "Officiel", labelEn: "Official", labelAr: "رسمي" },
  { id: "courses", labelFr: "Mes cours", labelEn: "Courses", labelAr: "دروسي" },
  { id: "events", labelFr: "Événements", labelEn: "Events", labelAr: "الفعاليات" },
  { id: "discussions", labelFr: "Discussions", labelEn: "Discussions", labelAr: "نقاشات" },
  { id: "projects", labelFr: "Projets", labelEn: "Projects", labelAr: "المشاريع" },
  { id: "marketplace", labelFr: "Marketplace", labelEn: "Marketplace", labelAr: "السوق" },
  { id: "housing", labelFr: "Logement", labelEn: "Housing", labelAr: "السكن" },
  { id: "opportunities", labelFr: "Stages", labelEn: "Internships", labelAr: "الفرص" },
];

export default function StudentSocialHomePage() {
  const { locale, notify } = useApp();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [postType, setPostType] = useState<SocialPostType>("post");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [context, setContext] = useState<{
    upcomingExams: ExamItem[];
    pendingTasks: Array<{ id: string; title: string; dueDate: string }>;
    clubs: ClubProfile[];
  }>({ upcomingExams: [], pendingTasks: [], clubs: [] });

  const load = useCallback(async () => {
    const res = await fetch(`/api/social?filter=${encodeURIComponent(filter)}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
      if (data.context) setContext(data.context);
    }
  }, [filter, limit]);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim()) return;
    const res = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_post",
        postType,
        title: postTitle.trim() || undefined,
        content: postContent.trim(),
      }),
    });
    if (res.ok) {
      setPostTitle("");
      setPostContent("");
      notify("Publication ajoutée au fil du campus.", "success");
      await load();
    }
  }

  async function handleSocialAction(payload: Record<string, unknown>, toast?: string) {
    const res = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      if (toast) notify(toast, "info");
      await load();
    }
  }

  const ui =
    locale === "ar"
      ? {
          feedTitle: "ساحة الحرم الجامعي",
          placeholder: "ما الجديد في الحرم الجامعي؟",
          postTypePost: "منشور",
          postTypeQuestion: "سؤال أكاديمي",
          postTypeProject: "عرض مشروع",
          titleOpt: "العنوان (اختياري)",
          sellItem: "+ بيع غرض",
          lostItem: "+ مفقودات",
          publish: "نشر",
          open: "فتح ←",
          save: "حفظ",
          commentPh: "أضف تعليقاً...",
          send: "إرسال",
          assistantTitle: "المساعد والوكيل الذكي",
          assistantDesc: "اسأل عن المعهد أو أنشئ موقعاً أو عرضاً.",
          examsTitle: "الامتحانات والمهام",
          clubsTitle: "الأندية المعتمدة",
          seeAll: "عرض الكل",
        }
      : locale === "en"
        ? {
            feedTitle: "Campus Feed",
            placeholder: "What's happening on campus?",
            postTypePost: "Post",
            postTypeQuestion: "Academic Question",
            postTypeProject: "Project Showcase",
            titleOpt: "Title (optional)",
            sellItem: "+ Sell an item",
            lostItem: "+ Lost & Found",
            publish: "Publish",
            open: "Open →",
            save: "Save",
            commentPh: "Write a comment...",
            send: "Send",
            assistantTitle: "AI Assistant & Agent",
            assistantDesc: "Ask about ISET Béja or create websites, slides, and CVs.",
            examsTitle: "Exams & Tasks",
            clubsTitle: "Recognized Clubs",
            seeAll: "See all",
          }
        : {
            feedTitle: "Fil du Campus",
            placeholder: "Quoi de neuf sur le campus ?",
            postTypePost: "Publication",
            postTypeQuestion: "Question académique",
            postTypeProject: "Vitrine Projet / PFE",
            titleOpt: "Titre (optionnel)",
            sellItem: "+ Vendre un article",
            lostItem: "+ Objet perdu/trouvé",
            publish: "Publier",
            open: "Ouvrir →",
            save: "Enregistrer",
            commentPh: "Ajouter un commentaire...",
            send: "Envoyer",
            assistantTitle: "Assistant & Agent",
            assistantDesc: "Posez une question sur l'ISET Béja ou créez un livrable (site, CV, slides).",
            examsTitle: "Examens & Tâches",
            clubsTitle: "Clubs Reconnus",
            seeAll: "Tout voir",
          };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Feed Column */}
      <div className="xl:col-span-2 space-y-5">
        {/* Post Composer */}
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              {ui.feedTitle}
            </h1>
            <Link href="/student/agent">
              <Button size="sm" variant="secondary">
                <Sparkles className="w-3.5 h-3.5 me-1.5 text-blue-600" />
                CampusMate Agent
              </Button>
            </Link>
          </div>
          <form onSubmit={(e) => void handleCreatePost(e)} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select value={postType} onChange={(e) => setPostType(e.target.value as SocialPostType)}>
                <option value="post">{ui.postTypePost}</option>
                <option value="question">{ui.postTypeQuestion}</option>
                <option value="project_showcase">{ui.postTypeProject}</option>
              </Select>
              <Input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder={ui.titleOpt}
                className="sm:col-span-2"
              />
            </div>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={2}
              placeholder={ui.placeholder}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2 text-xs">
                <Link href="/student/marketplace" className="text-blue-600 hover:underline">
                  {ui.sellItem}
                </Link>
                <Link href="/student/lost-found" className="text-blue-600 hover:underline">
                  {ui.lostItem}
                </Link>
              </div>
              <Button type="submit" size="sm" disabled={!postContent.trim()}>
                <Send className="w-3.5 h-3.5 me-1.5" /> {ui.publish}
              </Button>
            </div>
          </form>
        </Card>

        {/* Feed Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                filter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {locale === "ar" ? f.labelAr : locale === "en" ? f.labelEn : f.labelFr}
            </button>
          ))}
        </div>

        {/* Feed Stream */}
        {items.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="Aucune publication dans ce filtre"
              description="Publiez une question ou changez de filtre pour voir toute l'actualité du campus."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {item.authorName}
                      </span>
                      <Badge>{item.postType}</Badge>
                      {item.isPinned && (
                        <Badge variant="primary">
                          <Pin className="w-3 h-3 me-1" /> Épinglé
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(item.createdAt)}
                      {item.sourceAttribution && ` • ${item.sourceAttribution}`}
                    </div>
                  </div>
                  {item.sourceKind === "social_post" && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handleSocialAction({ action: "hide_post", postId: item.id }, "Publication masquée.")}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        aria-label="Masquer"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSocialAction({ action: "report_post", postId: item.id }, "Signalement envoyé.")}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        aria-label="Signaler"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <Link href={item.href} className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    {item.sourceKind === "social_post" && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleSocialAction({ action: "toggle_like", postId: item.id })}
                          className={`inline-flex items-center gap-1 cursor-pointer ${
                            item.likedByMe ? "text-rose-600 font-semibold" : "text-slate-500"
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" /> {item.likesCount}
                        </button>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <MessageCircle className="w-3.5 h-3.5" /> {item.comments.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleSocialAction({ action: "toggle_bookmark", postId: item.id })}
                          className={`inline-flex items-center gap-1 cursor-pointer ${
                            item.bookmarkedByMe ? "text-blue-600 font-semibold" : "text-slate-500"
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" /> {ui.save}
                        </button>
                      </>
                    )}
                  </div>
                  <Link href={item.href} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    {ui.open}
                  </Link>
                </div>

                {/* Comments for social posts */}
                {item.sourceKind === "social_post" && (
                  <div className="space-y-2 pt-2">
                    {item.comments.map((c) => (
                      <div key={c.id} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs">
                        <span className="font-semibold">{c.authorName}: </span>
                        <span>{c.content}</span>
                      </div>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const text = (commentInputs[item.id] || "").trim();
                        if (!text) return;
                        setCommentInputs((p) => ({ ...p, [item.id]: "" }));
                        void handleSocialAction({ action: "add_comment", postId: item.id, content: text });
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={commentInputs[item.id] || ""}
                        onChange={(e) => setCommentInputs((p) => ({ ...p, [item.id]: e.target.value }))}
                        placeholder={ui.commentPh}
                        className="h-8 text-xs"
                      />
                      <Button type="submit" size="sm" variant="secondary">
                        {ui.send}
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            ))}
            {items.length < totalCount && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setLimit((l) => l + 15)}>
                  Charger plus ({totalCount - items.length} restants)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Contextual Sidebar */}
      <aside className="space-y-4">
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-600" /> {ui.assistantTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {ui.assistantDesc}
          </p>
          <div className="flex gap-2">
            <Link href="/student/ai-assistant" className="flex-1">
              <Button size="sm" variant="outline" className="w-full">RAG Officiel</Button>
            </Link>
            <Link href="/student/agent" className="flex-1">
              <Button size="sm" className="w-full">Agent IA</Button>
            </Link>
          </div>
        </Card>

        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" /> {ui.examsTitle}
            </h2>
            <Link href="/student/study-planner" className="text-xs text-blue-600 hover:underline">
              {ui.seeAll}
            </Link>
          </div>
          {context.upcomingExams.length === 0 && context.pendingTasks.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune échéance urgente.</p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {context.upcomingExams.map((ex) => (
                <div key={ex.id} className="rounded bg-slate-50 dark:bg-slate-800/60 p-2">
                  <div className="font-medium">{ex.title}</div>
                  <div className="text-[11px] text-slate-400">{ex.examDate} • {ex.roomName}</div>
                </div>
              ))}
              {context.pendingTasks.map((t) => (
                <div key={t.id} className="rounded border border-slate-100 dark:border-slate-800 p-2">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-[11px] text-slate-400">{t.dueDate}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> {ui.clubsTitle}
            </h2>
            <Link href="/student/clubs" className="text-xs text-blue-600 hover:underline">
              {ui.seeAll}
            </Link>
          </div>
          <div className="space-y-2">
            {context.clubs.map((c) => (
              <Link
                key={c.id}
                href="/student/clubs"
                className="block rounded-lg border border-slate-100 dark:border-slate-800 p-2.5 text-xs hover:border-blue-400 transition"
              >
                <div className="font-semibold">{c.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{c.upcomingActivity}</div>
              </Link>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
