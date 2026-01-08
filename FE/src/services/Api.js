// Mock API Service to simulate backend responses

// service/api.js

const BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const analyzeProblem = async (formData) => {
  try {
    const response = await fetch(`${BASE_URL}/analyze-problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Đảm bảo formData là Object thuần túy (Plain Object)
      body: JSON.stringify(formData) 
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    // Có thể return null hoặc throw tiếp để UI xử lý
    throw error;
  }
};

/**
 * Health check endpoint simulation
 */
export const checkHealth = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "ThinkLink API is running",
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};
