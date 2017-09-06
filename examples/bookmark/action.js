
// Action for moving
export function moveSlide(count) {
  return {
    type: 'MOVE',
    count
  };
}
export function changeSource(source) {
  return {
    type: 'CHANGESOURCE',
    source
  };
}
export function addBookmark(isAdding) {
  return {
    type: 'ADDBOOKMARK',
    isAdding
  };
}
