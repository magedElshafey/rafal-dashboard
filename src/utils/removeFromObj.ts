/**
 * Remove properties from an object.
 *
 * @param obj The object from which to remove properties.
 * @param exclude The properties to exclude.
 * @returns A new object with the specified properties omitted.
 */
export function removeFromObj<T extends object, U extends Extract<keyof T, string>>(
  obj: T,
  exclude: U[] | U
): Omit<T, U> {
  // make a deep clone of the object
  const clone = JSON.parse(JSON.stringify(obj))

  // delete specified properties from the cloned object
  if (Array.isArray(exclude)) exclude.forEach((prop) => delete clone[prop])
  else delete clone[exclude]

  // return the modified object
  return clone
}
