// Mobile API service disabled
const DISABLED_RESPONSE = { error: "Mobile API access is currently disabled." };

export const getMaterials = async (query = "") => {
  return DISABLED_RESPONSE;
};

export const getPreviewUrl = async (documentId) => {
  return DISABLED_RESPONSE;
};

export const getDownloadUrl = async (documentId) => {
  return DISABLED_RESPONSE;
};

export const getStats = async () => {
  return DISABLED_RESPONSE;
};
