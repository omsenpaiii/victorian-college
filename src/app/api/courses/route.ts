import { NextResponse } from "next/server";
import { getCourses } from "@/lib/course-repository";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ courses: await getCourses() });
}
