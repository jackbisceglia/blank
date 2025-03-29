/**
 * Removes a specific key from an object and returns the remaining properties.
 * Works with both regular and readonly objects.
 *
 * @param {T} obj - The input object (can be readonly)
 * @param {K} key - The key to remove from the object
 * @returns {Omit<T, K>} A new object without the specified key
 *
 * @example
 * // Remove the 'email_verified' key from a user object
 * const userData = { email: "user@example.com", email_verified: true, name: "User" };
 * const cleanedData = omitKey(userData, "email_verified");
 * // Result: { email: "user@example.com", name: "User" }
 *
 * @example
 * // Works with readonly objects too
 * const readonlyData: Readonly<User> = { email: "user@example.com", email_verified: true, name: "User" };
 * const cleanedData = omitKey(readonlyData, "email_verified");
 */
export function omitKey<T extends object, K extends keyof T>(
  obj: T | Readonly<T>,
  key: K
): Omit<T, K> {
  // Use destructuring to remove the key
  const { [key]: _, ...rest } = obj;
  return rest as Omit<T, K>;
}
