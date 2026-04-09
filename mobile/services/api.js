// Replace with your actual laptop IP address found via 'ipconfig' (current: 10.134.204.178)
// If you are testing on an emulator, you can use http://10.0.2.2:5000 for Android
const BASE_URL = "http://10.134.204.178:5000/api"; 

export const getMaterials = async (query = "") => {
  try {
    const res = await fetch(`${BASE_URL}/documents/search${query}`);
    return await res.json();
  } catch (error) {
    console.error("API Call error:", error);
    return { error: error.message };
  }
};

export const getPreviewUrl = async (documentId) => {
  try {
    const res = await fetch(`${BASE_URL}/documents/${documentId}/preview-url`);
    return await res.json();
  } catch (error) {
    console.error("API Call error:", error);
    return { error: error.message };
  }
};

export const getDownloadUrl = async (documentId) => {
  try {
    const res = await fetch(`${BASE_URL}/documents/${documentId}/download`);
    return await res.json();
  } catch (error) {
    console.error("API Call error:", error);
    return { error: error.message };
  }
};

export const getStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/analytics/overview`);
      return await res.json();
    } catch (error) {
      console.error("API Call error:", error);
      return { error: error.message };
    }
  };
