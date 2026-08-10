import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "dummy-service-role-key",
      SUPABASE_ANON_KEY: "dummy-anon-key",
      SUPABASE_JWT_SECRET: "dummy-jwt-secret-para-tests",
      CONCIERTO_ACCESS_CODE: "FANMEET2026",
    },
  },
});
