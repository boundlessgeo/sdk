/** Utility functions for SDK.
 *
 *  This is the grab bag of universally useful functions.
 */

export function jsonEquals(objectA, objectB) {
  return (JSON.stringify(objectA) === JSON.stringify(objectB));
}
