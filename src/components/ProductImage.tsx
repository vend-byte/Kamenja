"use client";

import { useState } from "react";

const FALLBACK = "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=1200";

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

export default function ProductImage({ src, alt, className, fallback = FALLBACK }: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback ?? FALLBACK)}
    />
  );
}