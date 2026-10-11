/** Requests a width-appropriate version of stock images so phones download less. */
export function imgUrl(url, w = 1200) {
  if (!url) return url;
  if (url.includes("pexels.com")) {
    return `${url.split("?")[0]}?auto=compress&cs=tinysrgb&w=${w}`;
  }
  if (url.includes("images.unsplash.com")) {
    return `${url.split("?")[0]}?auto=format&fit=crop&q=70&w=${w}`;
  }
  return url;
}

/** srcSet across three widths for full-bleed / card images. */
export function imgSrcSet(url, widths = [600, 1000, 1600]) {
  if (!url || !(url.includes("pexels.com") || url.includes("images.unsplash.com"))) return undefined;
  return widths.map((w) => `${imgUrl(url, w)} ${w}w`).join(", ");
}
