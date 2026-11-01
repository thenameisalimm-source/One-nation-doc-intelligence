import { json, errorResponse, requireMethod, HttpError } from "./_lib/errors.js";
import { readJsonBody, cleanText, pickOption } from "./_lib/validate.js";
import { rateLimit } from "./_lib/rateLimit.js";
import { getProvider } from "./_lib/providers/index.js";
import {
  CATEGORIES,
  buildIdeas,
  buildTitles,
  buildMonetization,
  buildOutline,
  buildSection,
} from "./_lib/prompts.js";

const TASKS = ["ideas", "titles", "monetization", "script-outline", "script-section"];
const WINDOW_MS = 10 * 60 * 1000;

function clip(value, max) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function badFormat() {
  return new HttpError(
    502,
    "AI_BAD_FORMAT",
    "The AI returned the outline in an unreadable format. Please try again."
  );
}

// Turns the model's JSON text into a clean outline. Never fills in missing data.
function parseOutline(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw badFormat();

  let obj;
  try {
    obj = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw badFormat();
  }

  const raw = Array.isArray(obj.sections) ? obj.sections : [];
  const sections = raw
    .map((s) => ({ title: clip(s && s.title, 80), summary: clip(s && s.summary, 200) }))
    .filter((s) => s.title)
    .slice(0, 16);

  if (sections.length < 2) throw badFormat();
  return { title: clip(obj.title, 120), hook: clip(obj.hook, 300), sections };
}

function parseSections(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) {
    throw new HttpError(400, "BAD_INPUT", "The outline sections are missing or invalid.");
  }
  return value.map((s) => ({
    title: cleanText(s && s.title, { name: "Section title", required: true, max: 120 }),
    summary: cleanText(s && s.summary, { name: "Section summary", max: 300 }),
  }));
}

function buildRequest(task, body) {
  switch (task) {
    case "ideas":
      return buildIdeas({
        category: pickOption(body.category, CATEGORIES, "indian-history", "Category"),
        mode: pickOption(body.mode, ["india", "global"], "india", "Audience focus"),
        angle: cleanText(body.angle, { name: "Angle", max: 1500 }),
      });

    case "titles":
      return buildTitles({
        topic: cleanText(body.topic, { name: "Topic", required: true, max: 200 }),
        angle: cleanText(body.angle, { name: "Angle", max: 1500 }),
      });

    case "monetization":
      return buildMonetization({
        niche: cleanText(body.niche, { name: "Niche", required: true, max: 200 }),
        stage: pickOption(body.stage, ["new", "growing", "established"], "new", "Channel stage"),
        notes: cleanText(body.notes, { name: "Notes", max: 1500 }),
      });

    case "script-outline":
      return buildOutline({
        topic: cleanText(body.topic, { name: "Topic", required: true, max: 200 }),
        length: pickOption(body.length, ["5", "10", "20"], "10", "Target length"),
        notes: cleanText(body.notes, { name: "Notes", max: 1500 }),
      });

    case "script-section": {
      const sections = parseSections(body.sections);
      const index = body.index;
      if (!Number.isInteger(index) || index < 0 || index >= sections.length) {
        throw new HttpError(400, "BAD_INPUT", "The section number is not valid.");
      }
      return buildSection({
        topic: cleanText(body.topic, { name: "Topic", required: true, max: 200 }),
        notes: cleanText(body.notes, { name: "Notes", max: 1500 }),
        sections,
        index,
        previous: cleanText(body.previous, { name: "Previous text", max: 400 }),
      });
    }

    default:
      throw new HttpError(400, "BAD_INPUT", "Task is not supported.");
  }
}

export default async (req, context) => {
  try {
    requireMethod(req, "POST");
    const provider = getProvider();
    provider.assertReady();

    const body = await readJsonBody(req);
    const task = pickOption(body.task, TASKS, "", "Task");
    if (!task) throw new HttpError(400, "BAD_INPUT", "Task is required.");

    const isSection = task === "script-section";
    rateLimit(req, context, isSection ? "ai-section" : "ai", isSection ? 40 : 12, WINDOW_MS);

    const request = buildRequest(task, body);
    const out = await provider.generate(request);

    const meta = {
      provider: provider.id,
      model: out.model,
      task,
      generatedAt: new Date().toISOString(),
      truncated: out.truncated,
    };

    if (task === "script-outline") {
      return json({ outline: parseOutline(out.text), meta });
    }
    return json({ text: out.text, meta });
  } catch (err) {
    return errorResponse(err);
  }
};
