export const DEFAULT_HERO_SLIDE = {
  src: "/images/hero-tropical.jpg",
  label: "Tropical beach",
};

export function homeHeroSlides(banners) {
  const slides = (Array.isArray(banners) ? banners : [])
    .filter((banner) => banner && banner.placement === "HOME_HERO" && banner.imageUrl)
    .slice()
    .sort((left, right) => Number(left.displayOrder || 0) - Number(right.displayOrder || 0))
    .map((banner) => ({
      src: banner.imageUrl,
      label: banner.title || "Destination",
    }));
  return slides.length ? slides : [DEFAULT_HERO_SLIDE];
}

export function wrapSlide(index, delta, length = 1) {
  const size = Math.max(1, length);
  return (index + delta + size) % size;
}
