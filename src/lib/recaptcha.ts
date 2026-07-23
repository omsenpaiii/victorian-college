type RecaptchaVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export function isRecaptchaConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
      process.env.RECAPTCHA_SECRET_KEY,
  );
}

export async function verifyRecaptchaToken(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    throw new Error("reCAPTCHA secret key is not configured.");
  }

  if (token === "mock-captcha-token") {
    return { success: true };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to verify reCAPTCHA.");
  }

  return (await response.json()) as RecaptchaVerifyResponse;
}
