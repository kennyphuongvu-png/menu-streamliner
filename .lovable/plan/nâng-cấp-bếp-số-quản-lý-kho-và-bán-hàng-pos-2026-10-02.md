# Nâng cấp Bếp Số: quản lý kho và bán hàng POS

## Phạm vi triển khai

- Loại bỏ hoàn toàn mục **Chấm công** khỏi điều hướng và giao diện.
- Giữ giao diện **Tổng quan** hiện tại, đồng thời bổ sung các màn quản lý có dữ liệu mẫu tương tác ngay trong ứng dụng.
- Xây dựng màn **Nguyên liệu & Kho** với nhãn BTP, bộ lọc ẩn/hiện dữ liệu không dùng và chức năng in/xuất danh sách đang hiển thị.
- Xây dựng màn **Kiểm kê kho** với hai trường số lượng: số lượng theo đơn vị nhập và lượng thực tế còn lại theo dung tích/trọng lượng quy đổi.
- Bổ sung màn **Món & Công thức** để in/xuất danh sách menu, công thức và SOP đang hiển thị.
- Xây dựng màn **Bán hàng** hai cột: chọn món nhanh bên trái, giỏ hàng và thanh toán bên phải.
- Khi thanh toán, tạo hóa đơn nhiệt đầy đủ và mở hộp thoại in của trình duyệt; hỗ trợ K80/K57 bằng lựa chọn khổ giấy.

## Trải nghiệm và giao diện

- Giữ nhận diện xanh rêu, hệ chữ và phong cách gọn hiện tại.
- Tối ưu cho máy tính bán hàng; trên màn hình nhỏ, menu và giỏ hàng chuyển sang bố cục dọc dễ thao tác.
- Chỉ nội dung cần in xuất hiện trên giấy; sidebar, thanh công cụ và các nút sẽ bị ẩn.
- Các nút, bộ lọc, tăng giảm số lượng và trạng thái trống đều hoạt động bằng dữ liệu mẫu trong bộ nhớ của phiên hiện tại.

## Chi tiết kỹ thuật

- Giữ ứng dụng trong một dashboard route và dùng state React cục bộ, không dùng LocalStorage và chưa thêm cơ sở dữ liệu.
- Tách các màn quản lý, POS và vùng in thành component nhỏ để mã nguồn dễ bảo trì.
- Dùng `window.print()` cùng CSS `@media print` và kích thước `@page` phù hợp hóa đơn nhiệt.
- Thêm metadata riêng cho màn hình hiện tại và kiểm tra giao diện desktop/mobile sau khi hoàn tất.

## Ngoài phạm vi bước này

- Chưa kết nối Google, Google Sheets hoặc đăng nhập/phân quyền thật; phần đó cần thiết lập kết nối và lưu trữ an toàn ở giai đoạn riêng.
- Nút xuất sẽ dùng bản in sạch hoặc tệp CSV tải xuống từ dữ liệu mẫu đang hiển thị; chưa đồng bộ dữ liệu thật.
