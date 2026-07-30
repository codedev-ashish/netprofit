"use client";

import Link from "next/link";
import { useRef } from "react";
import styles from "./HorizontalSlider.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export interface SliderItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link: string;
  tag?: string;
  date?: string;
  status?: string;
}

interface HorizontalSliderProps {
  title: string;
  items: SliderItem[];
  viewAllLink: string;
}

export default function HorizontalSlider({ title, items, viewAllLink }: HorizontalSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // approximate width of one card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={styles.sliderSection}>
      <div className={styles.sliderInner}>
        <div className={styles.sliderHeader}>
          <h2 className={styles.sliderTitle}>{title}</h2>
          <div className={styles.headerControls}>
            <div className={styles.navArrows}>
              <button className={styles.navArrowBtn} onClick={() => scroll('left')} aria-label="Scroll left">
                <ChevronLeft size={20} />
              </button>
              <button className={styles.navArrowBtn} onClick={() => scroll('right')} aria-label="Scroll right">
                <ChevronRight size={20} />
              </button>
            </div>
            <Link href={viewAllLink} className={styles.viewAll}>
              View All →
            </Link>
          </div>
        </div>
        
        <div className={styles.sliderContainer} ref={scrollContainerRef}>
          {items.map((item) => (
            <Link key={item.id} href={item.link} className={styles.card}>
              {item.image && (
                <div style={{ position: 'relative', width: '100%', height: '180px', flexShrink: 0 }}>
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 80vw, 280px" className={styles.cardImage} style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div className={styles.cardContent}>
                {item.tag && <div className={styles.cardTag}>{item.tag}</div>}
                {item.status && <div className={styles.cardTag} style={{ color: item.status === 'Active' ? '#10b981' : '#f59e0b' }}>{item.status}</div>}
                <h3 className={styles.cardTitle}>{item.title}</h3>
                {item.description && (
                  <p className={styles.cardDescription}>{item.description}</p>
                )}
                {item.date && (
                  <div className={styles.cardFooter}>
                    <span>{item.date}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
