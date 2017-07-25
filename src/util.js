/** Utility functions for SDK.
 *
 *  This is the grab bag of universally useful functions.
 */

/** Compare two objects, uses JSON.stringify.
 */
export function jsonEquals(objectA, objectB) {
  return (JSON.stringify(objectA) === JSON.stringify(objectB));
}


/** Get a layer by it's id
 *
 *  @param layers - Array of GL layer objects.
 *  @param id     - The layer's ID.
 *
 *  @returns The layer or null if not found.
 */
export function getLayerById(layers, id) {
  for (let i = 0, ii = layers.length; i < ii; i++) {
    if (layers[i].id === id) {
      return layers[i];
    }
  }
  return null;
}
