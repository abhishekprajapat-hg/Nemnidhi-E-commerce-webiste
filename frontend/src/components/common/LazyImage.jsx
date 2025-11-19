// src/components/common/LazyImage.jsx
import React, { useRef, useState, useEffect } from "react";

export default function LazyImage({
  src,
  alt = "",
  className = "",
  style = {},
  placeholder, // small base64 or low-res URL
  width,
  height,
  srcSet, // optional responsive srcset string
  sizes,  // optional sizes attribute
  ...rest
}) {
  const imgRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;
    if ("loading" in HTMLImageElement.prototype) {
      // browser supports native lazy loading: still observe for placeholder fade
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: "200px" } // start loading slightly earlier
    );
    obs.observe(imgRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={`lazy-image-wrapper ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        width: width ? (typeof width === "number" ? `${width}px` : width) : "100%",
        height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
        ...style,
      }}
    >
      {/* Low-res placeholder */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt={alt}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(8px)",
            transform: "scale(1.02)",
          }}
        />
      )}

      {visible && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "opacity 300ms ease, transform 300ms ease",
            opacity: loaded ? 1 : 0,
          }}
          {...rest}
        />
      )}
    </div>
  );
}
