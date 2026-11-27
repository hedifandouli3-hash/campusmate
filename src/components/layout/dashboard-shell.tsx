"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  DoorOpen,
  FileText,
  FolderKanban,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Map,
  Megaphone,
  Menu,
  MessageCircleWarning,
  MessageSquare,
  Moon,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Tag,
  Ticket,
  User,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Breadcrumbs } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { Locale, UserProfile, UserRole } from "@/types/domain";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

function getNavForRole(role: UserRole, t: ReturnType<typeof useApp>["t"]): NavGroup[] {
  if (role === "student") {
    return [
      {
        section: t.sidebar.main,
        items: [
          { label: t.sidebar.overview, href: "/student/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: t.sidebar.courses, href: "/student/courses", icon: <BookOpen className="w-4 h-4" /> },
          { label: t.sidebar.aiAssistant, href: "/student/ai-assistant", icon: <Bot className="w-4 h-4" /> },
          { label: t.sidebar.studyPlanner, href: "/student/study-planner", icon: <CalendarClock className="w-4 h-4" /> },
        ],
      },
      {
        section: t.sidebar.launchpad,
        items: [
          { label: t.sidebar.launchpadHub, href: "/student/launchpad", icon: <Rocket className="w-4 h-4" /> },
          { label: t.sidebar.launchpadSkills, href: "/student/launchpad/skills", icon: <Sparkles className="w-4 h-4" /> },
          { label: t.sidebar.launchpadFreelance, href: "/student/launchpad/freelance", icon: <Briefcase className="w-4 h-4" /> },
          { label: t.sidebar.launchpadStartups, href: "/student/launchpad/startups", icon: <Lightbulb className="w-4 h-4" /> },
          { label: t.sidebar.launchpadProjects, href: "/student/launchpad/projects", icon: <FolderKanban className="w-4 h-4" /> },
          { label: t.sidebar.launchpadCanvas, href: "/student/launchpad/business-canvas", icon: <LayoutGrid className="w-4 h-4" /> },
          { label: t.sidebar.launchpadTeams, href: "/student/launchpad/teams", icon: <Users className="w-4 h-4" /> },
          { label: t.sidebar.launchpadPortfolio, href: "/student/launchpad/portfolio", icon: <Award className="w-4 h-4" /> },
          { label: t.sidebar.launchpadMentorship, href: "/student/launchpad/mentorship", icon: <Handshake className="w-4 h-4" /> },
          { label: t.sidebar.launchpadRoadmaps, href: "/student/launchpad/roadmaps", icon: <Map className="w-4 h-4" /> },
        ],
      },
      {
        section: t.sidebar.services,
        items: [
          { label: t.sidebar.documents, href: "/student/documents", icon: <FileText className="w-4 h-4" /> },
          { label: t.sidebar.queue, href: "/student/queue", icon: <Ticket className="w-4 h-4" /> },
          { label: t.sidebar.studyRooms, href: "/student/study-rooms", icon: <DoorOpen className="w-4 h-4" /> },
          { label: t.sidebar.studentVoice, href: "/student/feedback", icon: <MessageCircleWarning className="w-4 h-4" /> },
        ],
      },
      {
        section: t.sidebar.community,
        items: [
          { label: t.sidebar.chats, href: "/student/chats", icon: <MessageSquare className="w-4 h-4" /> },
          { label: t.sidebar.events, href: "/student/events", icon: <Calendar className="w-4 h-4" /> },
          { label: t.sidebar.marketplace, href: "/student/marketplace", icon: <ShoppingBag className="w-4 h-4" /> },
          { label: t.sidebar.lostFound, href: "/student/lost-found", icon: <Search className="w-4 h-4" /> },
          { label: t.sidebar.promotions, href: "/student/promotions", icon: <Tag className="w-4 h-4" /> },
          { label: t.sidebar.transport, href: "/student/transport", icon: <Bus className="w-4 h-4" /> },
        ],
      },
      {
        section: t.sidebar.career,
        items: [
          { label: t.sidebar.internships, href: "/student/internships", icon: <Briefcase className="w-4 h-4" /> },
          { label: t.sidebar.applications, href: "/student/applications", icon: <ClipboardList className="w-4 h-4" /> },
          { label: t.sidebar.cvBuilder, href: "/student/cv-builder", icon: <Award className="w-4 h-4" /> },
        ],
      },
      {
        section: t.sidebar.account,
        items: [
          { label: t.sidebar.notifications, href: "/student/notifications", icon: <Bell className="w-4 h-4" /> },
          { label: t.sidebar.profile, href: "/student/profile", icon: <User className="w-4 h-4" /> },
          { label: t.sidebar.settings, href: "/student/settings", icon: <Settings className="w-4 h-4" /> },
        ],
      },
    ];
  }

  if (role === "teacher") {
    return [
      {
        section: "Espace Enseignant",
        items: [
          { label: "Tableau de bord", href: "/teacher/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Mes Cours & Matières", href: "/teacher/courses", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Documents & RAG", href: "/teacher/documents", icon: <FileText className="w-4 h-4" /> },
          { label: "Quiz IA", href: "/teacher/quizzes", icon: <Sparkles className="w-4 h-4" /> },
          { label: "Annonces", href: "/teacher/announcements", icon: <Megaphone className="w-4 h-4" /> },
          { label: "Groupes Académiques", href: "/teacher/chats", icon: <MessageSquare className="w-4 h-4" /> },
          { label: "Paramètres", href: "/teacher/settings", icon: <Settings className="w-4 h-4" /> },
        ],
      },
    ];
  }

  if (role === "university_admin") {
    return [
      {
        section: "Administration",
        items: [
          { label: "Vue d'ensemble", href: "/administration/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Demandes de Documents", href: "/administration/document-requests", icon: <FileText className="w-4 h-4" /> },
          { label: "Base de Connaissances IA", href: "/administration/knowledge-base", icon: <Bot className="w-4 h-4" /> },
          { label: "Files d'attente", href: "/administration/queues", icon: <Ticket className="w-4 h-4" /> },
          { label: "Emploi du temps", href: "/administration/timetable", icon: <Clock className="w-4 h-4" /> },
          { label: "Salles & Réservations", href: "/administration/rooms", icon: <DoorOpen className="w-4 h-4" /> },
          { label: "Événements", href: "/administration/events", icon: <Calendar className="w-4 h-4" /> },
          { label: "Voix Étudiante", href: "/administration/feedback", icon: <MessageCircleWarning className="w-4 h-4" /> },
          { label: "Annonces Officielles", href: "/administration/announcements", icon: <Megaphone className="w-4 h-4" /> },
        ],
      },
      {
        section: "Structure & Gouvernance",
        items: [
          { label: "Étudiants", href: "/administration/students", icon: <GraduationCap className="w-4 h-4" /> },
          { label: "Enseignants", href: "/administration/teachers", icon: <Users className="w-4 h-4" /> },
          { label: "Départements", href: "/administration/departments", icon: <Building2 className="w-4 h-4" /> },
          { label: "Sections", href: "/administration/sections", icon: <Compass className="w-4 h-4" /> },
          { label: "Matières", href: "/administration/subjects", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Modération", href: "/administration/moderation", icon: <ShieldCheck className="w-4 h-4" /> },
          { label: "Analytiques", href: "/administration/analytics", icon: <BarChart3 className="w-4 h-4" /> },
          { label: "Paramètres", href: "/administration/settings", icon: <Settings className="w-4 h-4" /> },
        ],
      },
    ];
  }

  if (role === "organization") {
    return [
      {
        section: "Espace Organisation",
        items: [
          { label: "Tableau de bord", href: "/organization/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Offres de Stage", href: "/organization/internships", icon: <Briefcase className="w-4 h-4" /> },
          { label: "Nouvelle Offre", href: "/organization/internships/new", icon: <Sparkles className="w-4 h-4" /> },
          { label: "Candidatures Reçues", href: "/organization/applications", icon: <ClipboardList className="w-4 h-4" /> },
          { label: "Profil Organisation", href: "/organization/profile", icon: <Building2 className="w-4 h-4" /> },
          { label: "Vérification", href: "/organization/verification", icon: <ShieldCheck className="w-4 h-4" /> },
          { label: "Paramètres", href: "/organization/settings", icon: <Settings className="w-4 h-4" /> },
        ],
      },
    ];
  }

  return [
    {
      section: "Super Administration",
      items: [
        { label: "Vue Plateforme", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "Universités (Tenants)", href: "/admin/institutions", icon: <Building2 className="w-4 h-4" /> },
        { label: "Comptes & Rôles", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
        { label: "Organisations", href: "/admin/organizations", icon: <Briefcase className="w-4 h-4" /> },
        { label: "Signalements", href: "/admin/reports", icon: <ShieldCheck className="w-4 h-4" /> },
        { label: "Journaux d'Audit", href: "/admin/audit-logs", icon: <ClipboardList className="w-4 h-4" /> },
        { label: "Configuration", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];
}

export function DashboardShell({
  user,
  demoMode,
  geminiLive,
  children,
}: {
  user: UserProfile;
  demoMode: boolean;
  geminiLive: boolean;
  children: React.ReactNode;
}) {
  const { locale, setLocale, t, dark, toggleTheme, isRtl } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [moduleQuery, setModuleQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<
    Array<{ id: string; category: string; title: string; subtitle: string; href: string }>
  >([]);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setModuleQuery("");
        setGlobalResults([]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const q = moduleQuery.trim();
    if (q.length < 2) {
      const clearId = setTimeout(() => setGlobalResults([]), 0);
      return () => clearTimeout(clearId);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((d) => setGlobalResults(d.results || []))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [moduleQuery]);

  const navGroups = useMemo(() => getNavForRole(user.role, t), [user.role, t]);
  const allItems = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);
  const quickMatches = useMemo(() => {
    const q = moduleQuery.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 5);
  }, [allItems, moduleQuery]);

  const breadcrumbs = useMemo(() => {
    const matched = allItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    const rootHref = allItems[0]?.href || "/";
    const list: Array<{ label: string; href?: string }> = [{ label: t.roles[user.role], href: rootHref }];
    if (matched && matched.href !== rootHref) {
      list.push({ label: matched.label, href: matched.href });
    }
    return list;
  }, [allItems, pathname, t.roles, user.role]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <span className="text-base tracking-tight block">CampusMate</span>
              <span className="text-[10px] font-medium text-slate-400">ISET Béja</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:inline-flex rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Basculer la barre latérale"
        >
          {collapsed ? (
            isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-md p-1.5 text-slate-500"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      )}
                    >
                      {item.icon}
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
        {!collapsed && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-2.5 border border-slate-200/70 dark:border-slate-800">
            <p className="text-xs font-semibold truncate">{user.fullName}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {t.roles[user.role]} {user.institutionName ? `• ${user.institutionName}` : ""}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>{t.nav.logout}</span>}
        </button>
      </div>
    </div>
  );

  const notificationsHref =
    user.role === "student"
      ? "/student/notifications"
      : user.role === "university_admin"
        ? "/administration/document-requests"
        : user.role === "teacher"
          ? "/teacher/announcements"
          : user.role === "organization"
            ? "/organization/applications"
            : "/admin/audit-logs";

  return (
    <div className="min-h-screen flex bg-[var(--bg-page)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Aller au contenu principal
      </a>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-e border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] transition-all shrink-0 sticky top-0 h-screen",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[var(--bg-surface)] h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)]/95 backdrop-blur px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-lg p-2 border border-slate-200 dark:border-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Unified Global Search (Modules + Authorized Content, Ctrl+K) */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="search"
                aria-label="Recherche globale CampusMate"
                value={moduleQuery}
                onChange={(e) => setModuleQuery(e.target.value)}
                placeholder="Rechercher cours, modules, offres... (Ctrl+K)"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 ps-8 pe-3 py-1.5 text-xs focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none"
              />
              {(quickMatches.length > 0 || globalResults.length > 0) && (
                <div className="absolute start-0 end-0 top-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--bg-surface)] shadow-xl p-1.5 z-50 space-y-0.5 max-h-80 overflow-y-auto">
                  {quickMatches.map((m) => (
                    <Link
                      key={`nav-${m.href}`}
                      href={m.href}
                      onClick={() => {
                        setModuleQuery("");
                        setGlobalResults([]);
                      }}
                      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {m.icon}
                        <span className="truncate">{m.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase shrink-0">Module</span>
                    </Link>
                  ))}
                  {globalResults.map((res) => (
                    <Link
                      key={res.id}
                      href={res.href}
                      onClick={() => {
                        setModuleQuery("");
                        setGlobalResults([]);
                      }}
                      className="block rounded-lg px-2.5 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate text-slate-900 dark:text-white">{res.title}</span>
                        <span className="text-[10px] uppercase text-blue-600 shrink-0">{res.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{res.subtitle}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {geminiLive && (
              <div className="hidden xl:flex items-center gap-1.5">
                <Badge variant="success">IA Gemini Active</Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {demoMode && <Badge variant="primary">Portail</Badge>}

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-[11px]">
              {(["fr", "en", "ar"] as Locale[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={cn(
                    "px-2 py-1 rounded-md font-medium uppercase cursor-pointer transition",
                    locale === loc
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label={t.nav.theme}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href={notificationsHref}
              className="relative rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
          <Breadcrumbs items={breadcrumbs} />
          {children}
        </main>
      </div>
    </div>
  );
}
