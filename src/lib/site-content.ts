import { courseCategories, courses } from "@/lib/courses";

export const siteInfo = {
  name: "Victorian College of Knowledge",
  shortName: "VCK",
  rto: "",
  email: "hello@victoriancollege.edu.au",
  phone: "+61 3 9000 0000",
  phoneHref: "tel:+61390000000",
  address: "Melbourne, Victoria - campus address to be confirmed",
  itSupport: {
    name: "Student support",
    phone: "+61 3 9000 0000",
    phoneHref: "tel:+61390000000",
    whatsappHref: "https://wa.me/61390000000",
  },
};

export const announcementBarMessage = "Practical learning. Personal support. Melbourne pathways.";

export const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/contact" },
];

export const courseMenu = courseCategories.map((category) => ({
  ...category,
  courses: courses.filter((course) => course.category === category.title),
}));

export const benefits = [
  { title: "Practical by design", text: "Learn through guided activities that connect ideas with real workplace situations." },
  { title: "Support that feels personal", text: "Clear touchpoints help every learner understand what comes next." },
  { title: "Flexible study rhythm", text: "A considered blend of classroom and supported online learning can fit around real life." },
];

export const faqs = [
  { question: "Are these courses currently open for enrolment?", answer: "The courses shown are sample pathways. Availability, fees, intake dates and final delivery details will be confirmed before applications open." },
  { question: "Where is the college located?", answer: "The college is based in Melbourne, Victoria. The final campus address will be published once confirmed." },
  { question: "Can I study online?", answer: "Supported online learning is planned for selected pathways. The exact delivery mix will be confirmed for each course." },
  { question: "How can I register my interest?", answer: "Use the contact or enrolment form and the college team will follow up when verified course information is available." },
];

export const testimonials = [
  { name: "Prospective learner", quote: "I want a course that feels practical, clear and connected to my next step." },
];

export const learnerStory = {
  name: "Maya",
  title: "Prospective Victorian learner",
  summary: "A representative learner story showing the kind of personal, practical support the college experience is designed to provide.",
  details: ["This story is illustrative and does not represent a currently enrolled student."],
};
