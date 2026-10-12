# F&B Boss

Hãy xây dựng một phần mềm quản lý kinh doanh F&B (Quản lý công thức, kho bãi, giá vốn COGS) bằng tiếng Việt. 

Yêu cầu cốt lõi về kiến trúc dữ liệu:

1. Tuyệt đối không lưu dữ liệu vào LocalStorage. 

2. Hãy thiết lập sẵn cấu trúc kết nối với Google Sheets API. Khi người dùng đăng nhập bằng Google, ứng dụng sẽ tự động kiểm tra và tạo một file Google Sheets trên Google Drive của chính người dùng đó để làm database lưu trữ vĩnh viễn. 

3. Thiết lập sẵn hệ thống Phân quyền người dùng (RBAC) dựa trên Email Gmail đăng nhập gồm 3 quyền: Admin (Chủ quán - Toàn quyền), Manager (Quản lý), Staff (Nhân viên).

Trước hết, hãy dựng cho tôi khung giao diện chính (Sidebar Menu) gồm các mục sau:

- Tổng quan (Dashboard) kèm Checklist trước khi giao khách.

- Nguyên liệu & Kho

- Bán thành phẩm (Sơ chế)

- Món & Công thức

- Bảng giá vốn (COGS)

- Doanh thu & Lãi lỗ

- Chấm công (Mới)

- Kiểm kê kho (Mới)

Hãy tạo một giao diện hiện đại, sạch sẽ bằng tông màu xanh rêu chủ đạo, sử dụng Tailwind CSS và các icon trực quan cho từng mục menu. Sau khi dựng xong khung giao diện, hãy dừng lại để tôi kiểm tra.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quanly-mon-ngon.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2203c028-0257-4528-a0a8-bce0e24ec1a6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
