package com.doan.WEB_TMDT.module.auth.controller;

import com.doan.WEB_TMDT.common.dto.ApiResponse;
import com.doan.WEB_TMDT.module.auth.entity.EmployeeRegistration;
import com.doan.WEB_TMDT.module.auth.entity.Position;
import com.doan.WEB_TMDT.module.auth.repository.EmployeeRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final EmployeeRegistrationRepository registrationRepo;
    private final com.doan.WEB_TMDT.module.auth.service.UserService userService;
    private final com.doan.WEB_TMDT.module.auth.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.doan.WEB_TMDT.module.auth.repository.CustomerRepository customerRepository;
    private final com.doan.WEB_TMDT.module.order.repository.OrderRepository orderRepository;
    private final com.doan.WEB_TMDT.module.product.repository.ProductRepository productRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final com.doan.WEB_TMDT.module.payment.repository.PaymentRepository paymentRepository;
    private final com.doan.WEB_TMDT.module.order.repository.ShipperAssignmentRepository shipperAssignmentRepository;
    private final com.doan.WEB_TMDT.module.auth.repository.EmployeeRepository employeeRepository;
    private final com.doan.WEB_TMDT.module.inventory.repository.InventoryStockRepository inventoryStockRepository;
    private final com.doan.WEB_TMDT.module.inventory.repository.ProductDetailRepository productDetailRepository;
    private final com.doan.WEB_TMDT.module.inventory.repository.ExportOrderRepository exportOrderRepository;

    @GetMapping("/employee-registrations")
    public ApiResponse getAllRegistrations() {
        List<EmployeeRegistration> all = registrationRepo.findAll();
        return ApiResponse.success("Total: " + all.size(), all);
    }

    @PostMapping("/create-test-registration")
    public ApiResponse createTestRegistration() {
        EmployeeRegistration test = EmployeeRegistration.builder()
                .fullName("Test User " + System.currentTimeMillis())
                .email("test" + System.currentTimeMillis() + "@example.com")
                .phone("0" + System.currentTimeMillis())
                .address("Test Address")
                .position(Position.SALE)
                .note("Test note")
                .approved(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        EmployeeRegistration saved = registrationRepo.save(test);
        return ApiResponse.success("Created test registration with ID: " + saved.getId(), saved);
    }

    @DeleteMapping("/clear-registrations")
    public ApiResponse clearAllRegistrations() {
        long count = registrationRepo.count();
        registrationRepo.deleteAll();
        return ApiResponse.success("Deleted " + count + " registrations", null);
    }

    @PostMapping("/generate-test-customers")
    public ApiResponse generateTestCustomers(@RequestParam(defaultValue = "1000") int count) {
        int successCount = 0;
        long baseTime = System.currentTimeMillis();
        for (int i = 1; i <= count; i++) {
            String email = "user" + i + "@gmail.com";
            String password = "12345678";
            String fullName = "Test User " + i;
            String phone = "09" + String.format("%08d", (baseTime % 100000) * 1000 + i);
            if (phone.length() > 10) {
                phone = phone.substring(0, 10);
            }
            String address = "Test Address " + i;

            try {
                userService.registerCustomer(email, password, fullName, phone, address);
                successCount++;
            } catch (Exception e) {
                System.out.println("Error generating customer " + i + ": " + e.getMessage());
            }
        }
        return ApiResponse.success("Generated " + successCount + " test customers", null);
    }

    @PostMapping("/generate-test-employees")
    public ApiResponse generateTestEmployees() {
        int successCount = 0;
        long baseTime = System.currentTimeMillis();
        String password = "12345678";
        String encodedPassword = passwordEncoder.encode(password);

        for (Position position : Position.values()) {
            String prefix = "";
            switch (position) {
                case SALE: prefix = "nvbh"; break;
                case CSKH: prefix = "nvcskh"; break;
                case PRODUCT_MANAGER: prefix = "nvqlsp"; break;
                case WAREHOUSE: prefix = "nvkho"; break;
                case ACCOUNTANT: prefix = "nvkt"; break;
                case SHIPPER: prefix = "nvgh"; break;
            }

            for (int i = 1; i <= 5; i++) {
                String email = prefix + i + "@gmail.com";
                String fullName = position.name() + " " + i;
                String phone = "08" + String.format("%08d", (baseTime % 100000) * 100 + i + position.ordinal() * 10);
                if (phone.length() > 10) {
                    phone = phone.substring(0, 10);
                }
                String address = "Địa chỉ của " + prefix + " " + i;

                try {
                    if (userRepository.existsByEmail(email)) {
                        continue;
                    }

                    com.doan.WEB_TMDT.module.auth.entity.User user = com.doan.WEB_TMDT.module.auth.entity.User.builder()
                            .email(email)
                            .password(encodedPassword)
                            .role(com.doan.WEB_TMDT.module.auth.entity.Role.EMPLOYEE)
                            .status(com.doan.WEB_TMDT.module.auth.entity.Status.ACTIVE)
                            .build();

                    com.doan.WEB_TMDT.module.auth.entity.Employee emp = com.doan.WEB_TMDT.module.auth.entity.Employee.builder()
                            .user(user)
                            .fullName(fullName)
                            .phone(phone)
                            .address(address)
                            .position(position)
                            .firstLogin(false)
                            .build();

                    user.setEmployee(emp);
                    userRepository.save(user);
                    successCount++;
                } catch (Exception e) {
                    System.out.println("Error generating employee " + email + ": " + e.getMessage());
                }
            }
        }
        return ApiResponse.success("Generated " + successCount + " test employees", null);
    }

    @PostMapping("/generate-test-orders")
    public ApiResponse generateTestOrders() {
        List<com.doan.WEB_TMDT.module.auth.entity.Customer> customers = customerRepository.findAll();
        List<Long> productIds = java.util.stream.IntStream.rangeClosed(1, 15).mapToObj(Long::valueOf).collect(java.util.stream.Collectors.toList());
        List<com.doan.WEB_TMDT.module.product.entity.Product> products = productRepository.findAllById(productIds);

        if (products.isEmpty()) {
            return ApiResponse.error("Không tìm thấy sản phẩm có id 1-15");
        }

        List<com.doan.WEB_TMDT.module.auth.entity.Employee> shippers = employeeRepository.findAll().stream()
                .filter(e -> e.getPosition() == com.doan.WEB_TMDT.module.auth.entity.Position.SHIPPER)
                .collect(java.util.stream.Collectors.toList());

        java.util.Random rand = new java.util.Random();
        int totalOrders = 0;
        com.doan.WEB_TMDT.module.order.entity.OrderStatus[] statuses = {
            com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED,
            com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING,
            com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP,
            com.doan.WEB_TMDT.module.order.entity.OrderStatus.CONFIRMED,
            com.doan.WEB_TMDT.module.order.entity.OrderStatus.PENDING_PAYMENT,
            com.doan.WEB_TMDT.module.order.entity.OrderStatus.CANCELLED,
            com.doan.WEB_TMDT.module.order.entity.OrderStatus.COMPLETED
        };

        for (com.doan.WEB_TMDT.module.auth.entity.Customer customer : customers) {
            int orderCount = rand.nextInt(3); // 0-2 orders per customer
            for (int i = 0; i < orderCount; i++) {
                String paymentMethod = rand.nextBoolean() ? "COD" : "SEPAY";
                com.doan.WEB_TMDT.module.order.entity.OrderStatus status = statuses[rand.nextInt(statuses.length)];
                
                boolean isPaid = (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED) || 
                                 ("SEPAY".equals(paymentMethod) && (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.CONFIRMED));
                
                com.doan.WEB_TMDT.module.order.entity.PaymentStatus paymentStatus = 
                    isPaid ? com.doan.WEB_TMDT.module.order.entity.PaymentStatus.PAID 
                           : com.doan.WEB_TMDT.module.order.entity.PaymentStatus.UNPAID;

                // Pool of real addresses across provinces for GHN mapping
                // { province, district, wardCode, wardName, streetAddress }
                String[][] addressPool = {
                    {"H\u00e0 N\u1ed9i",        "Qu\u1eadn C\u1ea7u Gi\u1ea5y",    "1A0112", "Ph\u01b0\u1eddng D\u1ecbch V\u1ecdng",   "S\u1ed1 1 Tr\u1ea7n Th\u00e1i T\u00f4ng"},
                    {"H\u00e0 N\u1ed9i",        "Qu\u1eadn \u0110\u1ed1ng \u0110a",       "1A0314", "Ph\u01b0\u1eddng L\u00e1ng Th\u01b0\u1ee3ng", "S\u1ed1 12 Ch\u00f9a L\u00e1ng"},
                    {"H\u00e0 N\u1ed9i",        "Qu\u1eadn Hai B\u00e0 Tr\u01b0ng",  "1A0415", "Ph\u01b0\u1eddng B\u00e1ch Khoa",   "S\u1ed1 45 T\u1ea1 Quang B\u1eedu"},
                    {"H\u00e0 N\u1ed9i",        "Qu\u1eadn Ho\u00e0n Ki\u1ebfm",     "1A0106", "Ph\u01b0\u1eddng H\u00e0ng B\u00e0i",   "S\u1ed1 5 \u0110inh Ti\u00ean Ho\u00e0ng"},
                    {"TP H\u1ed3 Ch\u00ed Minh","Qu\u1eadn 1",              "1B0101", "Ph\u01b0\u1eddng B\u1ebfn Ngh\u00e9",  "S\u1ed1 30 L\u00ea Du\u1ea9n"},
                    {"TP H\u1ed3 Ch\u00ed Minh","Qu\u1eadn 3",              "1B0301", "Ph\u01b0\u1eddng V\u00f5 Th\u1ecb S\u00e1u", "S\u1ed1 18 L\u00fd Ch\u00ednh Th\u1eafng"},
                    {"TP H\u1ed3 Ch\u00ed Minh","Qu\u1eadn B\u00ecnh Th\u1ea1nh",   "1B1101", "Ph\u01b0\u1eddng 25",          "S\u1ed1 59 N\u01a1 Trang Long"},
                    {"TP H\u1ed3 Ch\u00ed Minh","Qu\u1eadn T\u00e2n B\u00ecnh",     "1B0801", "Ph\u01b0\u1eddng 1",           "S\u1ed1 77 C\u1ed9ng H\u00f2a"},
                    {"\u0110\u00e0 N\u1eb5ng",      "Qu\u1eadn H\u1ea3i Ch\u00e2u",     "1C0101", "Ph\u01b0\u1eddng H\u1ea3i Ch\u00e2u I","S\u1ed1 24 Tr\u1ea7n Ph\u00fa"},
                    {"\u0110\u00e0 N\u1eb5ng",      "Qu\u1eadn Thanh Kh\u00ea",      "1C0201", "Ph\u01b0\u1eddng T\u00e2n Ch\u00ednh",  "S\u1ed1 8 \u0110i\u1ec7n Bi\u00ean Ph\u1ee7"},
                    {"H\u1ea3i Ph\u00f2ng",    "Qu\u1eadn H\u1ed3ng B\u00e0ng",     "1D0101", "Ph\u01b0\u1eddng Qu\u00e1n To\u00e0n",  "S\u1ed1 3 \u0110inh Ti\u00ean Ho\u00e0ng"},
                    {"C\u1ea7n Th\u01a1",       "Qu\u1eadn Ninh Ki\u1ec1u",      "1E0101", "Ph\u01b0\u1eddng An H\u1ed9i",    "S\u1ed1 2 Hai B\u00e0 Tr\u01b0ng"},
                    {"B\u00ecnh D\u01b0\u01a1ng",   "TP Th\u1ee7 D\u1ea7u M\u1ed9t",  "1F0101", "Ph\u01b0\u1eddng Ph\u00fa C\u01b0\u1eddng",  "S\u1ed1 20 Yersin"},
                    {"\u0110\u1ed3ng Nai",      "TP Bi\u00ean H\u00f2a",         "1G0101", "Ph\u01b0\u1eddng Trung D\u0169ng",  "S\u1ed1 15 V\u00f5 Th\u1ecb S\u00e1u"},
                    {"Kh\u00e1nh H\u00f2a",     "TP Nha Trang",         "1H0101", "Ph\u01b0\u1eddng L\u1ed9c Th\u1ecd",    "S\u1ed1 6 Yersin"},
                };
                String[] addr = addressPool[rand.nextInt(addressPool.length)];
                String addrProvince = addr[0];
                String addrDistrict = addr[1];
                String addrWardCode = addr[2];
                String addrWardName = addr[3];
                String addrStreet   = addr[4];
                String fullShipping = addrStreet + ", " + addrWardName + ", " + addrDistrict + ", " + addrProvince;

                // Pre-compute timestamps based on status
                java.time.LocalDateTime createdAt = java.time.LocalDateTime.now().minusDays(rand.nextInt(30));
                java.time.LocalDateTime confirmedAt = null;
                java.time.LocalDateTime shippedAt   = null;
                java.time.LocalDateTime deliveredAt  = null;
                java.time.LocalDateTime completedAt  = null;
                java.time.LocalDateTime cancelledAt  = null;
                String cancelReason = null;
                boolean isExternalProvince = !addrProvince.equals("H\u00e0 N\u1ed9i");

                if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.COMPLETED) {
                    confirmedAt  = createdAt.plusHours(1);
                    shippedAt    = createdAt.plusDays(1);
                    deliveredAt  = createdAt.plusDays(2);
                    completedAt  = createdAt.plusDays(3);
                } else if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED) {
                    confirmedAt  = createdAt.plusHours(1);
                    shippedAt    = createdAt.plusDays(1);
                    deliveredAt  = createdAt.plusDays(2);
                } else if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING) {
                    confirmedAt  = createdAt.plusHours(1);
                    shippedAt    = createdAt.plusDays(1);
                } else if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP) {
                    confirmedAt  = createdAt.plusHours(1);
                    shippedAt    = createdAt.plusDays(1);
                } else if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.CONFIRMED) {
                    confirmedAt  = createdAt.plusHours(1);
                    if ("COD".equals(paymentMethod)) { confirmedAt = createdAt; }
                } else if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.CANCELLED) {
                    cancelledAt  = createdAt.plusHours(rand.nextInt(48) + 1);
                    cancelReason = rand.nextBoolean() ? "Kh\u00e1ch h\u00e0ng h\u1ee7y \u0111\u01a1n" : "H\u1ebft h\u00e0ng";
                }

                // GHN fields for external province orders that are shipped/delivered
                String ghnOrderCode = null;
                String ghnShippingStatus = null;
                java.time.LocalDateTime ghnCreatedAt = null;
                java.time.LocalDateTime ghnExpectedDelivery = null;
                if (isExternalProvince && shippedAt != null) {
                    ghnOrderCode = "GHN" + System.currentTimeMillis() + rand.nextInt(10000);
                    ghnShippingStatus = (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.COMPLETED) ? "delivered" : "transporting";
                    ghnCreatedAt = shippedAt;
                    ghnExpectedDelivery = shippedAt.plusDays(3);
                }

                com.doan.WEB_TMDT.module.order.entity.Order order = com.doan.WEB_TMDT.module.order.entity.Order.builder()
                        .orderCode("TEST" + System.currentTimeMillis() + rand.nextInt(1000))
                        .customer(customer)
                        .shippingAddress(fullShipping)
                        .province(addrProvince)
                        .district(addrDistrict)
                        .ward(addrWardCode)
                        .wardName(addrWardName)
                        .address(addrStreet)
                        .note("\u0110\u01a1n h\u00e0ng test random")
                        .subtotal(0.0)
                        .shippingFee(30000.0)
                        .discount(0.0)
                        .total(0.0)
                        .status(status)
                        .paymentStatus(paymentStatus)
                        .paymentMethod(paymentMethod)
                        .createdAt(createdAt)
                        .confirmedAt(confirmedAt)
                        .shippedAt(shippedAt)
                        .deliveredAt(deliveredAt)
                        .completedAt(completedAt)
                        .cancelledAt(cancelledAt)
                        .cancelReason(cancelReason)
                        .ghnOrderCode(ghnOrderCode)
                        .ghnShippingStatus(ghnShippingStatus)
                        .ghnCreatedAt(ghnCreatedAt)
                        .ghnExpectedDeliveryTime(ghnExpectedDelivery)
                        .build();

                int itemCount = rand.nextInt(3) + 1; // 1-3 items
                java.util.List<com.doan.WEB_TMDT.module.order.entity.OrderItem> items = new java.util.ArrayList<>();
                double subtotal = 0.0;
                // Map: product -> list of serial numbers to be exported for this order
                java.util.Map<com.doan.WEB_TMDT.module.product.entity.Product, java.util.List<String>> exportSerials = new java.util.HashMap<>();
                boolean isExported = status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED
                    || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING
                    || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP
                    || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.COMPLETED;
                boolean isReserved = status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.CONFIRMED;
                
                java.util.Collections.shuffle(products, rand);
                for (int j = 0; j < itemCount && j < products.size(); j++) {
                    com.doan.WEB_TMDT.module.product.entity.Product product = products.get(j);
                    int qty = rand.nextInt(3) + 1; // 1-3 qty
                    double price = product.getPrice() != null ? product.getPrice() : 100000.0;
                    double itemSubtotal = price * qty;
                    

                    // Update inventory_stock table
                    final com.doan.WEB_TMDT.module.product.entity.Product finalProduct = product;
                    inventoryStockRepository.findByProductId(product.getId()).ifPresent(stock -> {
                        if (isExported) {
                            // Find available IN_STOCK serials for this product
                            java.util.List<com.doan.WEB_TMDT.module.inventory.entity.ProductDetail> availableSerials =
                                productDetailRepository.findAllByWarehouseProduct_Id(
                                    finalProduct.getWarehouseProduct() != null ? finalProduct.getWarehouseProduct().getId() : -1L
                                ).stream()
                                .filter(pd -> pd.getStatus() == com.doan.WEB_TMDT.module.inventory.entity.ProductStatus.IN_STOCK)
                                .limit(qty)
                                .collect(java.util.stream.Collectors.toList());

                            int actualQty = availableSerials.size();
                            java.util.List<String> usedSerials = new java.util.ArrayList<>();

                            for (com.doan.WEB_TMDT.module.inventory.entity.ProductDetail pd : availableSerials) {
                                pd.setStatus(com.doan.WEB_TMDT.module.inventory.entity.ProductStatus.SOLD);
                                pd.setSoldDate(order.getCreatedAt().plusDays(1));
                                pd.setSoldOrderId(order.getId());
                                productDetailRepository.save(pd);
                                usedSerials.add(pd.getSerialNumber());
                            }

                            if (actualQty > 0) {
                                long newOnHand = Math.max(0L, (stock.getOnHand() != null ? stock.getOnHand() : 0L) - actualQty);
                                long newReserved = Math.max(0L, (stock.getReserved() != null ? stock.getReserved() : 0L) - actualQty);
                                stock.setOnHand(newOnHand);
                                stock.setReserved(newReserved);
                                inventoryStockRepository.save(stock);
                                // sync product
                                finalProduct.setStockQuantity(newOnHand);
                                finalProduct.setReservedQuantity(newReserved);
                                productRepository.save(finalProduct);

                                // Collect serials for ExportOrder creation after order save
                                exportSerials.put(finalProduct, usedSerials);
                            }
                        } else if (isReserved) {
                            stock.setReserved((stock.getReserved() != null ? stock.getReserved() : 0L) + qty);
                            Long currentReserved = finalProduct.getReservedQuantity() != null ? finalProduct.getReservedQuantity() : 0L;
                            finalProduct.setReservedQuantity(currentReserved + qty);
                            productRepository.save(finalProduct);
                            inventoryStockRepository.save(stock);
                        }
                    });

                    // Build order item – serialNumber filled after export
                    java.util.List<String> itemSerials = exportSerials.containsKey(product) ? exportSerials.get(product) : java.util.Collections.emptyList();
                    String firstSerial = (isExported && !itemSerials.isEmpty()) ? itemSerials.get(0) : null;

                    com.doan.WEB_TMDT.module.order.entity.OrderItem item = com.doan.WEB_TMDT.module.order.entity.OrderItem.builder()
                            .order(order)
                            .product(product)
                            .productName(product.getName())
                            .price(price)
                            .quantity(qty)
                            .subtotal(itemSubtotal)
                            .reserved(isReserved || isExported)
                            .exported(isExported)
                            .serialNumber(firstSerial)
                            .build();
                    
                    items.add(item);
                    subtotal += itemSubtotal;
                }
                
                order.setItems(items);
                order.setSubtotal(subtotal);
                order.setTotal(subtotal + order.getShippingFee() - order.getDiscount());
                
                final com.doan.WEB_TMDT.module.order.entity.Order savedOrder = orderRepository.save(order);

                // After order is saved, create ExportOrder for SHIPPING/DELIVERED orders
                if (isExported && !exportSerials.isEmpty()) {
                    java.util.List<com.doan.WEB_TMDT.module.inventory.entity.ExportOrderItem> exportItems = new java.util.ArrayList<>();
                    com.doan.WEB_TMDT.module.inventory.entity.ExportOrder exportOrder =
                        com.doan.WEB_TMDT.module.inventory.entity.ExportOrder.builder()
                            .exportCode("EX-SALE-" + System.currentTimeMillis() + rand.nextInt(1000))
                            .status(com.doan.WEB_TMDT.module.inventory.entity.ExportStatus.COMPLETED)
                            .reason("SALE")
                            .note("Xuất kho tự động cho đơn " + savedOrder.getOrderCode())
                            .createdBy("TEST_SYSTEM")
                            .exportDate(savedOrder.getCreatedAt().plusDays(1))
                            .orderId(savedOrder.getId())
                            .build();
                    for (java.util.Map.Entry<com.doan.WEB_TMDT.module.product.entity.Product, java.util.List<String>> entry : exportSerials.entrySet()) {
                        com.doan.WEB_TMDT.module.product.entity.Product p = entry.getKey();
                        java.util.List<String> serials = entry.getValue();
                        if (serials.isEmpty()) continue;
                        com.doan.WEB_TMDT.module.inventory.entity.ExportOrderItem ei =
                            com.doan.WEB_TMDT.module.inventory.entity.ExportOrderItem.builder()
                                .exportOrder(exportOrder)
                                .warehouseProduct(p.getWarehouseProduct())
                                .sku(p.getSku() != null ? p.getSku() : "SKU-" + p.getId())
                                .quantity((long) serials.size())
                                .serialNumbers(String.join(",", serials))
                                .totalCost(p.getPrice() != null ? p.getPrice() * serials.size() : 0.0)
                                .build();
                        exportItems.add(ei);
                    }
                    exportOrder.setItems(exportItems);
                    exportOrderRepository.save(exportOrder);
                }

                // Publish accounting events based on status
                if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED) {
                    eventPublisher.publishEvent(new com.doan.WEB_TMDT.module.accounting.listener.OrderStatusChangedEvent(this, savedOrder, com.doan.WEB_TMDT.module.order.entity.OrderStatus.PENDING_PAYMENT, com.doan.WEB_TMDT.module.order.entity.OrderStatus.CONFIRMED));
                    eventPublisher.publishEvent(new com.doan.WEB_TMDT.module.accounting.listener.OrderStatusChangedEvent(this, savedOrder, com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING, com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED));
                } else if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.CONFIRMED && paymentStatus == com.doan.WEB_TMDT.module.order.entity.PaymentStatus.PAID) {
                    eventPublisher.publishEvent(new com.doan.WEB_TMDT.module.accounting.listener.OrderStatusChangedEvent(this, savedOrder, com.doan.WEB_TMDT.module.order.entity.OrderStatus.PENDING_PAYMENT, com.doan.WEB_TMDT.module.order.entity.OrderStatus.CONFIRMED));
                }

                // Create Payment if PAID
                if (paymentStatus == com.doan.WEB_TMDT.module.order.entity.PaymentStatus.PAID) {
                    com.doan.WEB_TMDT.module.payment.entity.Payment payment = com.doan.WEB_TMDT.module.payment.entity.Payment.builder()
                            .paymentCode("PAY" + System.currentTimeMillis() + rand.nextInt(1000))
                            .order(savedOrder)
                            .user(customer.getUser())
                            .amount(savedOrder.getTotal())
                            .method("SEPAY".equals(savedOrder.getPaymentMethod()) ? com.doan.WEB_TMDT.module.payment.entity.PaymentMethod.SEPAY : com.doan.WEB_TMDT.module.payment.entity.PaymentMethod.COD)
                            .status(com.doan.WEB_TMDT.module.payment.entity.PaymentStatus.SUCCESS)
                            .createdAt(savedOrder.getCreatedAt())
                            .paidAt(savedOrder.getCreatedAt().plusDays(1))
                            .build();
                    payment = paymentRepository.save(payment);
                    savedOrder.setPaymentId(payment.getId());
                    orderRepository.save(savedOrder);
                }

                // Create Shipper Assignment if SHIPPING, READY_TO_SHIP, DELIVERED, or COMPLETED
                if ((status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING
                        || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP
                        || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED
                        || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.COMPLETED)
                        && !shippers.isEmpty()) {
                    com.doan.WEB_TMDT.module.auth.entity.Employee shipper = shippers.get(rand.nextInt(shippers.size()));
                    com.doan.WEB_TMDT.module.order.entity.ShipperAssignmentStatus saStatus;
                    if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.READY_TO_SHIP) {
                        saStatus = com.doan.WEB_TMDT.module.order.entity.ShipperAssignmentStatus.CLAIMED;
                    } else if (status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING) {
                        saStatus = com.doan.WEB_TMDT.module.order.entity.ShipperAssignmentStatus.DELIVERING;
                    } else {
                        saStatus = com.doan.WEB_TMDT.module.order.entity.ShipperAssignmentStatus.DELIVERED;
                    }
                    com.doan.WEB_TMDT.module.order.entity.ShipperAssignment sa = com.doan.WEB_TMDT.module.order.entity.ShipperAssignment.builder()
                            .order(savedOrder)
                            .shipper(shipper)
                            .assignedAt(savedOrder.getCreatedAt().plusHours(1))
                            .claimedAt(savedOrder.getCreatedAt().plusHours(2))
                            .deliveringAt(status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.SHIPPING
                                || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED
                                || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.COMPLETED
                                ? savedOrder.getCreatedAt().plusDays(1).plusHours(3) : null)
                            .deliveredAt(status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.DELIVERED
                                || status == com.doan.WEB_TMDT.module.order.entity.OrderStatus.COMPLETED
                                ? savedOrder.getCreatedAt().plusDays(2) : null)
                            .status(saStatus)
                            .build();
                    shipperAssignmentRepository.save(sa);
                }
                
                totalOrders++;
            }
        }
        
        return ApiResponse.success("Đã sinh thành công " + totalOrders + " đơn hàng test cho " + customers.size() + " khách hàng", null);
    }
}
