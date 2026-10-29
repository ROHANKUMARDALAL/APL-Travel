import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HERO_SLIDE, homeHeroSlides, wrapSlide } from "./heroSlides.mjs";

test("home hero uses active tenant banners in display order", () => {
  const slides = homeHeroSlides([
    { placement: "PROMO", imageUrl: "/media/dsa/a/banner/promo.jpg", title: "Promo", displayOrder: 1 },
    { placement: "HOME_HERO", imageUrl: "/media/dsa/a/banner/second.jpg", title: "Mountains", displayOrder: 20 },
    { placement: "HOME_HERO", imageUrl: "/media/dsa/a/banner/first.jpg", title: "Beach", displayOrder: 10 },
    { placement: "HOME_HERO", imageUrl: "", title: "Missing", displayOrder: 5 },
  ]);
  assert.deepEqual(slides, [
    { src: "/media/dsa/a/banner/first.jpg", label: "Beach" },
    { src: "/media/dsa/a/banner/second.jpg", label: "Mountains" },
  ]);
});

test("an empty banner list keeps the local default image", () => {
  assert.deepEqual(homeHeroSlides([]), [DEFAULT_HERO_SLIDE]);
  assert.deepEqual(homeHeroSlides(null), [DEFAULT_HERO_SLIDE]);
});

test("slide index wraps in both directions", () => {
  assert.equal(wrapSlide(1, 1, 2), 0);
  assert.equal(wrapSlide(0, -1, 2), 1);
});
