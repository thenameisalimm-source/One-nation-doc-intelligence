// Single source of truth for all 13 modules.
// `file` = filename in src/pages/ (without .jsx). Pages must default-export a component.

export const ROUTES = [
  { path: "/", file: "Overview", label: "Overview", short: "Home", icon: "home", group: "Intelligence", blurb: "Your research at a glance." },
  { path: "/trending", file: "TrendingRadar", label: "Trending Radar", short: "Trending", icon: "trend", group: "Intelligence", blurb: "Topics with rising opportunity scores." },
  { path: "/viral", file: "ViralDiscovery", label: "Viral Video Discovery", short: "Viral", icon: "flame", group: "Intelligence", blurb: "Find outperforming videos on any topic." },
  { path: "/competitors", file: "Competitors", label: "Competitor Intelligence", short: "Competitors", icon: "users", group: "Intelligence", blurb: "Analyse rival channels and their content." },
  { path: "/research", file: "TopicResearch", label: "Topic Research", short: "Research", icon: "search", group: "Intelligence", blurb: "Deep-dive into a single topic." },
  { path: "/channel", file: "ChannelAnalytics", label: "Channel Analytics", short: "Channel", icon: "chart", group: "Intelligence", blurb: "Public channel statistics only." },
  { path: "/ideas", file: "IdeaGenerator", label: "AI Idea Generator", short: "Ideas", icon: "sparkles", group: "Create", blurb: "Generate documentary ideas with AI." },
  { path: "/script", file: "ScriptGenerator", label: "Script Generator", short: "Script", icon: "film", group: "Create", blurb: "Outlines and Hinglish scripts." },
  { path: "/titles", file: "TitleThumbnail", label: "Title & Thumbnail", short: "Titles", icon: "type", group: "Create", blurb: "Better titles and thumbnail concepts." },
  { path: "/monetization", file: "Monetization", label: "Monetization", short: "Money", icon: "coin", group: "Create", blurb: "Revenue strategy for your channel." },
  { path: "/saved", file: "SavedIdeas", label: "Saved Ideas", short: "Saved", icon: "bookmark", group: "Library", blurb: "Ideas you have kept." },
  { path: "/history", file: "History", label: "Research History", short: "History", icon: "clock", group: "Library", blurb: "Everything you have researched." },
  { path: "/settings", file: "Settings", label: "Settings", short: "Settings", icon: "sliders", group: "System", blurb: "API status and preferences." },
];

// Shown directly in the Android bottom bar. Everything else lives under "More".
export const PRIMARY_PATHS = ["/", "/trending", "/ideas", "/viral"];

export const GROUP_ORDER = ["Intelligence", "Create", "Library", "System"];

export function findRoute(pathname) {
  return ROUTES.find((r) => r.path === pathname) || null;
}
