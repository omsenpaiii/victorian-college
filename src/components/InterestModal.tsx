"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { courses as defaultCourses, Course } from "@/lib/courses";
import { ReCaptchaField } from "@/components/ReCaptchaField";

export function InterestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCourses, setActiveCourses] = useState<Course[]>(defaultCourses);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  
  // Validation/submission states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load courses & trigger popup once per session after 60-second delay
  useEffect(() => {
    fetch("/api/courses")
      .then((response) => response.json())
      .then((data: { courses?: Course[] }) => {
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          setActiveCourses(data.courses);
        }
      })
      .catch(() => {
        setActiveCourses(defaultCourses);
      });

    if (typeof window !== "undefined") {
      // Trigger modal on 60-second delay if not shown in current session
      const shown = sessionStorage.getItem("vck_interest_popup_shown");
      if (!shown) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem("vck_interest_popup_shown", "true");
        }, 60000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!firstName.trim()) tempErrors.firstName = "First name is required";
    if (!lastName.trim()) tempErrors.lastName = "Last name is required";
    if (!email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Email address is invalid";
    }
    if (!phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (phone.trim().replace(/\s+/g, "").length < 10) {
      tempErrors.phone = "Must be a valid phone number (min 10 digits)";
    }
    if (!courseSlug) tempErrors.courseSlug = "Please select a course";
    if (!captchaToken.trim()) {
      tempErrors.captchaToken = "Please confirm you are not a robot";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          courseSlug,
          captchaToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setIsSuccess(true);
      // Auto close after 3 seconds on success
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
      setCaptchaToken("");
      setCaptchaResetKey((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal handler
  const handleClose = () => {
    setCaptchaToken("");
    setCaptchaResetKey((current) => current + 1);
    setIsOpen(false);
  };

  // Group activeCourses by category for structured optgroup dropdown
  const categoriesMap = activeCourses.reduce((acc, course) => {
    const cat = course.availability === "coming-soon" ? "Coming Soon" : (course.category || "Other");
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(course);
    return acc;
  }, {} as { [key: string]: Course[] });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Overlay (Click outside disabled to prevent data loss) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal Container (Scrollable and height-protected for mobile viewports) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg max-h-[calc(100vh-32px)] overflow-y-auto rounded-[2rem] border border-slate-100 bg-white shadow-2xl md:max-w-xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Top Branding Accent Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-[#0067b1] via-[#18aee5] to-[#f5b800]" />

            {/* Close Button (Optimized target for phones with z-index safety) */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 active:scale-95 z-50 cursor-pointer shadow-md"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Modal Body (Optimized padding for mobile layouts) */}
            <div className="p-6 sm:p-10">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.div
                    key="form-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Header */}
                    <div className="mb-6 pr-8">
                      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#0067b1]">
                        <ShieldCheck size={14} className="text-[#f5b800]" />
                        VCK Trial Access
                      </div>
                      <h2 className="text-2xl font-black leading-tight text-[#020d24] sm:text-3xl">
                        Experience VCK eLearning Before You Commit
                      </h2>
                      <p className="mt-2 text-sm font-bold text-slate-500 leading-relaxed">
                        Complete the form below and our training academy team will contact you for FREE trial access details shortly.
                      </p>
                    </div>

                    {submitError && (
                      <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-500">
                        {submitError}
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="first-name" className="text-xs font-black uppercase tracking-wider text-slate-700">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="first-name"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            className={`h-12 w-full rounded-xl border bg-slate-50 px-4 font-bold text-[#020d24] focus:outline-none focus:ring-2 focus:ring-[#18aee5]/40 text-base ${
                              errors.firstName ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#18aee5]"
                            }`}
                          />
                          {errors.firstName && (
                            <p className="text-xs font-bold text-red-500">{errors.firstName}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="last-name" className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="last-name"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className={`h-12 w-full rounded-xl border bg-slate-50 px-4 font-bold text-[#020d24] focus:outline-none focus:ring-2 focus:ring-[#18aee5]/40 text-base ${
                              errors.lastName ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#18aee5]"
                            }`}
                          />
                          {errors.lastName && (
                            <p className="text-xs font-bold text-red-500">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john.doe@example.com"
                          className={`h-12 w-full rounded-xl border bg-slate-50 px-4 font-bold text-[#020d24] focus:outline-none focus:ring-2 focus:ring-[#18aee5]/40 text-base ${
                            errors.email ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#18aee5]"
                          }`}
                        />
                        {errors.email && (
                          <p className="text-xs font-bold text-red-500">{errors.email}</p>
                        )}
                      </div>

                      {/* Phone Field */}
                      <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 0427 978 810"
                          className={`h-12 w-full rounded-xl border bg-slate-50 px-4 font-bold text-[#020d24] focus:outline-none focus:ring-2 focus:ring-[#18aee5]/40 text-base ${
                            errors.phone ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#18aee5]"
                          }`}
                        />
                        {errors.phone && (
                          <p className="text-xs font-bold text-red-500">{errors.phone}</p>
                        )}
                      </div>

                      {/* Course Selection list (visible selectable chips) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Course of Interest <span className="text-red-500">*</span>
                        </label>
                        <div 
                          className={`max-h-48 overflow-y-auto rounded-xl border bg-slate-50 p-4 space-y-4 ${
                            errors.courseSlug ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/20" : "border-slate-200 focus-within:ring-2 focus-within:ring-[#18aee5]/40"
                          }`}
                        >
                          {Object.entries(categoriesMap).map(([category, list]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0067b1]">
                                {category}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {list.map((c) => {
                                  const isSelected = courseSlug === c.slug;
                                  return (
                                    <button
                                      key={c.slug}
                                      type="button"
                                      onClick={() => {
                                        setCourseSlug(c.slug);
                                        setErrors((current) => {
                                          const nextErrors = { ...current };
                                          delete nextErrors.courseSlug;
                                          return nextErrors;
                                        });
                                      }}
                                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer border ${
                                        isSelected
                                          ? "bg-[#0067b1] border-[#f5b800] text-white shadow-md"
                                          : "bg-white border-slate-200 text-slate-600 hover:border-[#18aee5] hover:text-[#0067b1]"
                                      }`}
                                    >
                                      {c.title}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        {errors.courseSlug && (
                          <p className="text-xs font-bold text-red-500">{errors.courseSlug}</p>
                        )}
                      </div>

                      <ReCaptchaField
                        error={errors.captchaToken}
                        onChange={(token) => {
                          setCaptchaToken(token);

                          if (token) {
                            setErrors((current) => {
                              const nextErrors = { ...current };
                              delete nextErrors.captchaToken;
                              return nextErrors;
                            });
                          }
                        }}
                        resetKey={captchaResetKey}
                      />

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !captchaToken}
                        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0067b1] text-base font-black text-white shadow-[0_12px_30px_rgba(0,103,177,0.25)] transition hover:bg-[#123e95] active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Submitting...
                          </>
                        ) : (
                          "Submit Request for FREE Trial Access"
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-10"
                  >
                    <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                      <CheckCircle2 size={44} />
                    </div>
                    <h2 className="text-2xl font-black text-[#020d24]">Request Submitted!</h2>
                    <p className="mt-3 text-base font-bold text-slate-500 max-w-xs leading-relaxed">
                      Thank you! Our VCK team will be in touch shortly with your free trial access details.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
