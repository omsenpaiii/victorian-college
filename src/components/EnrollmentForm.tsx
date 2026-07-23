"use client";

import { useCallback, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCoursePriceDisplay,
  isCourseAvailableForEnrollment,
  type Course,
} from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { ReCaptchaField } from "@/components/ReCaptchaField";

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  dob: z.string().min(1, "Date of birth is required"),
  usi: z.string().min(10, "USI must be exactly 10 characters").max(10, "USI must be exactly 10 characters"),
  address: z.string().min(10, "Please provide your full address"),
  disabilityStatus: z.enum(["no", "yes", "prefer_not_to_say"]),
  disabilityDetails: z.string().max(1000, "Support details must be under 1000 characters").optional(),
  referredBy: z.string().max(120, "Reference must be under 120 characters").optional(),
  courseId: z.string().min(1, "Please select a course"),
  captchaToken: z.string().min(1, "Please confirm you are not a robot"),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: "personal", title: "Personal Info" },
  { id: "student", title: "Student Details" },
  { id: "course", title: "Course Select" },
  { id: "review", title: "Review" },
];

type EnrollmentFormProps = {
  initialCourseSlug?: string;
  courses: Course[];
  initialValues?: Partial<FormValues>;
};

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function EnrollmentForm({ initialCourseSlug = "", courses, initialValues = {} }: EnrollmentFormProps) {
  const enrollableCourses = courses.filter((course) => isCourseAvailableForEnrollment(course));
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const validInitialCourse = enrollableCourses.some(
    (course) => course.slug === initialCourseSlug,
  )
    ? initialCourseSlug
    : "";

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialValues.firstName ?? "",
      lastName: initialValues.lastName ?? "",
      email: initialValues.email ?? "",
      phone: initialValues.phone ?? "",
      dob: initialValues.dob ?? "",
      usi: initialValues.usi ?? "",
      address: initialValues.address ?? "",
      disabilityStatus: initialValues.disabilityStatus ?? "no",
      disabilityDetails: initialValues.disabilityDetails ?? "",
      referredBy: initialValues.referredBy ?? "",
      courseId: validInitialCourse,
      captchaToken: "",
    },
    mode: "onTouched",
  });

  const formValues = useWatch({ control });
  const selectedCourse = enrollableCourses.find((c) => c.slug === formValues.courseId);

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCaptchaChange = useCallback(
    (token: string) => {
      setValue("captchaToken", token, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      if (token) {
        clearErrors("captchaToken");
      }
    },
    [clearErrors, setValue],
  );

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const enrollmentResponse = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const enrollmentResult = await readJson<{
        enrollmentId?: string;
        courseSlug?: string;
        error?: string;
      }>(enrollmentResponse);

      if (!enrollmentResponse.ok || !enrollmentResult.enrollmentId) {
        throw new Error(
          enrollmentResult.error ?? "Unable to submit enrollment details.",
        );
      }

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: enrollmentResult.courseSlug ?? data.courseId,
          enrollmentId: enrollmentResult.enrollmentId,
        }),
      });

      const checkoutResult = await readJson<{
        url?: string;
        error?: string;
        signInUrl?: string;
        llnRequired?: boolean;
        llnUrl?: string;
      }>(checkoutResponse);

      if (!checkoutResponse.ok || !checkoutResult.url) {
        if (checkoutResponse.status === 401 && checkoutResult.signInUrl) {
          window.location.assign(checkoutResult.signInUrl);
          return;
        }

        if (checkoutResponse.status === 403 && checkoutResult.llnRequired && checkoutResult.llnUrl) {
          window.location.assign(checkoutResult.llnUrl);
          return;
        }

        throw new Error(checkoutResult.error ?? "Unable to start checkout.");
      }

      window.location.assign(checkoutResult.url);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit enrollment details.",
      );
      setCaptchaResetKey((current) => current + 1);
      setIsSubmitting(false);
    }
  };

  const getFieldsForStep = (stepIndex: number): (keyof FormValues)[] => {
    switch (stepIndex) {
      case 0: return ["firstName", "lastName", "email", "phone", "dob"];
      case 1: return ["usi", "address", "disabilityStatus", "disabilityDetails", "referredBy"];
      case 2: return ["courseId"];
      default: return [];
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2 relative">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center gap-2 relative z-10 ${
                index <= currentStep ? "text-[#0067b1]" : "text-slate-400"
              }`}
            >
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors duration-300 ${
                  index < currentStep
                    ? "bg-[#0067b1] border-[#0067b1] text-white"
                    : index === currentStep
                    ? "bg-white border-[#0067b1] text-[#0067b1]"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {index < currentStep ? <CheckCircle2 size={16} /> : index + 1}
              </div>
              <span className="text-xs font-bold hidden sm:block">{step.title}</span>
            </div>
          ))}
          {/* Connecting Line */}
          <div className="absolute left-0 top-4 -z-0 h-0.5 w-full bg-slate-200 sm:left-4 sm:w-[calc(100%-2rem)]">
            <motion.div
              className="h-full bg-[#0067b1]"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <Card className="shadow-[0_24px_70px_rgba(0,103,177,0.08)] border-[#18aee5]/15 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0067b1] via-[#18aee5] to-[#f5b800]" />
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="bg-slate-50/50 pb-8">
            <CardTitle className="text-2xl font-black text-[#020d24]">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-base font-semibold text-[#53647c]">
              {currentStep === 0 && "Let's start with your basic contact information."}
              {currentStep === 1 && "We use these details to prepare your enrolment and student record."}
              {currentStep === 2 && "Select the program you wish to enroll in."}
              {currentStep === 3 && "Review your details before proceeding to payment."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 relative min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {currentStep === 0 && (
                  <div className="grid gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="font-bold text-[#020d24]">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          {...register("firstName")}
                          className={`h-12 bg-slate-50 focus-visible:ring-[#18aee5] ${errors.firstName ? 'border-red-500' : 'border-slate-200'}`}
                        />
                        {errors.firstName && <p className="text-xs text-red-500 font-bold">{errors.firstName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="font-bold text-[#020d24]">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          {...register("lastName")}
                          className={`h-12 bg-slate-50 focus-visible:ring-[#18aee5] ${errors.lastName ? 'border-red-500' : 'border-slate-200'}`}
                        />
                        {errors.lastName && <p className="text-xs text-red-500 font-bold">{errors.lastName.message}</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-bold text-[#020d24]">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register("email")}
                        className={`h-12 bg-slate-50 focus-visible:ring-[#18aee5] ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-bold text-[#020d24]">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0400 000 000"
                          {...register("phone")}
                          className={`h-12 bg-slate-50 focus-visible:ring-[#18aee5] ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                        />
                        {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="font-bold text-[#020d24]">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          {...register("dob")}
                          className={`h-12 bg-slate-50 focus-visible:ring-[#18aee5] ${errors.dob ? 'border-red-500' : 'border-slate-200'}`}
                        />
                        {errors.dob && <p className="text-xs text-red-500 font-bold">{errors.dob.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="grid gap-5">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 items-start text-sm font-semibold text-blue-900">
                      <ShieldCheck className="shrink-0 text-[#0067b1]" size={20} />
                      <p>We may require these details to support enrolment processing, identity checks and student record setup.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usi" className="font-bold text-[#020d24]">Unique Student Identifier (USI)</Label>
                      <Input
                        id="usi"
                        placeholder="10 Character USI"
                        maxLength={10}
                        {...register("usi")}
                        className={`h-12 bg-slate-50 uppercase focus-visible:ring-[#18aee5] ${errors.usi ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.usi && <p className="text-xs text-red-500 font-bold">{errors.usi.message}</p>}
                      <a href="https://www.usi.gov.au/students/get-a-usi" target="_blank" rel="noreferrer" className="text-xs text-[#18aee5] hover:underline font-bold">
                        Don&apos;t have a USI? Get one here.
                      </a>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="font-bold text-[#020d24]">Residential Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Example St, Suburb, VIC 3000"
                        {...register("address")}
                        className={`h-12 bg-slate-50 focus-visible:ring-[#18aee5] ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.address && <p className="text-xs text-red-500 font-bold">{errors.address.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-[#020d24]">
                        Do you have a disability, medical condition, or learning support need that may affect your participation in training?
                      </Label>
                      <Controller
                        control={control}
                        name="disabilityStatus"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-12 bg-slate-50 focus:ring-[#18aee5] font-semibold border-slate-200">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no" className="font-semibold">No</SelectItem>
                              <SelectItem value="yes" className="font-semibold">Yes</SelectItem>
                              <SelectItem value="prefer_not_to_say" className="font-semibold">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.disabilityStatus ? (
                        <p className="text-xs text-red-500 font-bold">{errors.disabilityStatus.message}</p>
                      ) : null}
                    </div>

                    {formValues.disabilityStatus === "yes" ? (
                      <div className="space-y-2">
                        <Label htmlFor="disabilityDetails" className="font-bold text-[#020d24]">
                          Optional support details
                        </Label>
                        <textarea
                          id="disabilityDetails"
                          placeholder="Tell us what support may help you participate confidently."
                          {...register("disabilityDetails")}
                          className={`min-h-28 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#18aee5] ${errors.disabilityDetails ? "border-red-500" : "border-slate-200"}`}
                        />
                        {errors.disabilityDetails ? (
                          <p className="text-xs text-red-500 font-bold">{errors.disabilityDetails.message}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="referredBy" className="font-bold text-[#020d24]">
                        Lead reference (optional)
                      </Label>
                      <Input
                        id="referredBy"
                        placeholder="For example: Abu, Clint, VCK or another referrer"
                        {...register("referredBy")}
                        className={`h-12 bg-slate-50 focus-visible:ring-[#18aee5] ${errors.referredBy ? "border-red-500" : "border-slate-200"}`}
                      />
                      {errors.referredBy ? <p className="text-xs font-bold text-red-500">{errors.referredBy.message}</p> : null}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label className="font-bold text-[#020d24]">Available Programs</Label>
                      <Controller
                        control={control}
                        name="courseId"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={`h-14 bg-slate-50 focus:ring-[#18aee5] text-base font-semibold ${errors.courseId ? 'border-red-500' : 'border-slate-200'}`}>
                              <SelectValue placeholder="Select a course to enroll" />
                            </SelectTrigger>
                            <SelectContent>
                              {enrollableCourses.map((course) => (
                                <SelectItem key={course.slug} value={course.slug} className="font-semibold py-3 cursor-pointer">
                                  {course.title} - {getCoursePriceDisplay(course)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.courseId && <p className="text-xs text-red-500 font-bold">{errors.courseId.message}</p>}
                    </div>

                    {selectedCourse && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl border border-[#18aee5]/20 bg-[#eef8ff]">
                        <h4 className="font-black text-lg text-[#0067b1]">{selectedCourse.title}</h4>
                        <p className="text-sm font-semibold text-[#53647c] mt-2">{selectedCourse.description}</p>
                        <div className="flex gap-4 mt-4 text-sm font-bold text-[#020d24]">
                          <span className="bg-white px-3 py-1 rounded-full shadow-sm">{selectedCourse.duration}</span>
                          <span className="bg-white px-3 py-1 rounded-full shadow-sm text-[#f5b800] border border-[#f5b800]/20">{getCoursePriceDisplay(selectedCourse)} AUD</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="grid gap-6">
                    <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      <div className="p-4 bg-slate-50 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Student</span>
                        <span className="font-black text-[#020d24]">{formValues.firstName} {formValues.lastName}</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Email</span>
                        <span className="font-bold text-[#020d24]">{formValues.email}</span>
                      </div>
                      <div className="p-4 bg-slate-50 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">USI</span>
                        <span className="font-bold text-[#020d24] uppercase">{formValues.usi}</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Selected Program</span>
                        <span className="font-bold text-[#0067b1]">{selectedCourse?.title}</span>
                      </div>
                      <div className="p-4 bg-slate-50 flex justify-between items-center gap-4">
                        <span className="text-sm font-bold text-slate-500">Support needs</span>
                        <span className="text-right font-bold text-[#020d24]">
                          {formValues.disabilityStatus === "yes"
                            ? "Yes"
                            : formValues.disabilityStatus === "prefer_not_to_say"
                              ? "Prefer not to say"
                              : "No"}
                        </span>
                      </div>
                      {formValues.referredBy ? (
                        <div className="p-4 flex justify-between items-center gap-4">
                          <span className="text-sm font-bold text-slate-500">Referred by</span>
                          <span className="text-right font-bold text-[#020d24]">{formValues.referredBy}</span>
                        </div>
                      ) : null}
                    </div>
                    
                    <div className="bg-[#020d24] rounded-2xl p-5 text-white flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-sky-200/70 uppercase tracking-widest mb-1">Total Due</p>
                        <p className="text-3xl font-black">{selectedCourse ? getCoursePriceDisplay(selectedCourse) : ""}</p>
                      </div>
                      <ShieldCheck size={40} className="text-[#f5b800]/30" />
                    </div>

                    <div className="grid gap-2">
                      <p className="text-sm font-bold text-[#020d24]">
                        Security verification
                      </p>
                      <ReCaptchaField
                        error={errors.captchaToken?.message}
                        onChange={handleCaptchaChange}
                        resetKey={captchaResetKey}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
              className="font-bold h-12 px-6 rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="font-black h-12 px-8 rounded-full bg-[#0067b1] hover:bg-[#123e95] shadow-lg shadow-[#0067b1]/20 transition-all"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || !formValues.captchaToken}
                className="font-black h-12 px-8 rounded-full bg-[#020d24] hover:bg-black shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
          {submitError ? (
            <div className="px-6 pb-6">
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {submitError}
              </p>
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
