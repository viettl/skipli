import { addMinutes, isAfter, format, formatDistanceToNow } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import { ACCESS_CODE, VALIDATION } from '../constants/index.js';

export function generateAccessCode(): string {
  const min = Math.pow(10, ACCESS_CODE.LENGTH - 1);
  const max = Math.pow(10, ACCESS_CODE.LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export function getAccessCodeExpiry(): Date {
  return addMinutes(new Date(), ACCESS_CODE.EXPIRY_MINUTES);
}

export const isAccessCodeExpired = (expiresAt: Date) => isAfter(new Date(), new Date(expiresAt));

export const isValidEmail = (email: string) => validator.isEmail(email);

export function isValidName(name: string): boolean {
  return validator.isLength(name.trim(), { min: VALIDATION.MIN_NAME_LENGTH });
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) {
    return `+${digits}`;
  }
  return digits;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.startsWith('+') && cleaned.length > 10) {
    const cc = cleaned.slice(0, cleaned.length - 10);
    const num = cleaned.slice(-10);
    return `${cc} (${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
  }
  
  return phone;
}

export function formatDate(date: Date | string | any): string {
  if (!date) return 'N/A';
  
  if (date._seconds !== undefined) {
    return format(new Date(date._seconds * 1000), 'MMM d, yyyy');
  }
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return 'Invalid Date';
  }
  
  return format(parsedDate, 'MMM d, yyyy');
}

export function formatMessageTime(date: Date | string | any): string {
  if (!date) return 'N/A';
  
  if (date._seconds !== undefined) {
    return formatDistanceToNow(new Date(date._seconds * 1000), { addSuffix: true });
  }
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return 'Invalid Date';
  }
  
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export const generateId = () => uuidv4();

export const sanitizeString = (str: string) => validator.escape(str.trim());
