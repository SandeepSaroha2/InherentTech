import { supabaseAdmin } from './supabase';

export const STORAGE_BUCKETS = {
  resumes: 'resumes',
  documents: 'documents',
  signatures: 'signatures',
  avatars: 'avatars',
  attachments: 'attachments',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// Run once during initial setup to create all buckets
export async function setupStorageBuckets() {
  const bucketConfigs = [
    { name: STORAGE_BUCKETS.resumes, public: false, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    { name: STORAGE_BUCKETS.documents, public: false, fileSizeLimit: 25 * 1024 * 1024, allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'] },
    { name: STORAGE_BUCKETS.signatures, public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/svg+xml', 'application/pdf'] },
    { name: STORAGE_BUCKETS.avatars, public: true, fileSizeLimit: 2 * 1024 * 1024, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] },
    { name: STORAGE_BUCKETS.attachments, public: false, fileSizeLimit: 50 * 1024 * 1024 },
  ];

  for (const config of bucketConfigs) {
    const { name, ...options } = config;
    const { error } = await supabaseAdmin.storage.createBucket(name, options);
    if (error && !error.message.includes('already exists')) {
      console.error(`Failed to create bucket ${name}:`, error.message);
    } else {
      console.log(`✅ Bucket "${name}" ready`);
    }
  }
}

// Helper to generate signed upload URL
export async function getUploadUrl(bucket: StorageBucket, path: string, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(path);
  if (error) throw error;
  return data;
}

// Helper to generate signed download URL
export async function getDownloadUrl(bucket: StorageBucket, path: string, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// Helper to delete a file
export async function deleteFile(bucket: StorageBucket, paths: string[]) {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove(paths);
  if (error) throw error;
}
