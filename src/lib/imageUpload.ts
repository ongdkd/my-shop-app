// lib/imageUpload.ts

// Primary image upload using imgbb.com (more reliable)
const IMGBB_API_KEY = 'e9f76b173fba02c187fa07c4c1f9a9fb';

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

// Fallback: Upload to postimg.cc (no API key required)
export const uploadImageToPostImg = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('upload', file);
  
  try {
    const response = await fetch('https://api.postimg.cc/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.url;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

// Main upload function with fallback
export const uploadImageWithFallback = async (file: File): Promise<string> => {
  try {
    // Try imgbb.com first (more reliable)
    return await uploadImage(file);
  } catch (error) {
    console.warn('imgbb.com upload failed, trying postimg.cc fallback:', error);
    // Fallback to postimg.cc
    return await uploadImageToPostImg(file);
  }
};