import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

export function formatDate(date: string | Date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function numberToWords(num: number): string {
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const specials = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convert(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return specials[n - 10];
    if (n < 100) {
      const u = n % 10;
      return tens[Math.floor(n / 10)] + (u > 0 ? ' Y ' + units[u] : '');
    }
    if (n === 100) return 'CIEN';
    if (n < 1000) {
      const r = n % 100;
      return hundreds[Math.floor(n / 100)] + (r > 0 ? ' ' + convert(r) : '');
    }
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      let prefix = thousands === 1 ? 'MIL' : convert(thousands) + ' MIL';
      return prefix + (remainder > 0 ? ' ' + convert(remainder) : '');
    }
    return 'NÚMERO DEMASIADO GRANDE';
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  const words = integerPart === 0 ? 'CERO' : convert(integerPart);
  const cents = decimalPart.toString().padStart(2, '0');

  return `${words} PESOS ${cents}/100 M.N.`;
}


export function compressImage(base64Str: string, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str.startsWith("data:") ? base64Str : "data:image/jpeg;base64," + base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D no disponible"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (e) => reject(e);
  });
}