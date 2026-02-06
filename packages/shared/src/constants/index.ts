export const USER_ROLES = {
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

export const LESSON_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const ACCESS_CODE = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
} as const;

export const API_ENDPOINTS = {
  CREATE_ACCESS_CODE: '/createAccessCode',
  VALIDATE_ACCESS_CODE: '/validateAccessCode',
  LOGIN_EMAIL: '/loginEmail',
  VALIDATE_EMAIL_CODE: '/validateEmailCode',
  ADD_STUDENT: '/addStudent',
  ASSIGN_LESSON: '/assignLesson',
  GET_STUDENTS: '/students',
  GET_STUDENT: '/student',
  EDIT_STUDENT: '/editStudent',
  DELETE_STUDENT: '/student',
  MY_LESSONS: '/myLessons',
  MARK_LESSON_DONE: '/markLessonDone',
  EDIT_PROFILE: '/editProfile',
} as const;

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
} as const;

export const VALIDATION = {
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
} as const;

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  LESSONS: 'lessons',
  ACCESS_CODES: 'accessCodes',
  MESSAGES: 'messages',
  CHAT_ROOMS: 'chatRooms',
} as const;

export const ERROR_MESSAGES = {
  EMAIL_PASSWORD_REQUIRED: 'email và mật khẩu là bắt buộc',
  USER_NOT_FOUND: 'không tìm thấy người dùng',
  PASSWORD_NOT_SET: 'mật khẩu chưa được tạo. vui lòng đăng nhập bằng otp.',
  INVALID_PASSWORD: 'mật khẩu không đúng',
  INVALID_EMAIL: 'cần có email hợp lệ',
  EMAIL_SEND_FAILED: 'gửi email thất bại',
  INTERNAL_SERVER_ERROR: 'lỗi máy chủ nội bộ',
  ERROR_GENERIC: 'lỗi',
  EMAIL_ACCESS_CODE_REQUIRED: 'email và mã truy cập là bắt buộc',
  ACCESS_CODE_NOT_FOUND: 'không tìm thấy mã truy cập. vui lòng yêu cầu mã mới.',
  INVALID_ACCESS_CODE: 'mã truy cập không hợp lệ',
  ACCESS_CODE_EXPIRED: 'mã truy cập đã hết hạn. vui lòng yêu cầu mã mới.',
  ID_PASSWORD_REQUIRED: 'id và mật khẩu là bắt buộc',
  PASSWORD_TOO_SHORT: 'mật khẩu phải có ít nhất 6 ký tự',
  ACCOUNT_ALREADY_SETUP: 'tài khoản đã được tạo',
  NAME_REQUIRED: 'tên hợp lệ là bắt buộc ',
  EMAIL_REQUIRED: 'email hợp lệ là bắt buộc',
  STUDENT_EXISTS: 'học viên với email này đã tồn tại',
  STUDENT_EMAIL_REQUIRED: 'email học viên là bắt buộc',
  VALID_STUDENT_EMAIL_REQUIRED: 'email học viên hợp lệ là bắt buộc',
  LESSON_TITLE_REQUIRED: 'tiêu đề bài học là bắt buộc',
  STUDENT_NOT_FOUND: 'không tìm thấy học viên',
  NOT_AUTHENTICATED: 'chưa được xác thực',
  LESSON_ID_REQUIRED: 'id bài học là bắt buộc',
  LESSON_NOT_FOUND: 'không tìm thấy bài học',
  UNAUTHORIZED_LESSON: 'không có quyền chỉnh sửa bài học này',
  INVALID_NAME_FORMAT: 'định dạng tên không hợp lệ',
  INVALID_EMAIL_FORMAT: 'định dạng email không hợp lệ',
  NO_TOKEN: 'không có token',
  INVALID_TOKEN: 'token không hợp lệ',
  ACCESS_DENIED: 'truy cập bị từ chối',
} as const;

export const SUCCESS_MESSAGES = {
  EMAIL_BYPASSED: 'bỏ qua email verify',
  ACCESS_CODE_SENT: 'mã truy cập đã gửi',
  ACCOUNT_SETUP_SUCCESS: 'tạo tài khoản thành công',
  STUDENT_ADDED: 'thêm học viên thành công',
  LESSON_ASSIGNED: 'đã giao bài học',
  UPDATE_SUCCESS: 'cập nhật thành công',
  DELETE_SUCCESS: 'đã xóa thành công',
  LESSON_COMPLETED: 'đã hoàn thành',
  PROFILE_UPDATED: 'cập nhật thành công',
} as const;
