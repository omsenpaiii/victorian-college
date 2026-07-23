"use client";

import { useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

type ReCaptchaFieldProps = {
  error?: string;
  onChange: (token: string) => void;
  resetKey?: number;
};

export function ReCaptchaField({
  error,
  onChange,
  resetKey = 0,
}: ReCaptchaFieldProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  useEffect(() => {
    recaptchaRef.current?.reset();
    onChange("");
  }, [onChange, resetKey]);

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
        Google reCAPTCHA is not configured yet. Add
        {" "}
        <code>NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code>
        {" "}
        to enable this form.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={(value) => onChange(value ?? "")}
          onExpired={() => onChange("")}
        />
      </div>
      {error ? (
        <p className="text-xs font-bold text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
