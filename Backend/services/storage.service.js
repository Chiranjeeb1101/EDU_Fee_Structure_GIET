const supabase = require('../config/supabase');

class StorageService {
  constructor() {
    this.bucketName = 'profile_pictures';
  }

  /**
   * Ensure the bucket exists and is public
   */
  async initBucket() {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    const exists = buckets.some(b => b.name === this.bucketName);
    if (!exists) {
      console.log(`🚀 Creating bucket: ${this.bucketName}...`);
      const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });
      if (createError) {
        console.error(`❌ Failed to create bucket: ${createError.message}`);
      } else {
        console.log(`✅ Bucket ${this.bucketName} created successfully.`);
      }
    } else {
      // Update the bucket to ensure the limit is raised to 5MB if it was previously 2MB
      await supabase.storage.updateBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });
    }
  }

  /**
   * Upload profile picture from Base64
   * @param {string} userId - User ID
   * @param {string} base64Data - Base64 encoded image (with or without prefix)
   */
  async uploadProfilePicture(userId, base64Data) {
    try {
      // 1. Clean Base64 data (remove prefix if present)
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      
      // 2. Prepare file path
      const fileName = `profile_${userId}_${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // 3. Upload to Supabase
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      throw error;
    }
  }
}

module.exports = new StorageService();
