"use client";

import { useState } from "react";

export function BlogCover({ post }) {
  const [failed, setFailed] = useState(false);
  const image = post?.featuredImageUrl;
  if (!image || failed) {
    return <div className="blog-cover blog-cover-empty" aria-hidden="true">{post?.title || "Blog"}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={post.images?.find((item) => item.cover)?.alt || post.title || ""}
      className="blog-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function BlogGallery({ title, images }) {
  const slides = (images || []).filter((image) => image?.url);
  const [index, setIndex] = useState(Math.max(0, slides.findIndex((image) => image.cover)));
  const [failed, setFailed] = useState({});
  const visible = slides.filter((image) => !failed[image.url]);
  if (!visible.length) return null;
  const current = visible[Math.min(index, visible.length - 1)];

  return (
    <figure className="blog-gallery">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.url}
        alt={current.alt || title || ""}
        className="blog-gallery-main"
        loading="lazy"
        onError={() => setFailed((state) => ({ ...state, [current.url]: true }))}
      />
      {current.caption ? <figcaption>{current.caption}</figcaption> : null}
      {visible.length > 1 ? (
        <div className="blog-gallery-nav">
          <button type="button" onClick={() => setIndex((value) => (value - 1 + visible.length) % visible.length)}>Previous</button>
          <div className="blog-gallery-thumbs">
            {visible.map((image, imageIndex) => (
              <button type="button" key={image.url} className={image.url === current.url ? "is-active" : ""} onClick={() => setIndex(imageIndex)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt || ""} loading="lazy" />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setIndex((value) => (value + 1) % visible.length)}>Next</button>
        </div>
      ) : null}
    </figure>
  );
}
