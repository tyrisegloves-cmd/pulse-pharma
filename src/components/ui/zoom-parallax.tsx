'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

interface Image {
  src: string;
  alt?: string;
}

interface ZoomParallaxProps {
  /** Array of images — index 0 is the full-screen centerpiece, 1–6 are satellites */
  images: Image[];
}

// Satellite layout: each entry describes how the inner image div is positioned
// relative to the sticky viewport (50vw / 50vh is dead-centre).
// All values are CSS strings so they drop straight into style props.
const satelliteLayout = [
  // index 1 — top-left wide banner
  { top: '5vh',   left: '5vw',   width: '38vw', height: '28vh' },
  // index 2 — mid-left tall tile
  { top: '20vh',  left: '5vw',   width: '22vw', height: '40vh' },
  // index 3 — top-right wide banner
  { top: '5vh',   right: '5vw',  width: '38vw', height: '28vh' },
  // index 4 — bottom-left
  { bottom: '8vh', left: '5vw',  width: '22vw', height: '25vh' },
  // index 5 — bottom-right
  { bottom: '8vh', right: '5vw', width: '38vw', height: '25vh' },
  // index 6 — mid-right tall tile
  { top: '20vh',  right: '5vw',  width: '22vw', height: '40vh' },
] as const;

export function ZoomParallax({ images }: ZoomParallaxProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  // Centerpiece zooms the most — it fills the frame by the end of the scroll
  const scaleCenter = useTransform(scrollYProgress, [0, 1], [1, 4]);
  // Satellites zoom slower so they peel away before the centre takes over
  const satelliteScales = [
    useTransform(scrollYProgress, [0, 1], [1, 5]),
    useTransform(scrollYProgress, [0, 1], [1, 6]),
    useTransform(scrollYProgress, [0, 1], [1, 5]),
    useTransform(scrollYProgress, [0, 1], [1, 6]),
    useTransform(scrollYProgress, [0, 1], [1, 8]),
    useTransform(scrollYProgress, [0, 1], [1, 9]),
  ];

  return (
    <div ref={container} className="relative h-[300vh]">
      {/* Sticky frame — clips everything to the viewport height */}
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* ── Centerpiece (index 0) ── fills the whole frame */}
        {images[0] && (
          <motion.div
            style={{ scale: scaleCenter }}
            className="absolute inset-0"
          >
            <Image
              src={images[0].src}
              alt={images[0].alt ?? 'Pharmacy showcase'}
              fill
              sizes="100vw"
              className="h-full w-full object-cover object-center"
              priority
            />
          </motion.div>
        )}

        {/* ── Satellite tiles (index 1–6) ── */}
        {images.slice(1).map((img, i) => {
          const layout = satelliteLayout[i];
          if (!layout) return null;
          const scale = satelliteScales[i];

          return (
            <motion.div
              key={i + 1}
              style={{ scale }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="absolute overflow-hidden rounded-lg shadow-xl"
                style={layout as React.CSSProperties}
              >
                <Image
                  src={img.src}
                  alt={img.alt ?? `Showcase image ${i + 2}`}
                  fill
                  sizes="(max-width: 768px) 38vw, 22vw"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

