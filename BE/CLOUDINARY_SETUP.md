# Hướng Dẫn Cấu Hình Cloudinary cho RAG Upload

## Tại Sao Sử Dụng Cloudinary?

Trong môi trường production, việc lưu file tạm trên server có thể gây ra các vấn đề:
- Server không có quyền ghi file
- Filesystem không persistent (ví dụ: Heroku, Vercel)
- Khó scale khi có nhiều instances

**Giải pháp**: Upload file trực tiếp lên Cloudinary cloud storage.

## Cách Lấy Cloudinary Credentials

### 1. Đăng Ký Tài Khoản Cloudinary (Miễn Phí)

Truy cập: https://cloudinary.com/users/register_free

### 2. Lấy API Credentials

Sau khi đăng nhập, vào **Dashboard** tại: https://console.cloudinary.com/

Bạn sẽ thấy:
```
Cloud Name: your_cloud_name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz
```

### 3. Cấu Hình .env

Copy credentials vào file `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

## Cấu Hình Cloudinary Folder

Mặc định, PDF files sẽ được upload vào folder: `thinklink-rag-documents`

Để thay đổi folder, sửa trong `BE/middlewares/uploadMiddleware.js`:

```javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'your-custom-folder-name', // <--- Thay đổi tại đây
    resource_type: 'raw',
    allowed_formats: ['pdf'],
    // ...
  },
});
```

## Giới Hạn Free Plan

Cloudinary Free Plan cung cấp:
- ✅ 25 GB Storage
- ✅ 25 GB Bandwidth/tháng
- ✅ 25,000 transformations/tháng

Đủ cho hầu hết các dự án nhỏ/vừa!

## Kiểm Tra Cấu Hình

Sau khi cấu hình, khởi động server:

```bash
npm start
```

Nếu thành công, bạn sẽ thấy log:
```
✓ Cloudinary configured: your_cloud_name
```

## Upload Test

Sử dụng giao diện admin tại: http://localhost:5173/admin/upload

Hoặc test bằng curl:

```bash
curl -X POST http://localhost:3000/api/rag/upload \
  -F "pdf=@test.pdf"
```

## Quản Lý Files Trên Cloudinary

Truy cập Media Library: https://console.cloudinary.com/console/media_library

Tại đây bạn có thể:
- Xem tất cả files đã upload
- Xóa files không cần thiết
- Tải xuống files
- Kiểm tra storage usage

## Troubleshooting

### Lỗi: "Cloudinary configuration error"

**Nguyên nhân**: Sai thông tin credentials

**Giải pháp**: Kiểm tra lại `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `.env`

### Lỗi: "Upload failed: Invalid resource type"

**Nguyên nhân**: Cloudinary cần `resource_type: 'raw'` cho PDF files

**Giải pháp**: Đã được cấu hình sẵn trong `uploadMiddleware.js`, không cần thay đổi

### Lỗi: "Download PDF failed"

**Nguyên nhân**: Cloudinary URL không trả về file

**Giải pháp**: Đảm bảo file đã upload thành công và URL chính xác

## Best Practices

1. **Tự động xóa files cũ**: Cloudinary không tự động xóa files. Nên implement logic xóa files sau một thời gian.

2. **Optimize storage**: Nén PDF files trước khi upload để tiết kiệm bandwidth.

3. **Security**: Không commit `.env` file lên Git. Chỉ commit `.env.example`.

4. **Monitor usage**: Thường xuyên kiểm tra Cloudinary dashboard để theo dõi storage usage.

## So Sánh: Local Storage vs Cloudinary

| Feature | Local Storage | Cloudinary |
|---------|---------------|------------|
| Setup | Dễ dàng | Cần đăng ký tài khoản |
| Production | ❌ Không ổn định | ✅ Ổn định |
| Scalability | ❌ Khó scale | ✅ Dễ dàng scale |
| Bandwidth | ⚠️ Phụ thuộc server | ✅ CDN toàn cầu |
| Cost | Miễn phí | Miễn phí (Free Plan) |

## Kết Luận

Cloudinary là giải pháp tối ưu cho production deployment. Setup một lần, sử dụng vĩnh viễn! 🚀
