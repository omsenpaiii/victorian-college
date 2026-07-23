import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";

export const DEFAULT_LLN_COURSE_SLUG = "certificate-iv-business-bsb40120";
export const DEFAULT_LLN_TEST_KEY = "business-foundations";
export const DEFAULT_LLN_PASS_PERCENT = 70;

type LlnOption = {
  id: string;
  label: string;
};

export type LlnQuestion = {
  id: string;
  section: "Reading" | "Numeracy" | "Digital skills" | "Workplace readiness";
  prompt: string;
  options: LlnOption[];
  correctOptionId: string;
};

export type PublicLlnQuestion = Omit<LlnQuestion, "correctOptionId">;

export type LlnAttemptSummary = {
  id: string;
  score: number;
  total: number;
  score_percent: number;
  passed: boolean;
  created_at: string;
};

const questions: LlnQuestion[] = [
  {
    id: "reading-positive",
    section: "Reading",
    prompt: "In workplace instructions, what does the word positive usually mean?",
    options: [
      { id: "negative", label: "Negative or refusing" },
      { id: "possible", label: "Reasonably possible" },
      { id: "affirmation", label: "Showing certainty, acceptance, or affirmation" },
      { id: "unknown", label: "Something unknown" },
    ],
    correctOptionId: "affirmation",
  },
  {
    id: "reading-flammable",
    section: "Reading",
    prompt: "What does highly flammable mean?",
    options: [
      { id: "careful", label: "Walk with care" },
      { id: "poison", label: "Poisonous" },
      { id: "fire", label: "Able to catch fire quickly" },
      { id: "cold", label: "Must be kept cold" },
    ],
    correctOptionId: "fire",
  },
  {
    id: "sign-no-smoking",
    section: "Reading",
    prompt: "Which description best matches a No Smoking sign?",
    options: [
      { id: "parking", label: "The letter P inside a red circle with a slash" },
      { id: "smoking", label: "A cigarette inside a red circle with a slash" },
      { id: "restroom", label: "Male and female restroom symbols" },
      { id: "exit", label: "A running person and exit arrow" },
    ],
    correctOptionId: "smoking",
  },
  {
    id: "sign-no-parking",
    section: "Reading",
    prompt: "Which description best matches a No Parking sign?",
    options: [
      { id: "parking", label: "The letter P inside a red circle with a slash" },
      { id: "smoking", label: "A cigarette inside a red circle with a slash" },
      { id: "restroom", label: "Male and female restroom symbols" },
      { id: "first-aid", label: "A white cross on a green background" },
    ],
    correctOptionId: "parking",
  },
  {
    id: "sign-restroom",
    section: "Reading",
    prompt: "Which sign usually indicates male and female bathroom facilities?",
    options: [
      { id: "restroom", label: "Male and female symbols" },
      { id: "flammable", label: "A flame symbol" },
      { id: "wifi", label: "A wireless network symbol" },
      { id: "hazard", label: "A skull and crossbones" },
    ],
    correctOptionId: "restroom",
  },
  {
    id: "meeting-location",
    section: "Reading",
    prompt:
      "A notice says a meeting is at 9:30am on 31 August at the Ritz Hotel on Burke Street. Where is the meeting?",
    options: [
      { id: "ritz", label: "Ritz Hotel on Burke Street" },
      { id: "library", label: "City Library" },
      { id: "office", label: "Main office reception" },
      { id: "school", label: "Training school" },
    ],
    correctOptionId: "ritz",
  },
  {
    id: "meeting-topic",
    section: "Reading",
    prompt: "The meeting notice is titled How to speak in public. What is the meeting about?",
    options: [
      { id: "first-aid", label: "First aid procedures" },
      { id: "public-speaking", label: "How to speak in public" },
      { id: "payroll", label: "How to read a payslip" },
      { id: "parking", label: "Parking rules" },
    ],
    correctOptionId: "public-speaking",
  },
  {
    id: "meeting-date",
    section: "Reading",
    prompt: "The notice says the meeting is at 9:30am on 31 August. What is the date?",
    options: [
      { id: "august-13", label: "13 August" },
      { id: "august-31", label: "31 August" },
      { id: "september-1", label: "1 September" },
      { id: "july-31", label: "31 July" },
    ],
    correctOptionId: "august-31",
  },
  {
    id: "meeting-facilitator",
    section: "Reading",
    prompt: "The meeting notice says it is run by Liz Mitchel. Who is running the meeting?",
    options: [
      { id: "liz", label: "Liz Mitchel" },
      { id: "sarah", label: "Sarah Jones" },
      { id: "david", label: "David Brown" },
      { id: "unknown", label: "The notice does not say" },
    ],
    correctOptionId: "liz",
  },
  {
    id: "reading-attire",
    section: "Reading",
    prompt:
      "A passage says the author knew it was a business meeting by the way people were dressed. What helped the author decide?",
    options: [
      { id: "attire", label: "Their dress attire" },
      { id: "weather", label: "The weather" },
      { id: "food", label: "The food they ordered" },
      { id: "music", label: "The music playing nearby" },
    ],
    correctOptionId: "attire",
  },
  {
    id: "reading-strange",
    section: "Reading",
    prompt: "If the author described a street business meeting as unusual, which word is closest in meaning?",
    options: [
      { id: "ordinary", label: "Ordinary" },
      { id: "strange", label: "Strange" },
      { id: "late", label: "Late" },
      { id: "quiet", label: "Quiet" },
    ],
    correctOptionId: "strange",
  },
  {
    id: "graph-most",
    section: "Numeracy",
    prompt: "In the learner graph activity, which pet was bought the most?",
    options: [
      { id: "dogs", label: "Dogs" },
      { id: "birds", label: "Birds" },
      { id: "goldfish", label: "Goldfish" },
      { id: "cats", label: "Cats" },
    ],
    correctOptionId: "dogs",
  },
  {
    id: "graph-least",
    section: "Numeracy",
    prompt: "In the learner graph activity, which pet was bought the least?",
    options: [
      { id: "dogs", label: "Dogs" },
      { id: "birds", label: "Birds" },
      { id: "goldfish", label: "Goldfish" },
      { id: "cats", label: "Cats" },
    ],
    correctOptionId: "birds",
  },
  {
    id: "graph-middle",
    section: "Numeracy",
    prompt: "In the learner graph activity, which pet was in the middle?",
    options: [
      { id: "dogs", label: "Dogs" },
      { id: "birds", label: "Birds" },
      { id: "goldfish", label: "Goldfish" },
      { id: "horses", label: "Horses" },
    ],
    correctOptionId: "goldfish",
  },
  {
    id: "bottle-half",
    section: "Numeracy",
    prompt: "A bottle is filled halfway. What fraction is full?",
    options: [
      { id: "quarter", label: "One quarter" },
      { id: "half", label: "One half" },
      { id: "three-quarters", label: "Three quarters" },
      { id: "full", label: "Full" },
    ],
    correctOptionId: "half",
  },
  {
    id: "weight-greater",
    section: "Numeracy",
    prompt: "Which weight is greater?",
    options: [
      { id: "10kg", label: "10 kg" },
      { id: "50kg", label: "50 kg" },
      { id: "100kg", label: "100 kg" },
      { id: "5kg", label: "5 kg" },
    ],
    correctOptionId: "100kg",
  },
  {
    id: "weekend-hours",
    section: "Numeracy",
    prompt: "Sarah works Saturday 5pm to 10pm and Sunday 10am to 3pm. How many hours did she work?",
    options: [
      { id: "5", label: "5 hours" },
      { id: "8", label: "8 hours" },
      { id: "10", label: "10 hours" },
      { id: "12", label: "12 hours" },
    ],
    correctOptionId: "10",
  },
  {
    id: "change",
    section: "Numeracy",
    prompt: "If an item costs $42.50 and you pay with $50.00, how much change should you receive?",
    options: [
      { id: "5", label: "$5.00" },
      { id: "7-50", label: "$7.50" },
      { id: "8-50", label: "$8.50" },
      { id: "12-50", label: "$12.50" },
    ],
    correctOptionId: "7-50",
  },
  {
    id: "drink-value",
    section: "Numeracy",
    prompt: "Drink prices are 250ml $3.50, 500ml $6, 1L $9, and 2L $15. Which is best value?",
    options: [
      { id: "250ml", label: "250ml bottle" },
      { id: "500ml", label: "500ml bottle" },
      { id: "1l", label: "1 litre bottle" },
      { id: "2l", label: "2 litre bottle" },
    ],
    correctOptionId: "2l",
  },
  {
    id: "drink-value-reason",
    section: "Numeracy",
    prompt: "Why is the 2 litre bottle the best value in the drink price example?",
    options: [
      { id: "unit-price", label: "It has the lowest cost per litre" },
      { id: "smallest", label: "It is the smallest bottle" },
      { id: "colour", label: "It has the best label colour" },
      { id: "fastest", label: "It is fastest to drink" },
    ],
    correctOptionId: "unit-price",
  },
  {
    id: "power-button",
    section: "Digital skills",
    prompt: "Which symbol usually turns a computer or device on and off?",
    options: [
      { id: "power", label: "A circle with a vertical line at the top" },
      { id: "folder", label: "A folder icon" },
      { id: "trash", label: "A bin icon" },
      { id: "bold", label: "The letter B" },
    ],
    correctOptionId: "power",
  },
  {
    id: "not-computer-tool",
    section: "Digital skills",
    prompt: "Which item is not normally a computer program or digital tool?",
    options: [
      { id: "word", label: "Microsoft Word" },
      { id: "excel", label: "Microsoft Excel" },
      { id: "pen", label: "Pen" },
      { id: "browser", label: "Web browser" },
    ],
    correctOptionId: "pen",
  },
  {
    id: "search-engine",
    section: "Digital skills",
    prompt: "Which of these is a common internet search engine?",
    options: [
      { id: "google", label: "Google" },
      { id: "calculator", label: "Calculator" },
      { id: "paint", label: "Paint" },
      { id: "notepad", label: "Notepad" },
    ],
    correctOptionId: "google",
  },
  {
    id: "deleted-files",
    section: "Digital skills",
    prompt: "Where do deleted files commonly go before they are permanently removed?",
    options: [
      { id: "downloads", label: "Downloads folder" },
      { id: "recycle", label: "Recycle bin or trash" },
      { id: "desktop", label: "Desktop background" },
      { id: "keyboard", label: "Keyboard" },
    ],
    correctOptionId: "recycle",
  },
  {
    id: "word-use",
    section: "Digital skills",
    prompt: "What is Microsoft Word mainly used for?",
    options: [
      { id: "documents", label: "Writing and editing documents" },
      { id: "payments", label: "Taking card payments" },
      { id: "maps", label: "Finding road directions only" },
      { id: "photos", label: "Taking photos" },
    ],
    correctOptionId: "documents",
  },
  {
    id: "excel-use",
    section: "Digital skills",
    prompt: "What is Microsoft Excel mainly used for?",
    options: [
      { id: "spreadsheet", label: "Spreadsheets, tables, and calculations" },
      { id: "voice", label: "Voice calls only" },
      { id: "keyboard", label: "Typing on a keyboard" },
      { id: "printer", label: "Printing without a computer" },
    ],
    correctOptionId: "spreadsheet",
  },
  {
    id: "save-icon",
    section: "Digital skills",
    prompt: "In many programs, what does a floppy-disk style icon usually mean?",
    options: [
      { id: "open", label: "Open" },
      { id: "save", label: "Save" },
      { id: "delete", label: "Delete" },
      { id: "print", label: "Print" },
    ],
    correctOptionId: "save",
  },
  {
    id: "workplace-support",
    section: "Workplace readiness",
    prompt: "If you do not understand an assessment instruction, what is the best next step?",
    options: [
      { id: "guess", label: "Guess and submit without asking" },
      { id: "ignore", label: "Ignore the task" },
      { id: "ask", label: "Ask your trainer or VCK support for clarification" },
      { id: "delete", label: "Delete your work" },
    ],
    correctOptionId: "ask",
  },
];

export function getPublicCourseWorkflowLlnQuestions(): PublicLlnQuestion[] {
  return questions.map((question) => {
    const { correctOptionId, ...publicQuestion } = question;
    void correctOptionId;
    return publicQuestion;
  });
}

export function normalizeLlnReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return `/dashboard/course/${DEFAULT_LLN_COURSE_SLUG}?tab=activities`;
  }

  return value;
}

export type CourseWorkflowLlnMode = "buy" | "unlock" | "continue";

export function normalizeCourseWorkflowLlnMode(value: string | null | undefined): CourseWorkflowLlnMode {
  if (value === "buy" || value === "unlock") {
    return value;
  }

  return "continue";
}

export function buildCourseWorkflowLlnUrl(
  returnTo?: string | null,
  mode?: CourseWorkflowLlnMode,
  assignmentKey?: string | null,
  courseSlug = DEFAULT_LLN_COURSE_SLUG,
) {
  const normalizedReturnTo = normalizeLlnReturnTo(returnTo);
  const params = new URLSearchParams({ returnTo: normalizedReturnTo });

  if (mode && mode !== "continue") {
    params.set("mode", mode);
  }

  if (assignmentKey) {
    params.set("assignmentKey", assignmentKey);
  }

  return `/dashboard/lln/${courseSlug}?${params.toString()}`;
}

export function gradeCourseWorkflowLlnAnswers(answers: Record<string, string>, passPercent = DEFAULT_LLN_PASS_PERCENT) {
  const total = questions.length;
  const score = questions.reduce(
    (count, question) => count + (answers[question.id] === question.correctOptionId ? 1 : 0),
    0,
  );
  const scorePercent = Math.round((score / total) * 10000) / 100;
  const passed = scorePercent >= passPercent;

  return {
    score,
    total,
    scorePercent,
    passed,
  };
}

export async function getLatestCourseWorkflowLlnAttempt(userKey: string, courseSlug = DEFAULT_LLN_COURSE_SLUG, testKey = DEFAULT_LLN_TEST_KEY) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("lln_attempts")
    .select("id,score,total,score_percent,passed,created_at")
    .eq("user_key", userKey)
    .eq("course_slug", courseSlug)
    .eq("test_key", testKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as LlnAttemptSummary | null;
}

export async function hasPassedCourseWorkflowLln(userKey: string, courseSlug = DEFAULT_LLN_COURSE_SLUG, testKey = DEFAULT_LLN_TEST_KEY) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("lln_attempts")
    .select("id")
    .eq("user_key", userKey)
    .eq("course_slug", courseSlug)
    .eq("test_key", testKey)
    .eq("passed", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function recordCourseWorkflowLlnAttempt(input: {
  userKey: string;
  email: string;
  answers: Record<string, string>;
  courseSlug?: string;
  testKey?: string;
  passPercent?: number;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const result = gradeCourseWorkflowLlnAnswers(input.answers, input.passPercent);
  const { data, error } = await supabase
    .from("lln_attempts")
    .insert({
      user_key: input.userKey,
      email: input.email,
      course_slug: input.courseSlug ?? DEFAULT_LLN_COURSE_SLUG,
      test_key: input.testKey ?? DEFAULT_LLN_TEST_KEY,
      score: result.score,
      total: result.total,
      score_percent: result.scorePercent,
      passed: result.passed,
      answers: input.answers,
    })
    .select("id,score,total,score_percent,passed,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as LlnAttemptSummary;
}
