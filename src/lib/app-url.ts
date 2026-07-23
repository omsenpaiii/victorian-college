export function getAppUrl() {
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? process.env["APP_URL"];

  if (appUrl && /^https?:\/\//i.test(appUrl)) {
    return appUrl.replace(/\/$/, "");
  }

  const productionUrl = process.env["VERCEL_PROJECT_PRODUCTION_URL"];
  if (productionUrl) {
    return `https://${productionUrl.replace(/\/$/, "")}`;
  }

  if (process.env["VERCEL_ENV"] === "production") {
    return "https://victorian-college.vercel.app";
  }

  if (process.env["VERCEL_URL"]) {
    return `https://${process.env["VERCEL_URL"]}`;
  }

  return "http://localhost:3000";
}
