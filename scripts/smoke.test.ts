import { exec, ChildProcess } from "child_process";
import http from "http";

const DEV_PORT = 3001;
const DEV_URL = `http://localhost:${DEV_PORT}`;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = http
      .createServer()
      .once("error", (err: unknown) => {
        if (err && typeof err === "object" && "code" in err && err.code === "EADDRINUSE") {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once("listening", () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

async function main() {
  console.log("🚀 Starting VCK E2E Smoke Test...");

  // 1. Launch next dev server in background
  console.log(`📡 Launching Next.js dev server on port ${DEV_PORT}...`);
  const devServer: ChildProcess = exec(`npx next dev -p ${DEV_PORT}`, {
    env: { ...process.env, PORT: String(DEV_PORT) },
  });

  // Log stdout/stderr for dev server to console (for tracing test execution)
  devServer.stdout?.on("data", () => {
    // console.log(`[DevServer] data received`);
  });
  devServer.stderr?.on("data", (data) => {
    console.error(`[DevServer Error]: ${data.trim()}`);
  });

  // 2. Wait for server to become active
  let isServerUp = false;
  for (let i = 0; i < 20; i++) {
    await delay(1000);
    const open = await isPortOpen(DEV_PORT);
    if (open) {
      isServerUp = true;
      break;
    }
  }

  if (!isServerUp) {
    console.error("❌ Next.js dev server failed to start on port 3001 within 20s.");
    devServer.kill("SIGINT");
    process.exit(1);
  }

  console.log("✅ Next.js dev server is up and listening!");

  let successCount = 0;
  let failureCount = 0;

  async function testGet(path: string) {
    const url = `${DEV_URL}${path}`;
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        console.log(`🟢 GET ${path} -> Status 200 OK`);
        successCount++;
      } else {
        console.error(`🔴 GET ${path} -> Status ${res.status}`);
        failureCount++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`🔴 GET ${path} -> Failed: ${message}`);
      failureCount++;
    }
  }

  // 3. Test main landing pages
  await testGet("/");
  await testGet("/courses");
  await testGet("/enroll");
  await testGet("/admin");

  // 4. Test interest intake API endpoint
  console.log("📡 Testing POST /api/interests form submission...");
  try {
    const payload = {
      firstName: "Smoke",
      lastName: "Test",
      email: "smoke.test@example.com",
      phone: "0427978810",
      courseSlug: "certificate-iv-business-bsb40120",
      captchaToken: "mock-captcha-token",
    };

    const res = await fetch(`${DEV_URL}/api/interests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.status === 200 && data.success === true && data.leadId) {
      console.log(`🟢 POST /api/interests -> Success 200 OK (Lead ID: ${data.leadId})`);
      successCount++;
    } else {
      console.error(`🔴 POST /api/interests -> Failed with status ${res.status}:`, data);
      failureCount++;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`🔴 POST /api/interests -> Fetch failed: ${message}`);
    failureCount++;
  }

  // 5. Clean up Next.js dev server
  console.log("🧹 Stopping Next.js dev server...");
  devServer.kill("SIGINT");
  
  // Give it a second to exit clean
  await delay(1500);

  console.log("\n=================== SMOKE TEST SUMMARY ===================");
  console.log(`Total Passed: ${successCount}`);
  console.log(`Total Failed: ${failureCount}`);
  console.log("==========================================================");

  if (failureCount > 0) {
    console.error("❌ E2E Smoke test failed!");
    process.exit(1);
  } else {
    console.log("🎉 All E2E smoke tests passed successfully!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
