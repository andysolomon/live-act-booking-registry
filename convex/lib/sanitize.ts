/**
 * Strip HTML tags from a string.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Validate string length. Throws if too long.
 */
export function validateLength(
  str: string,
  max: number,
  fieldName: string,
): void {
  if (str.length > max) {
    throw new Error(`${fieldName} must be ${max} characters or fewer`);
  }
}

/**
 * Sanitize a text field: strip HTML, trim, validate length.
 */
export function sanitizeText(
  str: string,
  maxLength: number,
  fieldName: string,
): string {
  const cleaned = stripHtml(str).trim();
  validateLength(cleaned, maxLength, fieldName);
  return cleaned;
}
