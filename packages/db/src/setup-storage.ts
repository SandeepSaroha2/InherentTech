import { setupStorageBuckets } from './storage';

async function main() {
  console.log('📦 Setting up Supabase Storage buckets...');
  await setupStorageBuckets();
  console.log('🎉 Storage setup complete!');
}

main().catch(console.error);
