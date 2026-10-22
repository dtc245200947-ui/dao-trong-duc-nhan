// ================= LOGIC ĐIỀU KHIỂN ĐĂNG KÝ, ĐĂNG NHẬP, LỌC 34 TỈNH & ĐẶT PHÒNG =================
const bookingModalObj = new bootstrap.Modal(document.getElementById('modalBooking'));
const modalAuthLoginObj = new bootstrap.Modal(document.getElementById('modalAuthLogin'));
const modalAuthRegisterObj = new bootstrap.Modal(document.getElementById('modalAuthRegister'));
const modalETicketObj = new bootstrap.Modal(document.getElementById('modalETicket'));

let currentUser = null; // { name, role: 'customer' | 'admin' }
let pendingBookingArgs = null;

// ĐỒNG BỘ ẨN / HIỆN TIỀN PHÒNG & NÚT ĐẶT PHÒNG THEO TRẠNG THÁI ĐĂNG NHẬP:
// KHI CHƯA ĐĂNG NHẬP (NGOÀI GIAO DIỆN): XÓA HẲN CẢ SỐ TIỀN LẪN NÚT ĐẶT PHÒNG / ĐẶT VÉ
// KHI ĐĂNG NHẬP VÀO BÊN TRONG: HIỆN ĐẦY ĐỦ SỐ TIỀN & NÚT ĐẶT PHÒNG / ĐẶT VÉ
function syncAuthPriceVisibility() {
  const isLogged = Boolean(currentUser);
  document.body.classList.toggle('auth-locked-mode', !isLogged);

  // Ẩn cụm nút lọc giá (< 1 Triệu, 1 - 3 Triệu...) khi chưa đăng nhập
  const budgetBtn = document.getElementById('filterBudget_ALL');
  if (budgetBtn && budgetBtn.parentElement) {
    budgetBtn.parentElement.style.display = isLogged ? '' : 'none';
  }

  document.querySelectorAll('#hotels .fs-5.fw-bold, #flights .fs-5.fw-bold').forEach(el => {
    if (!el.dataset.rawPrice) {
      el.dataset.rawPrice = parseInt(el.innerText.split('đ')[0].replace(/\D/g, '')) || 0;
    }
    const priceBlock = el.parentElement;
    const actionRow = priceBlock ? priceBlock.parentElement : null;
    if (priceBlock) {
      priceBlock.style.display = isLogged ? '' : 'none';
    }
    if (actionRow) {
      actionRow.classList.toggle('d-none', !isLogged);
      actionRow.classList.toggle('d-flex', isLogged);
    }
  });
}

let allBookings = [
  { code: '#BK-9471', name: 'Đào Trọng Đức Nhân', phone: '0988.123.947', service: 'Suite Tổng Thống (VIP)', date: '2026-10-15', price: '4.200.000đ', status: 'Đã xác nhận' },
  { code: '#BK-8812', name: 'Nguyễn Văn Minh', phone: '0912.888.777', service: 'Grand Heritage Hồ Gươm (Hà Nội)', date: '2026-10-18', price: '2.850.000đ', status: 'Đã thanh toán' },
  { code: '#BK-5520', name: 'Lê Hoàng Yến', phone: '0973.444.555', service: 'Sunset Ocean Pool Villa (Phú Quốc)', date: '2026-10-20', price: '3.800.000đ', status: 'Đã xác nhận' }
];

function showToast(title, message, isSuccess = true) {
  const toast = document.getElementById('toastNotification');
  const icon = document.getElementById('toastIcon');
  if (!toast || !icon) return;
  document.getElementById('toastTitle').innerText = title;
  document.getElementById('toastMessage').innerText = message;

  if (isSuccess) {
    icon.className = 'fa-solid fa-circle-check text-success fs-4';
  } else {
    icon.className = 'fa-solid fa-circle-exclamation text-warning fs-4';
  }

  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

function openLoginModal() {
  const err = document.getElementById('loginErrorNotice');
  if (err) err.style.display = 'none';
  modalAuthLoginObj.show();
}

function openRegisterModal() {
  const err = document.getElementById('registerErrorNotice');
  if (err) err.style.display = 'none';
  modalAuthRegisterObj.show();
}

function switchAuthModal(target) {
  if (target === 'register') {
    modalAuthLoginObj.hide();
    setTimeout(() => {
      const err = document.getElementById('registerErrorNotice');
      if (err) err.style.display = 'none';
      modalAuthRegisterObj.show();
    }, 280);
  } else {
    modalAuthRegisterObj.hide();
    setTimeout(() => {
      const err = document.getElementById('loginErrorNotice');
      if (err) err.style.display = 'none';
      modalAuthLoginObj.show();
    }, 280);
  }
}

function getRegisteredAccounts() {
  try {
    const raw = localStorage.getItem('imperial_registered_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveRegisteredAccount(acc) {
  const list = getRegisteredAccounts();
  const idx = list.findIndex(x => x.contact.toLowerCase() === acc.contact.toLowerCase());
  if (idx >= 0) {
    list[idx] = acc;
  } else {
    list.push(acc);
  }
  localStorage.setItem('imperial_registered_accounts', JSON.stringify(list));
}

function quickFillRole(roleType) {
  const banner = document.getElementById('loginRegisteredBanner');
  const err = document.getElementById('loginErrorNotice');
  if (banner) banner.style.display = 'none';
  if (err) err.style.display = 'none';

  if (roleType === 'customer') {
    document.getElementById('authLoginUser').value = 'khachhang@gmail.com';
    document.getElementById('authLoginPass').value = '123456';
    currentUser = { name: 'Nguyễn Thị Hương', phone: '0912.345.678', contact: 'khachhang@gmail.com', role: 'customer' };
  } else {
    document.getElementById('authLoginUser').value = 'admin@imperial.com';
    document.getElementById('authLoginPass').value = 'admin123';
    currentUser = { name: 'Admin Đào Trọng Đức Nhân', phone: '0988.123.947', contact: 'admin@imperial.com', role: 'admin' };
  }
}

function handleAuthRegister(e) {
  e.preventDefault();
  const name = document.getElementById('authRegName').value.trim();
  const contact = document.getElementById('authRegContact').value.trim();
  const phone = document.getElementById('authRegPhone').value.trim();
  const pass = document.getElementById('authRegPass').value;
  const passConfirm = document.getElementById('authRegPassConfirm').value;
  const errBox = document.getElementById('registerErrorNotice');

  if (pass !== passConfirm) {
    errBox.style.display = 'block';
    errBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> Mật khẩu nhập lại không khớp! Vui lòng kiểm tra lại.';
    return;
  }

  errBox.style.display = 'none';

  const newAcc = {
    name: name,
    contact: contact,
    phone: phone,
    pass: pass,
    role: contact.toLowerCase().includes('admin') ? 'admin' : 'customer'
  };
  saveRegisteredAccount(newAcc);

  document.getElementById('formAuthRegister').reset();
  modalAuthRegisterObj.hide();

  showToast('Đăng ký tài khoản thành công!', `Tài khoản của ${name} đã được tạo. Đang chuyển sang Đăng nhập...`);

  setTimeout(() => {
    document.getElementById('authLoginUser').value = contact;
    document.getElementById('authLoginPass').value = pass;
    document.getElementById('loginErrorNotice').style.display = 'none';

    const banner = document.getElementById('loginRegisteredBanner');
    const bannerText = document.getElementById('loginRegisteredBannerText');
    if (banner && bannerText) {
      bannerText.innerHTML = `Chào <strong>${name}</strong>! Tài khoản <code>${contact}</code> vừa đăng ký đã được điền sẵn. Hãy bấm <strong>Xác Nhận Đăng Nhập</strong>!`;
      banner.style.display = 'block';
    }
    currentUser = null;
    modalAuthLoginObj.show();
  }, 320);
}

function handleAuthLogin(e) {
  e.preventDefault();
  const userVal = document.getElementById('authLoginUser').value.trim();
  const passVal = document.getElementById('authLoginPass').value;
  const errBox = document.getElementById('loginErrorNotice');
  errBox.style.display = 'none';

  const accounts = getRegisteredAccounts();
  const matchedAcc = accounts.find(
    a => a.contact.toLowerCase() === userVal.toLowerCase() || (a.phone && a.phone === userVal)
  );

  if (matchedAcc) {
    if (matchedAcc.pass !== passVal) {
      errBox.style.display = 'block';
      errBox.innerHTML = '<i class="fa-solid fa-circle-xmark me-1"></i> Mật khẩu không chính xác! Vui lòng kiểm tra lại.';
      return;
    }
    currentUser = {
      name: matchedAcc.name,
      phone: matchedAcc.phone,
      contact: matchedAcc.contact,
      role: matchedAcc.role || 'customer'
    };
  } else if (!currentUser || (currentUser.contact && currentUser.contact.toLowerCase() !== userVal.toLowerCase())) {
    const isAdmin = userVal.toLowerCase().includes('admin');
    currentUser = {
      name: isAdmin ? 'Admin Đào Trọng Đức Nhân' : (userVal.split('@')[0] || 'Khách hàng VIP'),
      phone: '0988.123.947',
      contact: userVal,
      role: isAdmin ? 'admin' : 'customer'
    };
  }

  try {
    localStorage.setItem('imperial_active_user', JSON.stringify(currentUser));
  } catch (err) {}

  updateUserUI();
  syncAuthPriceVisibility();
  const banner = document.getElementById('loginRegisteredBanner');
  if (banner) banner.style.display = 'none';
  modalAuthLoginObj.hide();

  if (currentUser.role === 'admin') {
    showToast('Đăng nhập Quản Trị Viên', 'Chào Admin ' + currentUser.name + '! Đã mở khóa bảng quản trị dữ liệu.');
  } else {
    showToast('Đăng nhập thành công!', 'Chào mừng ' + currentUser.name + '! Đã hiện giá phòng & nút Đặt Phòng.');
  }

  if (pendingBookingArgs) {
    const args = pendingBookingArgs;
    pendingBookingArgs = null;
    setTimeout(() => {
      openBookingModal(args[0], args[1], args[2]);
    }, 350);
  }
}

function logoutUser() {
  currentUser = null;
  pendingBookingArgs = null;
  try { localStorage.removeItem('imperial_active_user'); } catch (e) {}
  document.getElementById('authSection').classList.remove('d-none');
  document.getElementById('authSection').classList.add('d-flex');
  document.getElementById('userProfileSection').classList.remove('d-flex');
  document.getElementById('userProfileSection').classList.add('d-none');

  document.getElementById('navAdminLink').classList.add('d-none');
  document.getElementById('booking-manager').style.display = 'none';
  syncAuthPriceVisibility();

  showToast('Đã đăng xuất', 'Bạn đã đăng xuất tài khoản an toàn.');
}

function updateUserUI() {
  if (currentUser) {
    document.getElementById('authSection').classList.remove('d-flex');
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('userProfileSection').classList.remove('d-none');
    document.getElementById('userProfileSection').classList.add('d-flex');

    document.getElementById('currentUserName').innerText = currentUser.name;
    if (document.getElementById('custFullName')) {
      document.getElementById('custFullName').value = currentUser.name;
    }
    if (document.getElementById('custPhoneNum') && currentUser.phone) {
      document.getElementById('custPhoneNum').value = currentUser.phone;
    }

    if (currentUser.role === 'admin') {
      document.getElementById('navUserRole').className = 'badge bg-danger text-white px-2 py-0';
      document.getElementById('navUserRole').innerText = 'ADMIN';
      document.getElementById('navAdminLink').classList.remove('d-none');
      document.getElementById('booking-manager').style.display = 'block';
    } else {
      document.getElementById('navUserRole').className = 'badge bg-warning text-dark px-2 py-0';
      document.getElementById('navUserRole').innerText = 'THÀNH VIÊN';
      document.getElementById('navAdminLink').classList.add('d-none');
    }
  }
}

let currentBudgetFilter = 'ALL';
function filterByPriceRange(range) {
  currentBudgetFilter = range;
  ['ALL', 'LOW', 'MID', 'HIGH'].forEach(k => {
    const b = document.getElementById('filterBudget_' + k);
    if (b) b.classList.remove('active');
  });
  const activeBtn = document.getElementById('filterBudget_' + range);
  if (activeBtn) activeBtn.classList.add('active');

  filterHotelsByLocation(true);
}

let currentHotelRegionFilter = 'ALL';
let showAll189HotelsFlag = false;

function filterHotelsByRegion(regionName) {
  currentHotelRegionFilter = regionName;
  const mapBtn = { 'ALL': 'ALL', 'Miền Bắc': 'BAC', 'Miền Trung': 'TRUNG', 'Miền Nam': 'NAM' };
  ['ALL', 'BAC', 'TRUNG', 'NAM'].forEach(k => {
    const b = document.getElementById('hotelRegion_' + k);
    if (b) b.classList.remove('active');
  });
  const activeBtn = document.getElementById('hotelRegion_' + (mapBtn[regionName] || 'ALL'));
  if (activeBtn) activeBtn.classList.add('active');

  const sel = document.getElementById('selectCitySearch');
  if (sel) sel.value = 'ALL';

  if (typeof renderRegionalFlights === 'function') {
    renderRegionalFlights(regionName);
  }

  filterHotelsByLocation(true);
}

function getRegionOfCity(cityName) {
  if (typeof PROVINCES_63_LIST === 'undefined') return 'Miền Trung';
  const found = PROVINCES_63_LIST.find(p => (p.cityKey === cityName) || (p.name === cityName));
  return found ? found.region : 'Miền Trung';
}

function filterHotelsByLocation(skipScroll = false) {
  const sel = document.getElementById('selectCitySearch');
  const city = sel ? sel.value : 'ALL';
  const loader = document.getElementById('hotelSearchLoader');
  const container = document.getElementById('hotelGridContainer');

  if (city !== 'ALL' && typeof ensureHotelsForCity === 'function') {
    ensureHotelsForCity(city);
  }

  if (loader && container) {
    loader.classList.remove('d-none');
    container.style.opacity = '0.3';
  }

  setTimeout(() => {
    if (loader && container) {
      loader.classList.add('d-none');
      container.style.opacity = '1';
    }

    const cards = document.querySelectorAll('.hotel-card-item');
    let visibleShown = 0;

    cards.forEach(card => {
      const cardCity = card.getAttribute('data-city');
      const cardRegion = card.getAttribute('data-region') || getRegionOfCity(cardCity);

      let locationMatch = false;
      if (city !== 'ALL') {
        locationMatch = (cardCity === city);
      } else if (currentHotelRegionFilter !== 'ALL') {
        locationMatch = (cardRegion === currentHotelRegionFilter);
      } else {
        locationMatch = true;
      }

      let priceMatch = true;
      const priceEl = card.querySelector('.fs-5.fw-bold');
      const numPrice = priceEl
        ? (parseInt(priceEl.dataset.rawPrice) || parseInt(priceEl.innerText.split('đ')[0].replace(/\D/g, '')) || 0)
        : 0;

      if (currentBudgetFilter === 'LOW') priceMatch = (numPrice < 1000000);
      else if (currentBudgetFilter === 'MID') priceMatch = (numPrice >= 1000000 && numPrice <= 3000000);
      else if (currentBudgetFilter === 'HIGH') priceMatch = (numPrice > 3000000);

      if (locationMatch && priceMatch) {
        const shouldLimit = (city === 'ALL' && currentHotelRegionFilter === 'ALL' && !showAll189HotelsFlag);
        if (!shouldLimit || visibleShown < 15) {
          card.style.display = 'block';
          visibleShown++;
        } else {
          card.style.display = 'none';
        }
      } else {
        card.style.display = 'none';
      }
    });

    syncAuthPriceVisibility();

    if (!skipScroll) {
      const hotelSec = document.getElementById('hotels');
      if (hotelSec) hotelSec.scrollIntoView({ behavior: 'smooth' });
    }
  }, 200);
}

function quickSelectCity(cityName) {
  const sel = document.getElementById('selectCitySearch');
  if (sel) {
    ensureHotelsForCity(cityName);
    sel.value = cityName;
  }
  const reg = getRegionOfCity(cityName);
  if (typeof renderRegionalFlights === 'function') {
    renderRegionalFlights(reg, cityName);
  }
  filterHotelsByLocation();
}

let currentBaseDailyPrice = 1500000;
let currentDiscountRatio = 0;
let currentServiceType = 'HOTEL';

function openBookingModal(serviceName, locationName, priceNum) {
  if (!currentUser) {
    pendingBookingArgs = [serviceName, locationName, priceNum];
    showToast('Yêu cầu Đăng nhập tài khoản!', 'Bạn cần Đăng ký hoặc Đăng nhập tài khoản trước khi đặt phòng!', false);
    const banner = document.getElementById('loginRegisteredBanner');
    const bannerText = document.getElementById('loginRegisteredBannerText');
    if (banner && bannerText) {
      bannerText.innerHTML = `<i class="fa-solid fa-lock me-1"></i> Vui lòng <strong>Đăng nhập</strong> (hoặc bấm <strong>Đăng ký tài khoản ngay</strong> ở bên dưới) để đặt: <strong>${serviceName} (${locationName})</strong>.`;
      banner.style.display = 'block';
    }
    openLoginModal();
    return;
  }
  currentBaseDailyPrice = priceNum;
  currentDiscountRatio = 0;
  document.getElementById('voucherCodeInput').value = '';
  document.getElementById('voucherNotice').style.display = 'none';
  document.getElementById('reserveRoomName').value = `${serviceName} - ${locationName}`;

  const titleEl = document.getElementById('modalServiceTitle');
  const subTitleEl = document.getElementById('modalServiceSubtitle');
  const labelServiceEl = document.getElementById('labelSelectedService');
  const addonIconEl = document.getElementById('addonServiceIcon');
  const labelDateStart = document.getElementById('labelDateStart');
  const labelDateEnd = document.getElementById('labelDateEnd');
  const btnSubmit = document.getElementById('btnSubmitBooking');

  if (serviceName.toLowerCase().includes('vé máy bay')) {
    currentServiceType = 'FLIGHT';
    titleEl.innerHTML = '<i class="fa-solid fa-plane-departure text-primary me-2"></i>ĐẶT VÉ MÁY BAY CHUYẾN BAY';
    subTitleEl.innerText = 'Xuất vé điện tử trực tiếp • Vietnam Airlines & Bamboo Airways';
    labelServiceEl.innerHTML = '<i class="fa-solid fa-plane me-1"></i> HÀNH TRÌNH CHUYẾN BAY';
    addonIconEl.innerHTML = '<i class="fa-solid fa-plane-up text-primary"></i>';
    labelDateStart.innerHTML = '<i class="fa-regular fa-calendar me-1"></i> NGÀY KHỞI HÀNH *';
    labelDateEnd.innerHTML = '<i class="fa-regular fa-calendar-check me-1"></i> NGÀY VỀ (NẾU CÓ KHỨ HỒI)';
    btnSubmit.innerHTML = '<i class="fa-solid fa-plane-circle-check me-2"></i> XÁC NHẬN GIỮ CHỖ VÉ BAY';
  } else {
    currentServiceType = 'HOTEL';
    titleEl.innerHTML = '<i class="fa-solid fa-key text-warning me-2"></i>ĐẶT PHÒNG KHÁCH SẠN';
    subTitleEl.innerText = 'Xác nhận thông tin & áp dụng voucher ưu đãi';
    labelServiceEl.innerHTML = '<i class="fa-solid fa-hotel me-1"></i> DỊCH VỤ / PHÒNG ĐÃ CHỌN';
    addonIconEl.innerHTML = '<i class="fa-solid fa-bed text-warning"></i>';
    labelDateStart.innerHTML = '<i class="fa-regular fa-calendar-days me-1"></i> NGÀY NHẬN (CHECK-IN) *';
    labelDateEnd.innerHTML = '<i class="fa-regular fa-calendar-check me-1"></i> NGÀY TRẢ (CHECK-OUT) *';
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-check me-2"></i> XÁC NHẬN GIỮ PHÒNG (MIỄN PHÍ HỦY 24H)';
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  document.getElementById('custCheckin').value = today.toISOString().split('T')[0];
  document.getElementById('custCheckout').value = tomorrow.toISOString().split('T')[0];

  recalcBookingPrice();
  bookingModalObj.show();
}

function recalcBookingPrice() {
  const inDate = new Date(document.getElementById('custCheckin').value);
  const outDate = new Date(document.getElementById('custCheckout').value);

  let diffDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (isNaN(diffDays) || diffDays < 1) diffDays = 1;

  if (currentServiceType === 'FLIGHT') {
    document.getElementById('stayDurationText').innerText = `1 hành trình`;
  } else {
    document.getElementById('stayDurationText').innerText = `${diffDays} đêm`;
  }

  const multiplier = (currentServiceType === 'FLIGHT') ? 1 : diffDays;
  const rawTotal = currentBaseDailyPrice * multiplier;
  const discountAmount = rawTotal * currentDiscountRatio;
  const finalAmount = rawTotal - discountAmount;

  document.getElementById('discountAmountText').innerText = discountAmount > 0
    ? `-${new Intl.NumberFormat('vi-VN').format(discountAmount)}đ (${currentDiscountRatio * 100}%)`
    : '0đ';

  const finalFormatted = new Intl.NumberFormat('vi-VN').format(finalAmount) + 'đ';
  document.getElementById('finalPriceDisplay').innerText = finalFormatted;
  document.getElementById('reservePrice').value = finalFormatted;
}

function applyPromoVoucher() {
  const code = document.getElementById('voucherCodeInput').value.trim().toUpperCase();
  const notice = document.getElementById('voucherNotice');
  const boxWrapper = document.getElementById('voucherBoxWrapper');

  if (code === 'IMPERIAL-VIP947') {
    currentDiscountRatio = 0.25;
    notice.style.display = 'block';
    notice.className = 'small mt-1 text-success fw-semibold';
    notice.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i> Mã VIP947 hợp lệ! Đã áp dụng giảm ngay 25% tổng đơn.';
    recalcBookingPrice();
    showToast('Áp dụng Voucher', 'Chúc mừng bạn được giảm ngay 25% với mã IMPERIAL-VIP947!');
  } else if (code.length > 0) {
    currentDiscountRatio = 0;
    notice.style.display = 'block';
    notice.className = 'small mt-1 text-danger fw-semibold';
    notice.innerHTML = '<i class="fa-solid fa-circle-xmark me-1"></i> Mã không hợp lệ! Thử mã ưu đãi: IMPERIAL-VIP947';

    if (boxWrapper) {
      boxWrapper.style.transform = 'translateX(-8px)';
      setTimeout(() => { boxWrapper.style.transform = 'translateX(8px)'; }, 100);
      setTimeout(() => { boxWrapper.style.transform = 'translateX(-5px)'; }, 200);
      setTimeout(() => { boxWrapper.style.transform = 'translateX(5px)'; }, 300);
      setTimeout(() => { boxWrapper.style.transform = 'translateX(0)'; }, 400);
    }

    recalcBookingPrice();
  }
}

async function submitReservation(e) {
  e.preventDefault();
  if (!currentUser) {
    bookingModalObj.hide();
    showToast('Chưa đăng nhập!', 'Vui lòng đăng nhập tài khoản trước khi xác nhận đặt phòng.', false);
    openLoginModal();
    return;
  }
  const code = '#BK-' + Math.floor(1000 + Math.random() * 9000);
  const name = document.getElementById('custFullName').value;
  const phone = document.getElementById('custPhoneNum').value;
  const room = document.getElementById('reserveRoomName').value;
  const date = document.getElementById('custCheckin').value;
  const price = document.getElementById('reservePrice').value;
  const paymentSel = document.getElementById('selectPaymentMethod');
  const paymentText = paymentSel ? paymentSel.options[paymentSel.selectedIndex].text.split('(')[0] : 'Thanh toán tại quầy';

  const newBooking = {
    code: code,
    name: name,
    phone: phone,
    service: room,
    date: date,
    price: price,
    status: 'Đã xác nhận'
  };

  try {
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    });
  } catch (err) {
    console.log('Chạy offline:', err);
  }

  allBookings.unshift(newBooking);
  bookingModalObj.hide();
  renderBookings(allBookings);

  document.getElementById('ticketCode').innerText = code;
  document.getElementById('ticketName').innerText = name;
  document.getElementById('ticketService').innerText = room;
  document.getElementById('ticketDate').innerText = date;
  document.getElementById('ticketPrice').innerText = price;
  document.getElementById('ticketPayment').innerText = paymentText;

  setTimeout(() => {
    modalETicketObj.show();
  }, 400);

  showToast('Đặt dịch vụ thành công!', `Mã xác nhận ${code} đã được cấp cho quý khách ${name}.`);
  document.getElementById('formReserve').reset();
}

function renderBookings(list) {
  const tbody = document.getElementById('booking-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const countEl = document.getElementById('countBookingRows');
  if (countEl) countEl.innerText = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có giao dịch nào!</td></tr>';
    return;
  }

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold text-warning font-monospace">${item.code || item.booking_code}</td>
      <td class="fw-semibold text-white">${item.name || item.customer_name}</td>
      <td style="color: #cbd5e1;">${item.phone}</td>
      <td><span class="badge bg-secondary">${item.service || item.service_name}</span></td>
      <td class="text-info">${item.date || item.booking_date}</td>
      <td class="fw-bold text-warning">${item.price || item.total_price}</td>
      <td><span class="badge bg-success">${item.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function filterBookingsTable() {
  const kw = document.getElementById('searchBookingInput').value.toLowerCase().trim();
  const status = document.getElementById('filterStatusSelect').value;

  const filtered = allBookings.filter(item => {
    const nameVal = (item.name || item.customer_name || '').toLowerCase();
    const codeVal = (item.code || item.booking_code || '').toLowerCase();
    const statusVal = item.status || '';

    const matchKeyword = nameVal.includes(kw) || codeVal.includes(kw);
    const matchStatus = (status === 'ALL') || (statusVal === status);

    return matchKeyword && matchStatus;
  });

  renderBookings(filtered);
}

async function fetchBookingsFromDB() {
  try {
    const res = await fetch('/api/bookings');
    const json = await res.json();
    if (json.success && json.data && json.data.length > 0) {
      allBookings = json.data;
      renderBookings(allBookings);
    } else {
      renderBookings(allBookings);
    }
  } catch (err) {
    renderBookings(allBookings);
  }
}

let currentDestRegion = 'TOP';

function renderDestinationsGrid(regionFilter = 'TOP') {
  currentDestRegion = regionFilter;
  const mapBtn = { 'TOP': 'TOP', 'ALL': 'ALL', 'Miền Bắc': 'BAC', 'Miền Trung': 'TRUNG', 'Miền Nam': 'NAM' };
  ['TOP', 'ALL', 'BAC', 'TRUNG', 'NAM'].forEach(k => {
    const b = document.getElementById('btnRegion_' + k);
    if (b) b.classList.remove('active');
  });
  const activeBtn = document.getElementById('btnRegion_' + (mapBtn[regionFilter] || 'TOP'));
  if (activeBtn) activeBtn.classList.add('active');

  const kw = (document.getElementById('searchProvinceInput')?.value || '').toLowerCase().trim();
  const container = document.getElementById('destinationsGridContainer');
  if (!container) return;

  const filtered = PROVINCES_63_LIST.filter(item => {
    const matchKw = !kw || item.name.toLowerCase().includes(kw) || (item.cityKey && item.cityKey.toLowerCase().includes(kw));
    if (kw) return matchKw;
    if (regionFilter === 'TOP') return item.top;
    if (regionFilter === 'ALL') return true;
    return item.region === regionFilter;
  });

  container.innerHTML = filtered.map((item, idx) => {
    const key = item.cityKey || item.name;
    const fallbackImg = VERIFIED_PHOTOS[idx % VERIFIED_PHOTOS.length];
    return `
      <div class="col-lg-3 col-md-4 col-sm-6" onclick="quickSelectCity('${key}')">
        <div class="city-card">
          <img src="${item.img}" alt="${item.name}" onerror="this.onerror=null;this.src='${fallbackImg}';">
          <div class="city-card-overlay">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="fw-bold text-white mb-0">${item.name}</h5>
              <span class="badge bg-dark border border-warning text-warning" style="font-size: 0.68rem;">${item.region}</span>
            </div>
            <small class="text-warning">${item.desc}</small>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function populateAll63ProvincesDropdown() {
  const sel = document.getElementById('selectCitySearch');
  if (!sel) return;

  let html = `<option value="ALL" selected style="background-color: #ffffff; color: #0f172a;">🇻🇳 Tất cả tỉnh thành toàn quốc</option>`;
  ['Miền Bắc', 'Miền Trung', 'Miền Nam'].forEach(region => {
    html += `<optgroup label="── ${region.toUpperCase()} ──" style="background-color: #ffffff; color: #d97706;">`;
    PROVINCES_63_LIST.filter(p => p.region === region).forEach(p => {
      const val = p.cityKey || p.name;
      html += `<option value="${val}" style="background-color: #ffffff; color: #0f172a;">${p.name}</option>`;
    });
    html += `</optgroup>`;
  });
  sel.innerHTML = html;
}

function ensureHotelsForCity(cityName) {
  if (!cityName || cityName === 'ALL') return;
  const container = document.getElementById('hotelGridContainer');
  if (!container) return;

  const existing = container.querySelectorAll(`.hotel-card-item[data-city="${cityName}"]`);
  if (existing.length > 0) return;

  const seed = cityName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const regionName = getRegionOfCity(cityName);
  const img1 = VERIFIED_PHOTOS[(seed + 8) % VERIFIED_PHOTOS.length];
  const img2 = VERIFIED_PHOTOS[(seed + 11) % VERIFIED_PHOTOS.length];
  const img3 = VERIFIED_PHOTOS[(seed + 14) % VERIFIED_PHOTOS.length];

  const autoRooms = [
    {
      title: `Imperial Royal Suite ${cityName}`,
      badge: "VIP CỰC PHẨM",
      badgeClass: "bg-danger",
      rating: "5.0 (VIP)",
      desc: `Tọa lạc tại vị trí đắc địa nhất ${cityName} (${regionName}), tầm nhìn panorama tuyệt đẹp, bồn tắm Jacuzzi, quản gia 24/7 và đưa đón sân bay.`,
      specs: ["120m²", "4 Khách", "Butler 24/7", "Hồ vô cực"],
      price: 3500000,
      oldPrice: "4.600.000đ",
      img: img1
    },
    {
      title: `Grand Luxury Resort ${cityName}`,
      badge: "SẴN SÀNG",
      badgeClass: "bg-info",
      rating: "5.0",
      desc: `Không gian nghỉ dưỡng chuẩn 5 sao quốc tế tại ${cityName} (${regionName}), bao gồm buffet sáng thượng hạng, hồ bơi nước ấm và Spa thảo dược.`,
      specs: ["60m²", "2 Khách", "Buffet sáng", "Spa 5 sao"],
      price: 1750000,
      oldPrice: "2.400.000đ",
      img: img2
    },
    {
      title: `Cozy Boutique Hotel ${cityName}`,
      badge: "GIÁ TỐT NHẤT",
      badgeClass: "bg-success",
      rating: "4.9",
      desc: `Ngay trung tâm du lịch ${cityName} (${regionName}), thiết kế hiện đại ấm cúng, đầy đủ tiện nghi cao cấp, cực kỳ tiết kiệm cho chuyến đi.`,
      specs: ["36m²", "2 Khách", "Trung tâm", "Wifi 6"],
      price: 850000,
      oldPrice: "1.250.000đ",
      img: img3
    }
  ];

  autoRooms.forEach(r => {
    const priceFormatted = new Intl.NumberFormat('vi-VN').format(r.price) + 'đ';
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 hotel-card-item';
    col.setAttribute('data-city', cityName);
    col.setAttribute('data-region', regionName);
    col.innerHTML = `
      <div class="card-item">
        <div class="card-img-holder">
          <span class="badge-top-left ${r.badgeClass}"><i class="fa-solid fa-star me-1"></i> ${r.badge}</span>
          <span class="badge-top-right"><i class="fa-solid fa-location-dot me-1"></i> ${cityName}</span>
          <img src="${r.img}" alt="${r.title}" onerror="this.onerror=null;this.src='${VERIFIED_PHOTOS[0]}';">
        </div>
        <div class="p-4 d-flex flex-column flex-grow-1">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h4 class="fw-bold mb-0 text-white">${r.title}</h4>
            <div class="text-warning small"><i class="fa-solid fa-star"></i> ${r.rating}</div>
          </div>
          <p class="card-desc-text flex-grow-1">${r.desc}</p>
          <div class="d-flex gap-3 spec-icon-row">
            <span><i class="fa-solid fa-expand text-warning me-1"></i> ${r.specs[0]}</span>
            <span><i class="fa-solid fa-users text-warning me-1"></i> ${r.specs[1]}</span>
            <span><i class="fa-solid fa-mug-hot text-warning me-1"></i> ${r.specs[2]}</span>
            <span><i class="fa-solid fa-wifi text-warning me-1"></i> ${r.specs[3]}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-auto">
            <div>
              <small style="color: #94a3b8;">Giá ưu đãi (${regionName})</small>
              <div class="fs-5 fw-bold text-warning">
                ${priceFormatted} <span class="original-price">${r.oldPrice}</span>
              </div>
            </div>
            <button class="btn btn-glow-gold" onclick="openBookingModal('${r.title}', '${cityName}', ${r.price})">Đặt Phòng</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

function renderRegionalFlights(regionFilter = 'ALL', highlightCity = '') {
  const mapBtn = { 'ALL': 'ALL', 'Miền Bắc': 'BAC', 'Miền Trung': 'TRUNG', 'Miền Nam': 'NAM' };
  ['ALL', 'BAC', 'TRUNG', 'NAM'].forEach(k => {
    const b = document.getElementById('btnFlightReg_' + k);
    if (b) b.classList.remove('active');
  });
  const activeBtn = document.getElementById('btnFlightReg_' + (mapBtn[regionFilter] || 'ALL'));
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.flight-region-header, .flight-card-item').forEach(el => {
    const reg = el.getAttribute('data-region');
    el.style.display = (regionFilter === 'ALL' || reg === regionFilter) ? 'block' : 'none';
  });
  syncAuthPriceVisibility();
}

window.onload = function() {
  currentUser = null;
  try { localStorage.removeItem('imperial_active_user'); } catch (e) {}

  document.querySelectorAll('img').forEach((img, idx) => {
    img.onerror = function() {
      this.onerror = null;
      this.src = VERIFIED_PHOTOS[idx % VERIFIED_PHOTOS.length];
    };
  });

  populateAll63ProvincesDropdown();
  renderDestinationsGrid('TOP');

  PROVINCES_63_LIST.forEach(p => {
    ensureHotelsForCity(p.cityKey || p.name);
  });

  renderRegionalFlights('ALL');

  const sel = document.getElementById('selectCitySearch');
  if (sel) {
    sel.onchange = function() {
      const val = this.value;
      ensureHotelsForCity(val);
      if (val !== 'ALL') {
        renderRegionalFlights(getRegionOfCity(val), val);
      } else {
        renderRegionalFlights('ALL');
      }
      filterHotelsByLocation();
    };
  }

  filterHotelsByLocation(true);
  syncAuthPriceVisibility();
  renderBookings(allBookings);
  fetchBookingsFromDB();
};
