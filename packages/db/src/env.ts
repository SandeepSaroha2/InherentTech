// Validates all required env vars are present
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  directUrl: process.env.DIRECT_URL!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  retellApiKey: process.env.RETELL_API_KEY,
  vonageApiKey: process.env.VONAGE_API_KEY,
  vonageApiSecret: process.env.VONAGE_API_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  n8nBaseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  n8nApiKey: process.env.N8N_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};
