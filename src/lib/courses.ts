export type CourseLesson = {
  id: string;
  title: string;
  duration: string;
  isPreview: boolean;
  videoProvider: "youtube" | "google-drive";
  videoUrl: string;
};

export type UnitItem = {
  code: string;
  title: string;
  type: "Core" | "Elective" | "Skill set";
  prerequisite?: string;
};

export type CourseAvailability = "open" | "coming-soon" | "details-to-follow";
export type CourseDetailVariant = "standard" | "contact-first";

export type Course = {
  slug: string;
  code: string;
  title: string;
  category: string;
  label: string;
  priceAud: number;
  enrolmentFee?: number;
  duration: string;
  description: string;
  overview: string;
  image: string;
  externalVideoUrl: string;
  deliveryModes: string[];
  entryRequirements: string[];
  careerOutcomes: string[];
  unitSummary: string;
  units: UnitItem[];
  lessons: CourseLesson[];
  availability?: CourseAvailability;
  priceLabel?: string;
  statusNote?: string;
  detailVariant?: CourseDetailVariant;
  externalAccessUrl?: string;
  externalAccessLabel?: string;
  durationDetails?: string;
  feeDetails?: string;
  deliveryStrategy?: string;
  sourceArchiveUrl?: string;
  requiresLln?: boolean;
  llnTestKey?: string;
  llnPassPercent?: number;
  assessmentUnlockAmountCents?: number;
};

export type CourseCategory = {
  slug: string;
  title: string;
  filterCategory?: string;
  description: string;
  image: string;
};

const previewVideo = "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0";

function lessons(prefix: string, names: string[]): CourseLesson[] {
  return names.map((title, index) => ({
    id: `${prefix}-${index + 1}`,
    title,
    duration: index === 0 ? "04:00" : "12:00",
    isPreview: index === 0,
    videoProvider: "youtube",
    videoUrl: previewVideo,
  }));
}

export const courseCategories: CourseCategory[] = [
  {
    slug: "business",
    title: "Business",
    description: "Practical leadership, operations, communication and workplace capability.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=85",
  },
  {
    slug: "information-technology",
    title: "Information Technology",
    description: "Contemporary digital systems, support and technology project skills.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
  },
  {
    slug: "community-services",
    title: "Community Services",
    description: "Human-centred skills for individual support and community settings.",
    image: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=1200&q=85",
  },
];

export const courses: Course[] = [
  {
    slug: "certificate-iv-business-bsb40120",
    code: "BSB40120",
    title: "Certificate IV in Business",
    category: "Business",
    label: "Sample course",
    priceAud: 0,
    priceLabel: "Fees to be confirmed",
    duration: "Schedule to be confirmed",
    description: "Build practical capability across communication, operations and workplace projects.",
    overview: "A sample course pathway demonstrating how flexible, practical business learning can fit around work and life.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=85",
    externalVideoUrl: "",
    deliveryModes: ["Melbourne classroom", "Supported online learning"],
    entryRequirements: ["Course entry requirements will be confirmed before applications open."],
    careerOutcomes: ["Team leader", "Project support officer", "Business operations assistant"],
    unitSummary: "Sample learning units",
    units: [
      { code: "BSBXCM401", title: "Apply communication strategies in the workplace", type: "Core" },
      { code: "BSBCRT411", title: "Apply critical thinking to work practices", type: "Core" },
      { code: "BSBTEC404", title: "Use digital technologies to collaborate", type: "Elective" },
    ],
    lessons: lessons("business", ["Welcome to practical business learning", "Communication in action", "Planning a workplace project"]),
    availability: "details-to-follow",
    statusNote: "Sample course only. Availability, fees and delivery details are to be confirmed.",
    requiresLln: true,
    llnTestKey: "business-foundations",
    llnPassPercent: 70,
    assessmentUnlockAmountCents: 0,
  },
  {
    slug: "diploma-information-technology-ict50220",
    code: "ICT50220",
    title: "Diploma of Information Technology",
    category: "Information Technology",
    label: "Sample course",
    priceAud: 0,
    priceLabel: "Fees to be confirmed",
    duration: "Schedule to be confirmed",
    description: "Develop applied skills across digital systems, support and technology projects.",
    overview: "A sample technology pathway shaped around practical projects and collaborative problem solving.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85",
    externalVideoUrl: "",
    deliveryModes: ["Melbourne classroom", "Supported online learning"],
    entryRequirements: ["Course entry requirements will be confirmed before applications open."],
    careerOutcomes: ["ICT support officer", "Systems administrator", "Technology project coordinator"],
    unitSummary: "Sample learning units",
    units: [
      { code: "ICTICT517", title: "Match ICT needs with the strategic direction of the organisation", type: "Core" },
      { code: "ICTSAS527", title: "Manage client problems", type: "Core" },
    ],
    lessons: lessons("technology", ["Your technology learning pathway", "Solving client problems"]),
    availability: "details-to-follow",
    statusNote: "Sample course only. Availability, fees and delivery details are to be confirmed.",
    assessmentUnlockAmountCents: 0,
  },
  {
    slug: "certificate-iii-individual-support-chc33021",
    code: "CHC33021",
    title: "Certificate III in Individual Support",
    category: "Community Services",
    label: "Sample course",
    priceAud: 0,
    priceLabel: "Fees to be confirmed",
    duration: "Schedule to be confirmed",
    description: "Explore person-centred support skills for community and care environments.",
    overview: "A sample individual support pathway centred on dignity, communication and practical care skills.",
    image: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=1400&q=85",
    externalVideoUrl: "",
    deliveryModes: ["Melbourne classroom", "Practical placement details to be confirmed"],
    entryRequirements: ["Course entry requirements will be confirmed before applications open."],
    careerOutcomes: ["Individual support worker", "Community care worker", "Personal care assistant"],
    unitSummary: "Sample learning units",
    units: [
      { code: "CHCCCS031", title: "Provide individualised support", type: "Core" },
      { code: "CHCCOM005", title: "Communicate and work in health or community services", type: "Core" },
    ],
    lessons: lessons("support", ["Person-centred support", "Communication and dignity"]),
    availability: "details-to-follow",
    statusNote: "Sample course only. Availability, fees and delivery details are to be confirmed.",
    assessmentUnlockAmountCents: 0,
  },
];

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getCoursePriceDisplay(course: Course) {
  return course.priceLabel || (course.priceAud > 0 ? `$${course.priceAud.toLocaleString("en-AU")} AUD` : "Fees to be confirmed");
}

export function isCourseAvailableForEnrollment(course: Course) {
  return course.availability === "open";
}

export function isContactFirstCourse(course: Course) {
  return course.detailVariant === "contact-first";
}
