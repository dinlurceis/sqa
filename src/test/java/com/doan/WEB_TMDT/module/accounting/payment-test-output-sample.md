# Payment Module Test Output Sample

## Mô tả từng test

### PAY_001: Thanh toán toàn bộ đúng số tiền
- Kịch bản: thanh toán đúng toàn bộ số tiền còn nợ.
- Mong muốn: thực hiện thành công và công nợ chuyển sang `PAID`.

```
PAY_001: Kết quả PASS
```

### PAY_002: Thanh toán sai số tiền vượt quá remaining
- Kịch bản: thanh toán lớn hơn số tiền còn nợ.
- Mong muốn: block giao dịch ngay từ đầu và trả về lỗi.

```
PAY_002: Kết quả PASS
```

### PAY_003: Thanh toán với payable không tồn tại
- Kịch bản: gửi payment request đến payable id không tồn tại.
- Mong muốn: trả về lỗi "Không tìm thấy công nợ" và không lưu payment/transaction.

```
PAY_003: Kết quả PASS
```

### PAY_004: Thanh toán số tiền bằng 0 chưa được xử lý đúng
- Kịch bản: gửi yêu cầu thanh toán với số tiền bằng 0.
- Mong muốn: hệ thống phải từ chối và không lưu payment/transaction.

```
PAY_004: Kết quả FAIL
```

### PAY_005: Thanh toán số tiền âm chưa được xử lý đúng
- Kịch bản: gửi yêu cầu thanh toán với số tiền âm.
- Mong muốn: hệ thống phải từ chối và không lưu payment/transaction.

```
PAY_005: Kết quả FAIL
```

### PAY_006: Tạo công nợ từ PO khi chưa tồn tại công nợ cho PO đó
- Kịch bản: khởi tạo công nợ cho PO chưa có công nợ.
- Mong muốn: tạo công nợ thành công và lưu dữ liệu.

```
PAY_006: Kết quả PASS
```

### PAY_007: Tạo công nợ từ PO trả về lỗi nếu đã tồn tại công nợ
- Kịch bản: cố gắng tạo công nợ cho PO đã có công nợ.
- Mong muốn: trả về lỗi và không tạo mới.

```
PAY_007: Kết quả PASS
```

### PAY_008: Tạo công nợ dùng default 30 ngày khi supplier không có paymentTermDays
- Kịch bản: supplier không có `paymentTermDays`.
- Mong muốn: dùng mặc định 30 ngày cho `dueDate`.

```
PAY_008: Kết quả PASS
```

### PAY_009: Lấy thông tin công nợ theo ID thành công
- Kịch bản: truy vấn công nợ tồn tại.
- Mong muốn: trả về dữ liệu công nợ đúng.

```
PAY_009: Kết quả PASS
```

### PAY_010: Lấy lịch sử thanh toán trả về danh sách payment
- Kịch bản: truy vấn lịch sử thanh toán của một payable.
- Mong muốn: trả về danh sách giao dịch thanh toán.

```
PAY_010: Kết quả PASS
```

### PAY_011: Lấy công nợ theo nhà cung cấp trả về tổng outstanding đúng
- Kịch bản: tính tổng outstanding theo supplier.
- Mong muốn: trả về giá trị tổng công nợ chính xác.

```
PAY_011: Kết quả PASS
```

### PAY_012: Lấy công nợ quá hạn trả về danh sách
- Kịch bản: lấy danh sách công nợ quá hạn.
- Mong muốn: trả về danh sách đúng.

```
PAY_012: Kết quả PASS
```

### PAY_013: Lấy công nợ sắp đến hạn trả về danh sách theo ngày
- Kịch bản: lấy danh sách công nợ sắp đến hạn với số ngày xác định.
- Mong muốn: trả về danh sách đúng.

```
PAY_013: Kết quả PASS
```

### PAY_014: Lấy thống kê công nợ trả về tổng, overdueCount và upcomingCount
- Kịch bản: tổng hợp dữ liệu công nợ.
- Mong muốn: trả về số liệu thống kê chính xác.

```
PAY_014: Kết quả PASS
```

### PAY_015: Lấy báo cáo công nợ trả về tổng tiền, tổng paid và tổng remaining
- Kịch bản: báo cáo công nợ theo khoảng thời gian.
- Mong muốn: trả về báo cáo tổng hợp chính xác.

```
PAY_015: Kết quả PASS
```


