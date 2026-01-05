# Hướng dẫn sử dụng ThinkLink API

## 1. Cài đặt

```bash
# Clone project
cd thinklink

# Install dependencies
npm install

# Tạo file .env và thêm API key
# Copy từ .env.example và điền thông tin
```

## 2. Lấy Hugging Face API Key

1. Truy cập: https://huggingface.co/
2. Đăng ký/Đăng nhập tài khoản
3. Vào Settings → Access Tokens
4. Tạo new token với quyền "Read"
5. Copy token và paste vào file `.env`:

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxx
```

## 3. Chạy Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 4. Test API

### Sử dụng REST Client (VS Code Extension)

1. Cài extension "REST Client" trong VS Code
2. Mở file `test.http`
3. Click "Send Request" trên mỗi request để test

### Sử dụng Postman/Insomnia

Import collection từ file `test.http` hoặc tạo request thủ công:

**Endpoint:** `POST http://localhost:3000/api/analyze-problem`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "classLevel": 10,
  "subject": "Vật lý",
  "currentTopic": "Chuyển động rơi tự do",
  "problemText": "Một vật được thả rơi tự do từ độ cao h. Sau 5 giây vật chạm đất. Lấy g = 10 m/s². Tính quãng đường và vận tốc khi chạm đất."
}
```

### Sử dụng curl

```bash
curl -X POST http://localhost:3000/api/analyze-problem \
  -H "Content-Type: application/json" \
  -d '{
    "classLevel": 10,
    "subject": "Vật lý",
    "currentTopic": "Chuyển động rơi tự do",
    "problemText": "Một vật được thả rơi tự do từ độ cao h. Sau 5 giây vật chạm đất. Lấy g = 10 m/s². Tính quãng đường và vận tốc khi chạm đất."
  }'
```

## 5. Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Phân tích đề bài thành công",
  "data": {
    "summary": "Tóm tắt đề bài",
    "key_points": [
      {
        "content": "v0 = 0 m/s",
        "level": 2,
        "source_text": "thả rơi tự do",
        "explanation": "Từ khóa 'thả rơi' ngụ ý vận tốc ban đầu bằng 0"
      },
      {
        "content": "t = 5s",
        "level": 1,
        "source_text": "sau 5 giây",
        "explanation": "Thông tin trực tiếp"
      }
    ],
    "unknowns": ["Quãng đường s", "Vận tốc chạm đất v"]
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Dữ liệu đầu vào không hợp lệ",
    "details": [...]
  }
}
```

## 6. Input Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| classLevel | number | Yes | 8-12 |
| subject | string | Yes | "Toán", "Vật lý", "Hóa học", "Sinh học" |
| currentTopic | string | Yes | 3-200 chars |
| problemText | string | Yes | 10-5000 chars |

## 7. Error Handling

API xử lý các loại lỗi sau:

- **VALIDATION_ERROR**: Input không hợp lệ
- **AUTHENTICATION_ERROR**: API key không đúng
- **MODEL_LOADING**: Model đang load (retry sau 20-30s)
- **PARSE_ERROR**: Lỗi parse JSON từ AI
- **SERVER_ERROR**: Lỗi server khác

## 8. Lưu ý quan trọng

⚠️ **Lần đầu gọi API**: Model có thể mất 20-30 giây để load. Nếu gặp lỗi 503, hãy đợi và retry.

⚠️ **Rate Limiting**: Hugging Face free tier có giới hạn số request. Sử dụng hợp lý.

⚠️ **Prompt Engineering**: System prompt trong file `services/huggingFaceService.js` được tối ưu cho việc phân tích đề bài. Có thể điều chỉnh nếu cần.

## 9. Cấu trúc Project

```
thinklink/
├── controllers/
│   └── analyzeProblemController.js   # Xử lý request/response
├── services/
│   └── huggingFaceService.js         # Logic gọi API & prompt engineering
├── routes/
│   └── api.js                        # Định nghĩa routes & validation
├── middlewares/
│   ├── errorHandler.js               # Error handling
│   └── requestLogger.js              # Request logging
├── utils/
│   └── textUtils.js                  # Helper functions
├── .env                              # Environment variables
├── .env.example                      # Environment template
├── server.js                         # Main server file
├── package.json                      # Dependencies
└── test.http                         # API test cases
```

## 10. Troubleshooting

### Lỗi: "API Key không hợp lệ"
- Kiểm tra file `.env` có đúng API key
- Verify API key trên Hugging Face
- Đảm bảo token có quyền "Read"

### Lỗi: "Model đang loading"
- Đợi 20-30 giây
- Retry request

### Lỗi: "Không thể parse JSON"
- Model trả về format không đúng
- Check console log để xem response
- Có thể cần điều chỉnh prompt

### Server không start
- Check port 3000 có bị chiếm
- Verify Node.js version (>= 14)
- Check dependencies đã install

## 11. Next Steps

Sau khi API hoạt động tốt, có thể mở rộng:

- [ ] Thêm database để lưu lịch sử phân tích
- [ ] Implement authentication cho users
- [ ] Cache kết quả để tối ưu performance
- [ ] Thêm endpoints khác (giải bài, tạo đề tương tự, etc.)
- [ ] Deploy lên cloud (Heroku, Railway, Render, etc.)
