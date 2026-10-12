# Bếp Số: tính năng nâng cao và liên kết bán hàng – trừ kho

## Phạm vi

1. **Nút thao tác nhanh trên thanh trên cùng**: "+ Thêm nguyên liệu", "+ Thêm bán thành phẩm", "+ Thêm món" mở popup ngay tại trang đang xem.
2. **Nguyên liệu & Kho**
   - Lọc theo danh mục: Tất cả, Trái cây tươi, Cà phê, Matcha, Mứt, Syrup, Bánh, Khác; ô tìm kiếm theo tên.
   - Nút "+ Nhập/Xuất kho" (popup ghi biến động, lưu lịch sử) và "Tải chi tiết kho (.xlsx)" cho tháng hiện tại.
   - Bật "Hiện dữ liệu không dùng" hiện cả nguyên liệu đã ẩn.
   - Popup Thêm nguyên liệu: thương hiệu, nhà cung cấp, ngày nhập gần nhất, mức tồn tối thiểu (tồn thấp sẽ đổi màu cảnh báo), đơn vị mua, đơn vị dùng, tỷ lệ quy đổi (VD: 1 Chai = 700ml), tự tính giá vốn trên mỗi ml/gr.
3. **Bán thành phẩm**: màn danh sách BTP; popup gồm tên, sản lượng/mẻ, hướng dẫn, hạn dùng, "+ Thêm thành phần" chọn nguyên liệu và định lượng, tự tính giá vốn cả mẻ và trên mỗi đơn vị.
4. **Món & Công thức**: hiển thị dạng thẻ có Size, giá vốn tự tính (công thức + bao bì), giá bán, % biên lợi nhuận; nút Sửa, Xem công thức, Ẩn, Nhân bản, Xóa. Thanh công cụ: In/Xuất PDF danh sách, In món đã chọn (chọn bằng ô tick), Import công thức từ file (.csv/.xlsx). Popup món: chi phí bao bì, thành phần (nguyên liệu hoặc BTP), thời gian pha chế, dụng cụ đong, các bước hướng dẫn kèm ảnh.
5. **Bảng giá vốn (COGS)**: tổng số món, biên LN trung bình, số món biên LN < 30% (cảnh báo đỏ); bảng TÊN MÓN | THƯƠNG HIỆU | GIÁ VỐN | GIÁ BÁN | LỜI/MÓN | BIÊN LN (%).
6. **Doanh thu & Lãi lỗ**: lọc theo Tháng/Năm; doanh thu, COGS tổng, lợi nhuận gộp, % biên LN gộp; "Tải báo cáo (.xlsx)"; bảng đối chiếu tiền hệ thống với tiền thực nhận theo Tiền mặt / Chuyển khoản / Ví điện tử (nhập số thực nhận, hiện chênh lệch).
7. **Trừ kho khi bán**: màn Bán hàng thêm chọn hình thức thanh toán. Khi bấm "Thanh toán & In hóa đơn", hệ thống trừ nguyên liệu theo công thức (BTP được trừ theo định lượng BTP), ghi lịch sử xuất kho và cộng doanh thu, giá vốn vào báo cáo Lãi lỗ.

## Lưu ý quan trọng

- Đúng như các bước trước, dữ liệu vẫn chỉ nằm trong phiên làm việc: **tải lại trang sẽ mất** các thay đổi. Lưu vĩnh viễn vào Google Sheets và đăng nhập Google/phân quyền sẽ làm ở bước riêng.
- Giữ nguyên giao diện xanh rêu và bố cục hiện có.

## Chi tiết kỹ thuật

- Tạo một kho dữ liệu dùng chung (React context + reducer) bọc dashboard: ingredients, preps (BTP), recipes, stock movements, sales. Mọi màn đọc/ghi qua đây để POS trừ kho được.
- Giá vốn tính bằng hàm thuần: costPerUnit = giá mua / tỷ lệ quy đổi; BTP = tổng thành phần / sản lượng; món = thành phần + bao bì. Có unit test cho các hàm này và cho logic trừ kho.
- Xuất .xlsx bằng thư viện `xlsx` (SheetJS) phía trình duyệt; import công thức đọc cùng thư viện. In/PDF dùng `window.print()` với vùng in hiện có.
- Popup dùng Dialog của shadcn; tách component theo màn (ingredients, preps, recipes, cogs, pnl, pos) thay cho file lớn hiện tại.
- Cập nhật AGENTS.md (kho dữ liệu dùng chung) và roadmap.md.
