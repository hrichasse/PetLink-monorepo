const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL"
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

type AppEnv = Record<RequiredEnvVar, string>;

const validateEnv = (): AppEnv => {
  const validated = {} as AppEnv;

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];

    if (!value) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }

    validated[envVar] = value;
  }

  return validated;
};

export const env = validateEnv();
