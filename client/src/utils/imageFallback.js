export function onImageError(width, height) {
  return (e) => { e.target.src = `https://via.placeholder.com/${width}x${height}?text=No+Image`; };
}
