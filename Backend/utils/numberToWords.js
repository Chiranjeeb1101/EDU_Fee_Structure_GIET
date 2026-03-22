/**
 * Convert a number to Indian English words
 * e.g. 500 → "Five Hundred", 1500 → "One Thousand Five Hundred"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigit(num) {
  if (num < 20) return ones[num];
  return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
}

function numberToWords(num) {
  if (num === 0) return 'Zero';

  num = Math.floor(Math.abs(num));
  let result = '';

  // Crores (1,00,00,000)
  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  // Lakhs (1,00,000)
  const lakh = Math.floor(num / 100000);
  num %= 100000;

  // Thousands (1,000)
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  // Hundreds (100)
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  if (crore > 0) result += convertTwoDigit(crore) + ' Crore ';
  if (lakh > 0) result += convertTwoDigit(lakh) + ' Lakh ';
  if (thousand > 0) result += convertTwoDigit(thousand) + ' Thousand ';
  if (hundred > 0) result += ones[hundred] + ' Hundred ';
  if (remainder > 0) {
    result += convertTwoDigit(remainder);
  }

  return result.trim();
}

/**
 * Format amount as Indian words for receipt
 * e.g. 500 → "Rupees Five Hundred Only"
 *      1500.50 → "Rupees One Thousand Five Hundred and Paise Fifty Only"
 */
function amountToWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = 'Rupees ' + numberToWords(rupees);
  if (paise > 0) {
    result += ' and Paise ' + numberToWords(paise);
  }
  result += ' Only';
  return result;
}

module.exports = { numberToWords, amountToWords };
