const { cloudinary, uploadImage, deleteImage } = require('../config/cloudinary.config');

describe('Cloudinary Configuration', () => {
  test('should configure cloudinary with environment variables', () => {
    expect(cloudinary.config().cloud_name).toBe(process.env.CLOUDINARY_CLOUD_NAME);
    expect(cloudinary.config().api_key).toBe(process.env.CLOUDINARY_API_KEY);
    expect(cloudinary.config().api_secret).toBe(process.env.CLOUDINARY_API_SECRET);
  });

  test('should have uploadImage function', () => {
    expect(typeof uploadImage).toBe('function');
  });

  test('should have deleteImage function', () => {
    expect(typeof deleteImage).toBe('function');
  });
}); 