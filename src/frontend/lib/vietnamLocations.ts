// Dữ liệu tỉnh thành và quận huyện Việt Nam
export interface District {
  code: string
  name: string
}

export interface Province {
  code: string
  name: string
  districts: District[]
}

export const vietnamProvinces: Province[] = [
  {
    code: '01',
    name: 'Hà Nội',
    districts: [
      { code: '001', name: 'Ba Đình' },
      { code: '002', name: 'Hoàn Kiếm' },
      { code: '003', name: 'Tây Hồ' },
      { code: '004', name: 'Long Biên' },
      { code: '005', name: 'Cầu Giấy' },
      { code: '006', name: 'Đống Đa' },
      { code: '007', name: 'Hai Bà Trưng' },
      { code: '008', name: 'Hoàng Mai' },
      { code: '009', name: 'Thanh Xuân' },
      { code: '016', name: 'Sóc Sơn' },
      { code: '017', name: 'Đông Anh' },
      { code: '018', name: 'Gia Lâm' },
      { code: '019', name: 'Nam Từ Liêm' },
      { code: '020', name: 'Thanh Trì' },
      { code: '021', name: 'Bắc Từ Liêm' },
      { code: '250', name: 'Mê Linh' },
      { code: '268', name: 'Hà Đông' },
      { code: '269', name: 'Sơn Tây' },
      { code: '271', name: 'Ba Vì' },
      { code: '272', name: 'Phúc Thọ' },
      { code: '273', name: 'Đan Phượng' },
      { code: '274', name: 'Hoài Đức' },
      { code: '275', name: 'Quốc Oai' },
      { code: '276', name: 'Thạch Thất' },
      { code: '277', name: 'Chương Mỹ' },
      { code: '278', name: 'Thanh Oai' },
      { code: '279', name: 'Thường Tín' },
      { code: '280', name: 'Phú Xuyên' },
      { code: '281', name: 'Ứng Hòa' },
      { code: '282', name: 'Mỹ Đức' }
    ]
  },
  {
    code: '79',
    name: 'TP. Hồ Chí Minh',
    districts: [
      { code: '760', name: 'Quận 1' },
      { code: '761', name: 'Quận 12' },
      { code: '762', name: 'Quận Thủ Đức' },
      { code: '763', name: 'Quận 9' },
      { code: '764', name: 'Quận Gò Vấp' },
      { code: '765', name: 'Quận Bình Thạnh' },
      { code: '766', name: 'Quận Tân Bình' },
      { code: '767', name: 'Quận Tân Phú' },
      { code: '768', name: 'Quận Phú Nhuận' },
      { code: '769', name: 'Quận 2' },
      { code: '770', name: 'Quận 3' },
      { code: '771', name: 'Quận 10' },
      { code: '772', name: 'Quận 11' },
      { code: '773', name: 'Quận 4' },
      { code: '774', name: 'Quận 5' },
      { code: '775', name: 'Quận 6' },
      { code: '776', name: 'Quận 8' },
      { code: '777', name: 'Quận Bình Tân' },
      { code: '778', name: 'Quận 7' },
      { code: '783', name: 'Huyện Củ Chi' },
      { code: '784', name: 'Huyện Hóc Môn' },
      { code: '785', name: 'Huyện Bình Chánh' },
      { code: '786', name: 'Huyện Nhà Bè' },
      { code: '787', name: 'Huyện Cần Giờ' }
    ]
  },
  {
    code: '48',
    name: 'Đà Nẵng',
    districts: [
      { code: '490', name: 'Liên Chiểu' },
      { code: '491', name: 'Thanh Khê' },
      { code: '492', name: 'Hải Châu' },
      { code: '493', name: 'Sơn Trà' },
      { code: '494', name: 'Ngũ Hành Sơn' },
      { code: '495', name: 'Cẩm Lệ' },
      { code: '497', name: 'Hòa Vang' },
      { code: '498', name: 'Hoàng Sa' }
    ]
  },
  {
    code: '31',
    name: 'Hải Phòng',
    districts: [
      { code: '303', name: 'Hồng Bàng' },
      { code: '304', name: 'Ngô Quyền' },
      { code: '305', name: 'Lê Chân' },
      { code: '306', name: 'Hải An' },
      { code: '307', name: 'Kiến An' },
      { code: '308', name: 'Đồ Sơn' },
      { code: '309', name: 'Dương Kinh' },
      { code: '311', name: 'Thuỷ Nguyên' },
      { code: '312', name: 'An Dương' },
      { code: '313', name: 'An Lão' },
      { code: '314', name: 'Kiến Thuỵ' },
      { code: '315', name: 'Tiên Lãng' },
      { code: '316', name: 'Vĩnh Bảo' },
      { code: '317', name: 'Cát Hải' },
      { code: '318', name: 'Bạch Long Vĩ' }
    ]
  },
  {
    code: '92',
    name: 'Cần Thơ',
    districts: [
      { code: '916', name: 'Ninh Kiều' },
      { code: '917', name: 'Ô Môn' },
      { code: '918', name: 'Bình Thuỷ' },
      { code: '919', name: 'Cái Răng' },
      { code: '923', name: 'Thốt Nốt' },
      { code: '924', name: 'Vĩnh Thạnh' },
      { code: '925', name: 'Cờ Đỏ' },
      { code: '926', name: 'Phong Điền' },
      { code: '927', name: 'Thới Lai' }
    ]
  },
  {
    code: '02',
    name: 'Hà Giang',
    districts: [
      { code: '024', name: 'Hà Giang' },
      { code: '026', name: 'Đồng Văn' },
      { code: '027', name: 'Mèo Vạc' },
      { code: '028', name: 'Yên Minh' },
      { code: '029', name: 'Quản Bạ' },
      { code: '030', name: 'Vị Xuyên' },
      { code: '031', name: 'Bắc Mê' },
      { code: '032', name: 'Hoàng Su Phì' },
      { code: '033', name: 'Xín Mần' },
      { code: '034', name: 'Bắc Quang' },
      { code: '035', name: 'Quang Bình' }
    ]
  },
  {
    code: '04',
    name: 'Cao Bằng',
    districts: [
      { code: '040', name: 'Cao Bằng' },
      { code: '042', name: 'Bảo Lâm' },
      { code: '043', name: 'Bảo Lạc' },
      { code: '045', name: 'Hà Quảng' },
      { code: '047', name: 'Trùng Khánh' },
      { code: '048', name: 'Hạ Lang' },
      { code: '049', name: 'Quảng Uyên' },
      { code: '051', name: 'Phục Hoà' },
      { code: '052', name: 'Hoà An' },
      { code: '053', name: 'Nguyên Bình' },
      { code: '054', name: 'Thạch An' }
    ]
  },
  {
    code: '06',
    name: 'Bắc Kạn',
    districts: [
      { code: '058', name: 'Bắc Kạn' },
      { code: '060', name: 'Pác Nặm' },
      { code: '061', name: 'Ba Bể' },
      { code: '062', name: 'Ngân Sơn' },
      { code: '063', name: 'Bạch Thông' },
      { code: '064', name: 'Chợ Đồn' },
      { code: '065', name: 'Chợ Mới' },
      { code: '066', name: 'Na Rì' }
    ]
  },
  {
    code: '08',
    name: 'Tuyên Quang',
    districts: [
      { code: '070', name: 'Tuyên Quang' },
      { code: '071', name: 'Lâm Bình' },
      { code: '072', name: 'Na Hang' },
      { code: '073', name: 'Chiêm Hóa' },
      { code: '074', name: 'Hàm Yên' },
      { code: '075', name: 'Yên Sơn' },
      { code: '076', name: 'Sơn Dương' }
    ]
  },
  {
    code: '10',
    name: 'Lào Cai',
    districts: [
      { code: '080', name: 'Lào Cai' },
      { code: '082', name: 'Bát Xát' },
      { code: '083', name: 'Mường Khương' },
      { code: '084', name: 'Si Ma Cai' },
      { code: '085', name: 'Bắc Hà' },
      { code: '086', name: 'Bảo Thắng' },
      { code: '087', name: 'Bảo Yên' },
      { code: '088', name: 'Sa Pa' },
      { code: '089', name: 'Văn Bàn' }
    ]
  },
  {
    code: '11',
    name: 'Điện Biên',
    districts: [
      { code: '094', name: 'Điện Biên Phủ' },
      { code: '095', name: 'Mường Lay' },
      { code: '096', name: 'Mường Nhé' },
      { code: '097', name: 'Mường Chà' },
      { code: '098', name: 'Tủa Chùa' },
      { code: '099', name: 'Tuần Giáo' },
      { code: '100', name: 'Điện Biên' },
      { code: '101', name: 'Điện Biên Đông' },
      { code: '102', name: 'Mường Ảng' },
      { code: '103', name: 'Nậm Pồ' }
    ]
  },
  {
    code: '12',
    name: 'Lai Châu',
    districts: [
      { code: '105', name: 'Lai Châu' },
      { code: '106', name: 'Tam Đường' },
      { code: '107', name: 'Mường Tè' },
      { code: '108', name: 'Sìn Hồ' },
      { code: '109', name: 'Phong Thổ' },
      { code: '110', name: 'Than Uyên' },
      { code: '111', name: 'Tân Uyên' },
      { code: '112', name: 'Nậm Nhùn' }
    ]
  },
  {
    code: '14',
    name: 'Sơn La',
    districts: [
      { code: '116', name: 'Sơn La' },
      { code: '118', name: 'Quỳnh Nhai' },
      { code: '119', name: 'Thuận Châu' },
      { code: '120', name: 'Mường La' },
      { code: '121', name: 'Bắc Yên' },
      { code: '122', name: 'Phù Yên' },
      { code: '123', name: 'Mộc Châu' },
      { code: '124', name: 'Yên Châu' },
      { code: '125', name: 'Mai Sơn' },
      { code: '126', name: 'Sông Mã' },
      { code: '127', name: 'Sốp Cộp' },
      { code: '128', name: 'Vân Hồ' }
    ]
  },
  {
    code: '15',
    name: 'Yên Bái',
    districts: [
      { code: '132', name: 'Yên Bái' },
      { code: '133', name: 'Nghĩa Lộ' },
      { code: '135', name: 'Lục Yên' },
      { code: '136', name: 'Văn Yên' },
      { code: '137', name: 'Mù Căng Chải' },
      { code: '138', name: 'Trấn Yên' },
      { code: '139', name: 'Trạm Tấu' },
      { code: '140', name: 'Văn Chấn' },
      { code: '141', name: 'Yên Bình' }
    ]
  },
  {
    code: '17',
    name: 'Hoà Bình',
    districts: [
      { code: '148', name: 'Hòa Bình' },
      { code: '150', name: 'Đà Bắc' },
      { code: '152', name: 'Lương Sơn' },
      { code: '153', name: 'Kim Bôi' },
      { code: '154', name: 'Cao Phong' },
      { code: '155', name: 'Tân Lạc' },
      { code: '156', name: 'Mai Châu' },
      { code: '157', name: 'Lạc Sơn' },
      { code: '158', name: 'Yên Thủy' },
      { code: '159', name: 'Lạc Thủy' }
    ]
  },
  {
    code: '19',
    name: 'Thái Nguyên',
    districts: [
      { code: '164', name: 'Thái Nguyên' },
      { code: '165', name: 'Sông Công' },
      { code: '167', name: 'Định Hóa' },
      { code: '168', name: 'Phú Lương' },
      { code: '169', name: 'Đồng Hỷ' },
      { code: '170', name: 'Võ Nhai' },
      { code: '171', name: 'Đại Từ' },
      { code: '172', name: 'Phổ Yên' },
      { code: '173', name: 'Phú Bình' }
    ]
  },
  {
    code: '20',
    name: 'Lạng Sơn',
    districts: [
      { code: '178', name: 'Lạng Sơn' },
      { code: '180', name: 'Tràng Định' },
      { code: '181', name: 'Bình Gia' },
      { code: '182', name: 'Văn Lãng' },
      { code: '183', name: 'Cao Lộc' },
      { code: '184', name: 'Văn Quan' },
      { code: '185', name: 'Bắc Sơn' },
      { code: '186', name: 'Hữu Lũng' },
      { code: '187', name: 'Chi Lăng' },
      { code: '188', name: 'Lộc Bình' },
      { code: '189', name: 'Đình Lập' }
    ]
  },
  {
    code: '22',
    name: 'Quảng Ninh',
    districts: [
      { code: '193', name: 'Hạ Long' },
      { code: '194', name: 'Móng Cái' },
      { code: '195', name: 'Cẩm Phả' },
      { code: '196', name: 'Uông Bí' },
      { code: '198', name: 'Bình Liêu' },
      { code: '199', name: 'Tiên Yên' },
      { code: '200', name: 'Đầm Hà' },
      { code: '201', name: 'Hải Hà' },
      { code: '202', name: 'Ba Chẽ' },
      { code: '203', name: 'Vân Đồn' },
      { code: '205', name: 'Đông Triều' },
      { code: '206', name: 'Quảng Yên' },
      { code: '207', name: 'Cô Tô' }
    ]
  },
  {
    code: '24',
    name: 'Bắc Giang',
    districts: [
      { code: '213', name: 'Bắc Giang' },
      { code: '215', name: 'Yên Thế' },
      { code: '216', name: 'Tân Yên' },
      { code: '217', name: 'Lạng Giang' },
      { code: '218', name: 'Lục Nam' },
      { code: '219', name: 'Lục Ngạn' },
      { code: '220', name: 'Sơn Động' },
      { code: '221', name: 'Yên Dũng' },
      { code: '222', name: 'Việt Yên' },
      { code: '223', name: 'Hiệp Hòa' }
    ]
  },
  {
    code: '25',
    name: 'Phú Thọ',
    districts: [
      { code: '227', name: 'Việt Trì' },
      { code: '228', name: 'Phú Thọ' },
      { code: '230', name: 'Đoan Hùng' },
      { code: '231', name: 'Hạ Hoà' },
      { code: '232', name: 'Thanh Ba' },
      { code: '233', name: 'Phù Ninh' },
      { code: '234', name: 'Yên Lập' },
      { code: '235', name: 'Cẩm Khê' },
      { code: '236', name: 'Tam Nông' },
      { code: '237', name: 'Lâm Thao' },
      { code: '238', name: 'Thanh Sơn' },
      { code: '239', name: 'Thanh Thuỷ' },
      { code: '240', name: 'Tân Sơn' }
    ]
  },
  {
    code: '26',
    name: 'Vĩnh Phúc',
    districts: [
      { code: '243', name: 'Vĩnh Yên' },
      { code: '244', name: 'Phúc Yên' },
      { code: '246', name: 'Lập Thạch' },
      { code: '247', name: 'Tam Dương' },
      { code: '248', name: 'Tam Đảo' },
      { code: '249', name: 'Bình Xuyên' },
      { code: '251', name: 'Yên Lạc' },
      { code: '252', name: 'Vĩnh Tường' },
      { code: '253', name: 'Sông Lô' }
    ]
  },
  {
    code: '27',
    name: 'Bắc Ninh',
    districts: [
      { code: '256', name: 'Bắc Ninh' },
      { code: '258', name: 'Yên Phong' },
      { code: '259', name: 'Quế Võ' },
      { code: '260', name: 'Tiên Du' },
      { code: '261', name: 'Từ Sơn' },
      { code: '262', name: 'Thuận Thành' },
      { code: '263', name: 'Gia Bình' },
      { code: '264', name: 'Lương Tài' }
    ]
  },
  {
    code: '30',
    name: 'Hải Dương',
    districts: [
      { code: '288', name: 'Hải Dương' },
      { code: '290', name: 'Chí Linh' },
      { code: '291', name: 'Nam Sách' },
      { code: '292', name: 'Kinh Môn' },
      { code: '293', name: 'Kim Thành' },
      { code: '294', name: 'Thanh Hà' },
      { code: '295', name: 'Cẩm Giàng' },
      { code: '296', name: 'Bình Giang' },
      { code: '297', name: 'Gia Lộc' },
      { code: '298', name: 'Tứ Kỳ' },
      { code: '299', name: 'Ninh Giang' },
      { code: '300', name: 'Thanh Miện' }
    ]
  },
  {
    code: '33',
    name: 'Hưng Yên',
    districts: [
      { code: '323', name: 'Hưng Yên' },
      { code: '325', name: 'Văn Lâm' },
      { code: '326', name: 'Văn Giang' },
      { code: '327', name: 'Yên Mỹ' },
      { code: '328', name: 'Mỹ Hào' },
      { code: '329', name: 'Ân Thi' },
      { code: '330', name: 'Khoái Châu' },
      { code: '331', name: 'Kim Động' },
      { code: '332', name: 'Tiên Lữ' },
      { code: '333', name: 'Phù Cừ' }
    ]
  },
  {
    code: '34',
    name: 'Thái Bình',
    districts: [
      { code: '336', name: 'Thái Bình' },
      { code: '338', name: 'Quỳnh Phụ' },
      { code: '339', name: 'Hưng Hà' },
      { code: '340', name: 'Đông Hưng' },
      { code: '341', name: 'Thái Thụy' },
      { code: '342', name: 'Tiền Hải' },
      { code: '343', name: 'Kiến Xương' },
      { code: '344', name: 'Vũ Thư' }
    ]
  },
  {
    code: '35',
    name: 'Hà Nam',
    districts: [
      { code: '347', name: 'Phủ Lý' },
      { code: '349', name: 'Duy Tiên' },
      { code: '350', name: 'Kim Bảng' },
      { code: '351', name: 'Thanh Liêm' },
      { code: '352', name: 'Bình Lục' },
      { code: '353', name: 'Lý Nhân' }
    ]
  },
  {
    code: '36',
    name: 'Nam Định',
    districts: [
      { code: '356', name: 'Nam Định' },
      { code: '358', name: 'Mỹ Lộc' },
      { code: '359', name: 'Vụ Bản' },
      { code: '360', name: 'Ý Yên' },
      { code: '361', name: 'Nghĩa Hưng' },
      { code: '362', name: 'Nam Trực' },
      { code: '363', name: 'Trực Ninh' },
      { code: '364', name: 'Xuân Trường' },
      { code: '365', name: 'Giao Thủy' },
      { code: '366', name: 'Hải Hậu' }
    ]
  },
  {
    code: '37',
    name: 'Ninh Bình',
    districts: [
      { code: '369', name: 'Ninh Bình' },
      { code: '370', name: 'Tam Điệp' },
      { code: '372', name: 'Nho Quan' },
      { code: '373', name: 'Gia Viễn' },
      { code: '374', name: 'Hoa Lư' },
      { code: '375', name: 'Yên Khánh' },
      { code: '376', name: 'Kim Sơn' },
      { code: '377', name: 'Yên Mô' }
    ]
  },
  {
    code: '38',
    name: 'Thanh Hóa',
    districts: [
      { code: '380', name: 'Thanh Hóa' },
      { code: '381', name: 'Bỉm Sơn' },
      { code: '382', name: 'Sầm Sơn' },
      { code: '384', name: 'Mường Lát' },
      { code: '385', name: 'Quan Hóa' },
      { code: '386', name: 'Bá Thước' },
      { code: '387', name: 'Quan Sơn' },
      { code: '388', name: 'Lang Chánh' },
      { code: '389', name: 'Ngọc Lặc' },
      { code: '390', name: 'Cẩm Thủy' },
      { code: '391', name: 'Thạch Thành' },
      { code: '392', name: 'Hà Trung' },
      { code: '393', name: 'Vĩnh Lộc' },
      { code: '394', name: 'Yên Định' },
      { code: '395', name: 'Thọ Xuân' },
      { code: '396', name: 'Thường Xuân' },
      { code: '397', name: 'Triệu Sơn' },
      { code: '398', name: 'Thiệu Hóa' },
      { code: '399', name: 'Hoằng Hóa' },
      { code: '400', name: 'Hậu Lộc' },
      { code: '401', name: 'Nga Sơn' },
      { code: '402', name: 'Như Xuân' },
      { code: '403', name: 'Như Thanh' },
      { code: '404', name: 'Nông Cống' },
      { code: '405', name: 'Đông Sơn' },
      { code: '406', name: 'Quảng Xương' },
      { code: '407', name: 'Tĩnh Gia' }
    ]
  },
  {
    code: '40',
    name: 'Nghệ An',
    districts: [
      { code: '412', name: 'Vinh' },
      { code: '413', name: 'Cửa Lò' },
      { code: '414', name: 'Thái Hoà' },
      { code: '415', name: 'Quế Phong' },
      { code: '416', name: 'Quỳ Châu' },
      { code: '417', name: 'Kỳ Sơn' },
      { code: '418', name: 'Tương Dương' },
      { code: '419', name: 'Nghĩa Đàn' },
      { code: '420', name: 'Quỳ Hợp' },
      { code: '421', name: 'Quỳnh Lưu' },
      { code: '422', name: 'Con Cuông' },
      { code: '423', name: 'Tân Kỳ' },
      { code: '424', name: 'Anh Sơn' },
      { code: '425', name: 'Diễn Châu' },
      { code: '426', name: 'Yên Thành' },
      { code: '427', name: 'Đô Lương' },
      { code: '428', name: 'Thanh Chương' },
      { code: '429', name: 'Nghi Lộc' },
      { code: '430', name: 'Nam Đàn' },
      { code: '431', name: 'Hưng Nguyên' },
      { code: '432', name: 'Hoàng Mai' }
    ]
  },
  {
    code: '42',
    name: 'Hà Tĩnh',
    districts: [
      { code: '436', name: 'Hà Tĩnh' },
      { code: '437', name: 'Hồng Lĩnh' },
      { code: '439', name: 'Hương Sơn' },
      { code: '440', name: 'Đức Thọ' },
      { code: '441', name: 'Vũ Quang' },
      { code: '442', name: 'Nghi Xuân' },
      { code: '443', name: 'Can Lộc' },
      { code: '444', name: 'Hương Khê' },
      { code: '445', name: 'Thạch Hà' },
      { code: '446', name: 'Cẩm Xuyên' },
      { code: '447', name: 'Kỳ Anh' },
      { code: '448', name: 'Lộc Hà' }
    ]
  },
  {
    code: '44',
    name: 'Quảng Bình',
    districts: [
      { code: '450', name: 'Đồng Hới' },
      { code: '452', name: 'Minh Hóa' },
      { code: '453', name: 'Tuyên Hóa' },
      { code: '454', name: 'Quảng Trạch' },
      { code: '455', name: 'Bố Trạch' },
      { code: '456', name: 'Quảng Ninh' },
      { code: '457', name: 'Lệ Thủy' },
      { code: '458', name: 'Ba Đồn' }
    ]
  },
  {
    code: '45',
    name: 'Quảng Trị',
    districts: [
      { code: '461', name: 'Đông Hà' },
      { code: '462', name: 'Quảng Trị' },
      { code: '464', name: 'Vĩnh Linh' },
      { code: '465', name: 'Hướng Hóa' },
      { code: '466', name: 'Gio Linh' },
      { code: '467', name: 'Đa Krông' },
      { code: '468', name: 'Cam Lộ' },
      { code: '469', name: 'Triệu Phong' },
      { code: '470', name: 'Hải Lăng' },
      { code: '471', name: 'Cồn Cỏ' }
    ]
  },
  {
    code: '46',
    name: 'Thừa Thiên Huế',
    districts: [
      { code: '474', name: 'Huế' },
      { code: '476', name: 'Phong Điền' },
      { code: '477', name: 'Quảng Điền' },
      { code: '478', name: 'Phú Vang' },
      { code: '479', name: 'Hương Thủy' },
      { code: '480', name: 'Hương Trà' },
      { code: '481', name: 'A Lưới' },
      { code: '482', name: 'Phú Lộc' },
      { code: '483', name: 'Nam Đông' }
    ]
  },
  {
    code: '49',
    name: 'Quảng Nam',
    districts: [
      { code: '502', name: 'Tam Kỳ' },
      { code: '503', name: 'Hội An' },
      { code: '504', name: 'Tây Giang' },
      { code: '505', name: 'Đông Giang' },
      { code: '506', name: 'Đại Lộc' },
      { code: '507', name: 'Điện Bàn' },
      { code: '508', name: 'Duy Xuyên' },
      { code: '509', name: 'Quế Sơn' },
      { code: '510', name: 'Nam Giang' },
      { code: '511', name: 'Phước Sơn' },
      { code: '512', name: 'Hiệp Đức' },
      { code: '513', name: 'Thăng Bình' },
      { code: '514', name: 'Tiên Phước' },
      { code: '515', name: 'Bắc Trà My' },
      { code: '516', name: 'Nam Trà My' },
      { code: '517', name: 'Núi Thành' },
      { code: '518', name: 'Phú Ninh' },
      { code: '519', name: 'Nông Sơn' }
    ]
  },
  {
    code: '51',
    name: 'Quảng Ngãi',
    districts: [
      { code: '522', name: 'Quảng Ngãi' },
      { code: '524', name: 'Bình Sơn' },
      { code: '525', name: 'Trà Bồng' },
      { code: '527', name: 'Sơn Tịnh' },
      { code: '528', name: 'Tư Nghĩa' },
      { code: '529', name: 'Sơn Hà' },
      { code: '530', name: 'Sơn Tây' },
      { code: '531', name: 'Minh Long' },
      { code: '532', name: 'Nghĩa Hành' },
      { code: '533', name: 'Mộ Đức' },
      { code: '534', name: 'Đức Phổ' },
      { code: '535', name: 'Ba Tơ' },
      { code: '536', name: 'Lý Sơn' }
    ]
  },
  {
    code: '52',
    name: 'Bình Định',
    districts: [
      { code: '540', name: 'Quy Nhơn' },
      { code: '542', name: 'An Lão' },
      { code: '543', name: 'Hoài Nhơn' },
      { code: '544', name: 'Hoài Ân' },
      { code: '545', name: 'Phù Mỹ' },
      { code: '546', name: 'Vĩnh Thạnh' },
      { code: '547', name: 'Tây Sơn' },
      { code: '548', name: 'Phù Cát' },
      { code: '549', name: 'An Nhơn' },
      { code: '550', name: 'Tuy Phước' },
      { code: '551', name: 'Vân Canh' }
    ]
  },
  {
    code: '54',
    name: 'Phú Yên',
    districts: [
      { code: '555', name: 'Tuy Hoà' },
      { code: '557', name: 'Sông Cầu' },
      { code: '558', name: 'Đồng Xuân' },
      { code: '559', name: 'Tuy An' },
      { code: '560', name: 'Sơn Hòa' },
      { code: '561', name: 'Sông Hinh' },
      { code: '562', name: 'Tây Hoà' },
      { code: '563', name: 'Phú Hoà' },
      { code: '564', name: 'Đông Hòa' }
    ]
  },
  {
    code: '56',
    name: 'Khánh Hòa',
    districts: [
      { code: '568', name: 'Nha Trang' },
      { code: '569', name: 'Cam Ranh' },
      { code: '570', name: 'Cam Lâm' },
      { code: '571', name: 'Vạn Ninh' },
      { code: '572', name: 'Ninh Hòa' },
      { code: '573', name: 'Khánh Vĩnh' },
      { code: '574', name: 'Diên Khánh' },
      { code: '575', name: 'Khánh Sơn' },
      { code: '576', name: 'Trường Sa' }
    ]
  },
  {
    code: '58',
    name: 'Ninh Thuận',
    districts: [
      { code: '582', name: 'Phan Rang-Tháp Chàm' },
      { code: '584', name: 'Bác Ái' },
      { code: '585', name: 'Ninh Sơn' },
      { code: '586', name: 'Ninh Hải' },
      { code: '587', name: 'Ninh Phước' },
      { code: '588', name: 'Thuận Bắc' },
      { code: '589', name: 'Thuận Nam' }
    ]
  },
  {
    code: '60',
    name: 'Bình Thuận',
    districts: [
      { code: '593', name: 'Phan Thiết' },
      { code: '594', name: 'La Gi' },
      { code: '595', name: 'Tuy Phong' },
      { code: '596', name: 'Bắc Bình' },
      { code: '597', name: 'Hàm Thuận Bắc' },
      { code: '598', name: 'Hàm Thuận Nam' },
      { code: '599', name: 'Tánh Linh' },
      { code: '600', name: 'Đức Linh' },
      { code: '601', name: 'Hàm Tân' },
      { code: '602', name: 'Phú Quý' }
    ]
  },
  {
    code: '62',
    name: 'Kon Tum',
    districts: [
      { code: '608', name: 'Kon Tum' },
      { code: '610', name: 'Đắk Glei' },
      { code: '611', name: 'Ngọc Hồi' },
      { code: '612', name: 'Đắk Tô' },
      { code: '613', name: 'Kon Plông' },
      { code: '614', name: 'Kon Rẫy' },
      { code: '615', name: 'Đắk Hà' },
      { code: '616', name: 'Sa Thầy' },
      { code: '617', name: 'Tu Mơ Rông' },
      { code: '618', name: 'Ia H Drai' }
    ]
  },
  {
    code: '64',
    name: 'Gia Lai',
    districts: [
      { code: '622', name: 'Pleiku' },
      { code: '623', name: 'An Khê' },
      { code: '624', name: 'Ayun Pa' },
      { code: '625', name: 'KBang' },
      { code: '626', name: 'Đăk Đoa' },
      { code: '627', name: 'Chư Păh' },
      { code: '628', name: 'Ia Grai' },
      { code: '629', name: 'Mang Yang' },
      { code: '630', name: 'Kông Chro' },
      { code: '631', name: 'Đức Cơ' },
      { code: '632', name: 'Chư Prông' },
      { code: '633', name: 'Chư Sê' },
      { code: '634', name: 'Đăk Pơ' },
      { code: '635', name: 'Ia Pa' },
      { code: '637', name: 'Krông Pa' },
      { code: '638', name: 'Phú Thiện' },
      { code: '639', name: 'Chư Pưh' }
    ]
  },
  {
    code: '66',
    name: 'Đắk Lắk',
    districts: [
      { code: '643', name: 'Buôn Ma Thuột' },
      { code: '644', name: 'Buôn Hồ' },
      { code: '645', name: 'Ea H\'leo' },
      { code: '646', name: 'Ea Súp' },
      { code: '647', name: 'Buôn Đôn' },
      { code: '648', name: 'Cư M\'gar' },
      { code: '649', name: 'Krông Búk' },
      { code: '650', name: 'Krông Năng' },
      { code: '651', name: 'Ea Kar' },
      { code: '652', name: 'M\'Đrắk' },
      { code: '653', name: 'Krông Bông' },
      { code: '654', name: 'Krông Pắc' },
      { code: '655', name: 'Krông A Na' },
      { code: '656', name: 'Lắk' },
      { code: '657', name: 'Cư Kuin' }
    ]
  },
  {
    code: '67',
    name: 'Đắk Nông',
    districts: [
      { code: '660', name: 'Gia Nghĩa' },
      { code: '661', name: 'Đăk Glong' },
      { code: '662', name: 'Cư Jút' },
      { code: '663', name: 'Đắk Mil' },
      { code: '664', name: 'Krông Nô' },
      { code: '665', name: 'Đắk Song' },
      { code: '666', name: 'Đắk R\'Lấp' },
      { code: '667', name: 'Tuy Đức' }
    ]
  },
  {
    code: '68',
    name: 'Lâm Đồng',
    districts: [
      { code: '672', name: 'Đà Lạt' },
      { code: '673', name: 'Bảo Lộc' },
      { code: '674', name: 'Đam Rông' },
      { code: '675', name: 'Lạc Dương' },
      { code: '676', name: 'Lâm Hà' },
      { code: '677', name: 'Đơn Dương' },
      { code: '678', name: 'Đức Trọng' },
      { code: '679', name: 'Di Linh' },
      { code: '680', name: 'Bảo Lâm' },
      { code: '681', name: 'Đạ Huoai' },
      { code: '682', name: 'Đạ Tẻh' },
      { code: '683', name: 'Cát Tiên' }
    ]
  },
  {
    code: '70',
    name: 'Bình Phước',
    districts: [
      { code: '688', name: 'Đồng Xoài' },
      { code: '689', name: 'Bình Long' },
      { code: '690', name: 'Phước Long' },
      { code: '691', name: 'Bù Gia Mập' },
      { code: '692', name: 'Lộc Ninh' },
      { code: '693', name: 'Bù Đốp' },
      { code: '694', name: 'Hớn Quản' },
      { code: '695', name: 'Đồng Phú' },
      { code: '696', name: 'Bù Đăng' },
      { code: '697', name: 'Chơn Thành' },
      { code: '698', name: 'Phú Riềng' }
    ]
  },
  {
    code: '72',
    name: 'Tây Ninh',
    districts: [
      { code: '703', name: 'Tây Ninh' },
      { code: '705', name: 'Tân Biên' },
      { code: '706', name: 'Tân Châu' },
      { code: '707', name: 'Dương Minh Châu' },
      { code: '708', name: 'Châu Thành' },
      { code: '709', name: 'Hòa Thành' },
      { code: '710', name: 'Gò Dầu' },
      { code: '711', name: 'Bến Cầu' },
      { code: '712', name: 'Trảng Bàng' }
    ]
  },
  {
    code: '74',
    name: 'Bình Dương',
    districts: [
      { code: '718', name: 'Thủ Dầu Một' },
      { code: '719', name: 'Bến Cát' },
      { code: '720', name: 'Tân Uyên' },
      { code: '721', name: 'Dầu Tiếng' },
      { code: '722', name: 'Phú Giáo' },
      { code: '723', name: 'Bàu Bàng' },
      { code: '724', name: 'Bắc Tân Uyên' },
      { code: '725', name: 'Dĩ An' },
      { code: '726', name: 'Thuận An' }
    ]
  },
  {
    code: '75',
    name: 'Đồng Nai',
    districts: [
      { code: '731', name: 'Biên Hòa' },
      { code: '732', name: 'Long Khánh' },
      { code: '734', name: 'Tân Phú' },
      { code: '735', name: 'Vĩnh Cửu' },
      { code: '736', name: 'Định Quán' },
      { code: '737', name: 'Trảng Bom' },
      { code: '738', name: 'Thống Nhất' },
      { code: '739', name: 'Cẩm Mỹ' },
      { code: '740', name: 'Long Thành' },
      { code: '741', name: 'Xuân Lộc' },
      { code: '742', name: 'Nhơn Trạch' }
    ]
  },
  {
    code: '77',
    name: 'Bà Rịa - Vũng Tàu',
    districts: [
      { code: '747', name: 'Vũng Tàu' },
      { code: '748', name: 'Bà Rịa' },
      { code: '750', name: 'Châu Đức' },
      { code: '751', name: 'Xuyên Mộc' },
      { code: '752', name: 'Long Điền' },
      { code: '753', name: 'Đất Đỏ' },
      { code: '754', name: 'Tân Thành' },
      { code: '755', name: 'Côn Đảo' }
    ]
  },
  {
    code: '80',
    name: 'Long An',
    districts: [
      { code: '794', name: 'Tân An' },
      { code: '795', name: 'Kiến Tường' },
      { code: '796', name: 'Tân Hưng' },
      { code: '797', name: 'Vĩnh Hưng' },
      { code: '798', name: 'Mộc Hóa' },
      { code: '799', name: 'Tân Thạnh' },
      { code: '800', name: 'Thạnh Hóa' },
      { code: '801', name: 'Đức Huệ' },
      { code: '802', name: 'Đức Hòa' },
      { code: '803', name: 'Bến Lức' },
      { code: '804', name: 'Thủ Thừa' },
      { code: '805', name: 'Tân Trụ' },
      { code: '806', name: 'Cần Đước' },
      { code: '807', name: 'Cần Giuộc' },
      { code: '808', name: 'Châu Thành' }
    ]
  },
  {
    code: '82',
    name: 'Tiền Giang',
    districts: [
      { code: '815', name: 'Mỹ Tho' },
      { code: '816', name: 'Gò Công' },
      { code: '817', name: 'Cai Lậy' },
      { code: '818', name: 'Tân Phước' },
      { code: '819', name: 'Cái Bè' },
      { code: '820', name: 'Châu Thành' },
      { code: '821', name: 'Chợ Gạo' },
      { code: '822', name: 'Gò Công Tây' },
      { code: '823', name: 'Gò Công Đông' },
      { code: '824', name: 'Tân Phú Đông' }
    ]
  },
  {
    code: '83',
    name: 'Bến Tre',
    districts: [
      { code: '829', name: 'Bến Tre' },
      { code: '831', name: 'Châu Thành' },
      { code: '832', name: 'Chợ Lách' },
      { code: '833', name: 'Mỏ Cày Nam' },
      { code: '834', name: 'Giồng Trôm' },
      { code: '835', name: 'Bình Đại' },
      { code: '836', name: 'Ba Tri' },
      { code: '837', name: 'Thạnh Phú' },
      { code: '838', name: 'Mỏ Cày Bắc' }
    ]
  },
  {
    code: '84',
    name: 'Trà Vinh',
    districts: [
      { code: '842', name: 'Trà Vinh' },
      { code: '844', name: 'Càng Long' },
      { code: '845', name: 'Cầu Kè' },
      { code: '846', name: 'Tiểu Cần' },
      { code: '847', name: 'Châu Thành' },
      { code: '848', name: 'Cầu Ngang' },
      { code: '849', name: 'Trà Cú' },
      { code: '850', name: 'Duyên Hải' },
      { code: '851', name: 'Duyên Hải' }
    ]
  },
  {
    code: '86',
    name: 'Vĩnh Long',
    districts: [
      { code: '855', name: 'Vĩnh Long' },
      { code: '857', name: 'Long Hồ' },
      { code: '858', name: 'Mang Thít' },
      { code: '859', name: 'Vũng Liêm' },
      { code: '860', name: 'Tam Bình' },
      { code: '861', name: 'Trà Ôn' },
      { code: '862', name: 'Bình Minh' },
      { code: '863', name: 'Bình Tân' }
    ]
  },
  {
    code: '87',
    name: 'Đồng Tháp',
    districts: [
      { code: '866', name: 'Cao Lãnh' },
      { code: '867', name: 'Sa Đéc' },
      { code: '868', name: 'Hồng Ngự' },
      { code: '869', name: 'Tân Hồng' },
      { code: '870', name: 'Hồng Ngự' },
      { code: '871', name: 'Tam Nông' },
      { code: '872', name: 'Tháp Mười' },
      { code: '873', name: 'Cao Lãnh' },
      { code: '874', name: 'Thanh Bình' },
      { code: '875', name: 'Lấp Vò' },
      { code: '876', name: 'Lai Vung' },
      { code: '877', name: 'Châu Thành' }
    ]
  },
  {
    code: '89',
    name: 'An Giang',
    districts: [
      { code: '883', name: 'Long Xuyên' },
      { code: '884', name: 'Châu Đốc' },
      { code: '886', name: 'An Phú' },
      { code: '887', name: 'Tân Châu' },
      { code: '888', name: 'Phú Tân' },
      { code: '889', name: 'Châu Phú' },
      { code: '890', name: 'Tịnh Biên' },
      { code: '891', name: 'Tri Tôn' },
      { code: '892', name: 'Châu Thành' },
      { code: '893', name: 'Chợ Mới' },
      { code: '894', name: 'Thoại Sơn' }
    ]
  },
  {
    code: '91',
    name: 'Kiên Giang',
    districts: [
      { code: '899', name: 'Rạch Giá' },
      { code: '900', name: 'Hà Tiên' },
      { code: '902', name: 'Kiên Lương' },
      { code: '903', name: 'Hòn Đất' },
      { code: '904', name: 'Tân Hiệp' },
      { code: '905', name: 'Châu Thành' },
      { code: '906', name: 'Giồng Riềng' },
      { code: '907', name: 'Gò Quao' },
      { code: '908', name: 'An Biên' },
      { code: '909', name: 'An Minh' },
      { code: '910', name: 'Vĩnh Thuận' },
      { code: '911', name: 'Phú Quốc' },
      { code: '912', name: 'Kiên Hải' },
      { code: '913', name: 'U Minh Thượng' },
      { code: '914', name: 'Giang Thành' }
    ]
  },
  {
    code: '93',
    name: 'Hậu Giang',
    districts: [
      { code: '930', name: 'Vị Thanh' },
      { code: '931', name: 'Ngã Bảy' },
      { code: '932', name: 'Châu Thành A' },
      { code: '933', name: 'Châu Thành' },
      { code: '934', name: 'Phụng Hiệp' },
      { code: '935', name: 'Vị Thuỷ' },
      { code: '936', name: 'Long Mỹ' },
      { code: '937', name: 'Long Mỹ' }
    ]
  },
  {
    code: '94',
    name: 'Sóc Trăng',
    districts: [
      { code: '941', name: 'Sóc Trăng' },
      { code: '942', name: 'Châu Thành' },
      { code: '943', name: 'Kế Sách' },
      { code: '944', name: 'Mỹ Tú' },
      { code: '945', name: 'Cù Lao Dung' },
      { code: '946', name: 'Long Phú' },
      { code: '947', name: 'Mỹ Xuyên' },
      { code: '948', name: 'Ngã Năm' },
      { code: '949', name: 'Thạnh Trị' },
      { code: '950', name: 'Vĩnh Châu' },
      { code: '951', name: 'Trần Đề' }
    ]
  },
  {
    code: '95',
    name: 'Bạc Liêu',
    districts: [
      { code: '954', name: 'Bạc Liêu' },
      { code: '956', name: 'Hồng Dân' },
      { code: '957', name: 'Phước Long' },
      { code: '958', name: 'Vĩnh Lợi' },
      { code: '959', name: 'Giá Rai' },
      { code: '960', name: 'Đông Hải' },
      { code: '961', name: 'Hoà Bình' }
    ]
  },
  {
    code: '96',
    name: 'Cà Mau',
    districts: [
      { code: '964', name: 'Cà Mau' },
      { code: '966', name: 'U Minh' },
      { code: '967', name: 'Thới Bình' },
      { code: '968', name: 'Trần Văn Thời' },
      { code: '969', name: 'Cái Nước' },
      { code: '970', name: 'Đầm Dơi' },
      { code: '971', name: 'Năm Căn' },
      { code: '972', name: 'Phú Tân' },
      { code: '973', name: 'Ngọc Hiển' }
    ]
  }
]
