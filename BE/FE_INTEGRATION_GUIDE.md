# Hướng Dẫn Kết Nối Frontend với ThinkLink API

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [Cấu Hình Backend](#cấu-hình-backend)
- [API Endpoints](#api-endpoints)
- [Ví Dụ Integration](#ví-dụ-integration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## 🎯 Tổng Quan

ThinkLink API là backend service phân tích đề bài học tập sử dụng AI/LLM. API này hỗ trợ các môn học THPT (Toán, Vật lý, Hóa học, Sinh học) từ lớp 8-12.

### Thông Tin Cơ Bản
- **Base URL (Development)**: `http://localhost:3000`
- **Base URL (Production)**: `https://your-domain.com` _(cần cập nhật)_
- **API Version**: `1.0.0`
- **Content-Type**: `application/json`

---

## ⚙️ Cấu Hình Backend

### Khởi Động Server

```bash
# Clone repository
cd BE

# Cài đặt dependencies
npm install

# Copy và cấu hình .env
cp .env.example .env
# Chỉnh sửa .env với API keys phù hợp

# Chạy server
npm start         # Production mode
npm run dev       # Development mode với nodemon
```

### Kiểm Tra Server
Server sẽ chạy tại `http://localhost:3000` (hoặc PORT trong .env)

---

## 🔌 API Endpoints

### 1. Root - API Information
**GET** `/`

Lấy thông tin tổng quan về API và các endpoints available.

#### Response
```json
{
  "success": true,
  "message": "ThinkLink API - EdTech Problem Analysis",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /api/health",
    "analyzeProblem": "POST /api/analyze-problem"
  }
}
```

---

### 2. Health Check
**GET** `/api/health`

Kiểm tra trạng thái hoạt động của API.

#### Response Success (200)
```json
{
  "success": true,
  "message": "ThinkLink API is running",
  "timestamp": "2026-01-05T10:30:00.000Z",
  "service": "Problem Analysis API",
  "version": "1.0.0"
}
```

---

### 3. Analyze Problem (Phân Tích Đề Bài)
**POST** `/api/analyze-problem`

Endpoint chính để phân tích đề bài học tập bằng AI.

#### Request Body
```json
{
  "classLevel": 10,
  "subject": "Toán",
  "currentTopic": "Phương trình bậc hai",
  "problemText": "Giải phương trình: x² - 5x + 6 = 0"
}
```

#### Request Parameters
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `classLevel` | number | ✅ | 8-12 | Khối lớp (8, 9, 10, 11, 12) |
| `subject` | string | ✅ | Enum | Môn học: "Toán", "Vật lý", "Hóa học", "Sinh học" |
| `currentTopic` | string | ✅ | 3-200 chars | Chủ đề/bài học hiện tại |
| `problemText` | string | ✅ | 10-5000 chars | Nội dung đề bài cần phân tích |

#### Response Success (200)
```json
{
  "success": true,
  "message": "Phân tích đề bài thành công",
  "data": {
    "analysis": "... (kết quả phân tích từ AI) ...",
    "suggestions": "... (gợi ý học tập) ...",
    "hints": "... (gợi ý giải quyết) ..."
  }
}
```

#### Response Error (400) - Validation Error
```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    {
      "type": "field",
      "value": "7",
      "msg": "classLevel phải là số nguyên từ 8 đến 12",
      "path": "classLevel",
      "location": "body"
    }
  ]
}
```

#### Response Error (500) - Server Error
```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Error description"
}
```

---

## 💻 Ví Dụ Integration

### 1. Vanilla JavaScript (Fetch API)

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Function: Analyze Problem
async function analyzeProblem(classLevel, subject, currentTopic, problemText) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        classLevel,
        subject,
        currentTopic,
        problemText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('Error analyzing problem:', error);
    throw error;
  }
}

// Example Usage
analyzeProblem(10, 'Toán', 'Phương trình bậc hai', 'Giải phương trình: x² - 5x + 6 = 0')
  .then(result => {
    console.log('Analysis result:', result.data);
  })
  .catch(error => {
    console.error('Failed to analyze:', error.message);
  });
```

---

### 2. Axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
});

// Analyze Problem
export const analyzeProblem = async (classLevel, subject, currentTopic, problemText) => {
  try {
    const response = await apiClient.post('/api/analyze-problem', {
      classLevel,
      subject,
      currentTopic,
      problemText
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Không thể kết nối đến server');
    } else {
      throw new Error('Lỗi không xác định');
    }
  }
};

// Health Check
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    throw new Error('API không hoạt động');
  }
};

// Example usage
analyzeProblem(10, 'Toán', 'Phương trình bậc hai', 'Giải: x² - 5x + 6 = 0')
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error.message));
```

---

### 3. React Hook (Custom Hook)

```javascript
import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const useAnalyzeProblem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const analyzeProblem = async (classLevel, subject, currentTopic, problemText) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze-problem`, {
        classLevel,
        subject,
        currentTopic,
        problemText
      });
      
      setData(response.data.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { analyzeProblem, loading, error, data };
};

// Component Example
function ProblemAnalyzer() {
  const { analyzeProblem, loading, error, data } = useAnalyzeProblem();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await analyzeProblem(
        10,
        'Toán',
        'Phương trình bậc hai',
        'Giải: x² - 5x + 6 = 0'
      );
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <button type="submit" disabled={loading}>
          {loading ? 'Đang phân tích...' : 'Phân tích'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
      {data && <div className="result">{JSON.stringify(data)}</div>}
    </div>
  );
}
```

---

### 4. React + TypeScript

```typescript
// types.ts
export interface AnalyzeProblemRequest {
  classLevel: number;
  subject: 'Toán' | 'Vật lý' | 'Hóa học' | 'Sinh học';
  currentTopic: string;
  problemText: string;
}

export interface AnalyzeProblemResponse {
  success: boolean;
  message: string;
  data: {
    analysis: string;
    suggestions?: string;
    hints?: string;
  };
}

export interface ValidationError {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
}

// api.ts
import axios, { AxiosError } from 'axios';
import type { AnalyzeProblemRequest, AnalyzeProblemResponse, ErrorResponse } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

export const analyzeProblem = async (
  request: AnalyzeProblemRequest
): Promise<AnalyzeProblemResponse> => {
  try {
    const response = await apiClient.post<AnalyzeProblemResponse>(
      '/api/analyze-problem',
      request
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    if (axiosError.response) {
      throw new Error(axiosError.response.data.message || 'Server error');
    }
    throw new Error('Network error');
  }
};

// Usage in component
const handleAnalyze = async () => {
  const request: AnalyzeProblemRequest = {
    classLevel: 10,
    subject: 'Toán',
    currentTopic: 'Phương trình bậc hai',
    problemText: 'Giải: x² - 5x + 6 = 0'
  };

  try {
    const result = await analyzeProblem(request);
    console.log(result.data);
  } catch (error) {
    console.error(error);
  }
};
```

---

### 5. Vue.js 3 (Composition API)

```javascript
// composables/useAnalyzeProblem.js
import { ref } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export function useAnalyzeProblem() {
  const loading = ref(false);
  const error = ref(null);
  const data = ref(null);

  const analyzeProblem = async (classLevel, subject, currentTopic, problemText) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze-problem`, {
        classLevel,
        subject,
        currentTopic,
        problemText
      });
      
      data.value = response.data.data;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra';
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    data,
    analyzeProblem
  };
}

// Component usage
<script setup>
import { ref } from 'vue';
import { useAnalyzeProblem } from '@/composables/useAnalyzeProblem';

const { loading, error, data, analyzeProblem } = useAnalyzeProblem();

const handleAnalyze = async () => {
  try {
    await analyzeProblem(10, 'Toán', 'Phương trình bậc hai', 'Giải: x² - 5x + 6 = 0');
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
</script>

<template>
  <div>
    <button @click="handleAnalyze" :disabled="loading">
      {{ loading ? 'Đang phân tích...' : 'Phân tích' }}
    </button>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="data" class="result">{{ data }}</div>
  </div>
</template>
```

---

## 🚨 Error Handling

### Error Types

#### 1. Validation Errors (400)
Xảy ra khi dữ liệu đầu vào không hợp lệ.

```javascript
// Check for validation errors
if (!response.data.success && response.data.errors) {
  response.data.errors.forEach(error => {
    console.log(`${error.path}: ${error.msg}`);
  });
}
```

#### 2. Server Errors (500)
Lỗi xử lý từ phía server hoặc AI service.

```javascript
// Handle server errors
catch (error) {
  if (error.response?.status === 500) {
    console.error('Server error:', error.response.data.message);
    // Show user-friendly message
    alert('Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.');
  }
}
```

#### 3. Network Errors
Không thể kết nối đến server.

```javascript
catch (error) {
  if (!error.response) {
    console.error('Network error');
    alert('Không thể kết nối đến server. Kiểm tra kết nối mạng.');
  }
}
```

### Complete Error Handler

```javascript
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        // Validation error
        return {
          type: 'validation',
          message: data.message,
          errors: data.errors
        };
      case 404:
        return {
          type: 'not_found',
          message: 'Endpoint không tồn tại'
        };
      case 500:
        return {
          type: 'server_error',
          message: 'Lỗi server. Vui lòng thử lại sau.'
        };
      default:
        return {
          type: 'unknown',
          message: data.message || 'Có lỗi xảy ra'
        };
    }
  } else if (error.request) {
    // Request made but no response
    return {
      type: 'network',
      message: 'Không thể kết nối đến server'
    };
  } else {
    // Something else happened
    return {
      type: 'client',
      message: error.message
    };
  }
};
```

---

## ✅ Best Practices

### 1. Environment Variables
Sử dụng environment variables cho API URL:

```javascript
// .env
REACT_APP_API_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

// Usage
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

### 2. Loading States
Luôn hiển thị loading state cho user:

```javascript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await analyzeProblem(...);
  } finally {
    setLoading(false);
  }
};
```

### 3. Request Timeout
Set timeout cho request để tránh pending vô hạn:

```javascript
axios.create({
  timeout: 30000 // 30 seconds
});
```

### 4. Input Validation on Frontend
Validate input trước khi gửi request:

```javascript
const validateInput = (classLevel, subject, currentTopic, problemText) => {
  if (classLevel < 8 || classLevel > 12) {
    throw new Error('Khối lớp phải từ 8-12');
  }
  
  if (!['Toán', 'Vật lý', 'Hóa học', 'Sinh học'].includes(subject)) {
    throw new Error('Môn học không hợp lệ');
  }
  
  if (problemText.length < 10 || problemText.length > 5000) {
    throw new Error('Đề bài phải từ 10-5000 ký tự');
  }
};
```

### 5. Retry Logic
Implement retry cho các request thất bại:

```javascript
const retryRequest = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 6. Request Cancellation
Cancel request khi component unmount:

```javascript
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal })
    .then(data => console.log(data))
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      }
    });
  
  return () => controller.abort();
}, []);
```

### 7. CORS Handling
Backend đã cấu hình CORS. Nếu gặp CORS error, kiểm tra:
- Backend có đang chạy không
- URL có đúng không
- Browser dev tools console để xem chi tiết lỗi

---

## 📝 Notes

### Supported Subjects
- ✅ Toán
- ✅ Vật lý
- ✅ Hóa học
- ✅ Sinh học

### Class Levels
- ✅ 8, 9, 10, 11, 12

### Rate Limiting
Hiện tại API chưa có rate limiting. Sẽ được implement trong tương lai.

### Authentication
Hiện tại API không yêu cầu authentication. Có thể được thêm trong tương lai.

---

## 🔗 Useful Links

- [Backend Repository](../BE)
- [API Documentation](./README.md)
- [Setup Guide](./SETUP.md)

---

## 📞 Support

Nếu gặp vấn đề khi tích hợp, vui lòng:
1. Kiểm tra backend có đang chạy không
2. Kiểm tra logs trong terminal
3. Kiểm tra network tab trong browser dev tools
4. Liên hệ team backend để được hỗ trợ

---

**Last Updated**: January 5, 2026  
**Version**: 1.0.0
