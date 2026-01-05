# ⚙️ CẤU HÌNH API KEY

## Bước 1: Lấy Hugging Face API Key

1. Truy cập: https://huggingface.co/settings/tokens
2. Click "New token"
3. Đặt tên token: `thinklink-api`
4. Chọn Type: **Read**
5. Click "Generate"
6. **Copy token** (bắt đầu bằng `hf_...`)

## Bước 2: Cấu hình file .env

File `.env` đã được tạo sẵn. Bạn chỉ cần:

1. Mở file `.env` trong thư mục project
2. Thay thế dòng:
   ```
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   Bằng API key thật của bạn:
   ```
   HUGGINGFACE_API_KEY=hf_your_actual_token_here
   ```
3. Save file

## Bước 3: Chạy Server

```bash
npm run dev
```

Nếu cấu hình đúng, bạn sẽ thấy:
```
🚀 ThinkLink API Server Started
📍 Port: 3000
🤖 AI Model: Qwen/Qwen2.5-72B-Instruct
✅ API Ready at: http://localhost:3000
```

## Bước 4: Test API

Mở file `test.http` và click "Send Request" để test!

---

**LƯU Ý:**
- ⚠️ KHÔNG commit file `.env` lên Git (đã có trong .gitignore)
- ⚠️ Giữ API key bí mật
- ⚠️ Lần đầu gọi API có thể mất 20-30s để model load
