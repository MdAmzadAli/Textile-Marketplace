import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui";
import { ProductGrid } from "../components/product/ProductGrid";
import { listCategories } from "../services/categories.api";
import { listProducts, listTrendingProducts } from "../services/products.api";
import { cn } from "../utils/cn";

interface Slide {
  seed: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  to: string;
}

const AUTOPLAY_MS = 5500;

// Homepage answers one question in the first 5 seconds: "can I find what I
// need here, fast?" A single full-bleed hero carousel makes the pitch (why
// buy here) with one clear action, then hands off immediately to real
// product data (Trending, New Arrivals) — no wall of promo tiles to scan
// through first.
export default function HomePage() {
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const findCategory = (match: string) => categories.find((c) => c.name.toLowerCase().includes(match));

  const { data: trending, isLoading: trendingLoading, isError: trendingError, refetch: refetchTrending } = useQuery({
    queryKey: ["products", "trending"],
    queryFn: () => listTrendingProducts(8),
  });

  const { data: newArrivals, isLoading: arrivalsLoading, isError: arrivalsError, refetch: refetchArrivals } = useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: () => listProducts({ status: "active", limit: 8, sort: "newest" }),
  });

  const fabricsCat = findCategory("fabric");
  const trimsCat = findCategory("trims");

  const slides: Slide[] = [
    {
      seed: "hero-fabric-main",
      eyebrow: "Wholesale, not retail",
      title: "Source fabric straight from verified suppliers",
      subtitle: "No middlemen, no minimum-order guesswork — browse real stock, real MOQs, real prices.",
      cta: "Shop all fabrics",
      to: fabricsCat ? `/category/${fabricsCat.id}` : "/discover",
    },
    {
      seed: "hero-trims",
      eyebrow: "Every finishing touch",
      title: "Trims, buttons, zippers & more — in bulk",
      subtitle: "Round out your production run without juggling a dozen separate vendors.",
      cta: "Shop notions",
      to: trimsCat ? `/category/${trimsCat.id}` : "/discover",
    },
    {
      seed: "hero-sell",
      eyebrow: "For manufacturers & mills",
      title: "Have inventory to move? Reach buyers directly",
      subtitle: "List your catalog once and get discovered by businesses ordering at scale.",
      cta: "Become a seller",
      to: "/register?role=supplier",
    },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <HeroCarousel slides={slides} active={active} setActive={setActive} onNavigate={navigate} />

      {/* Trending Now — ranked by real order volume */}
      <section className="bg-surface border-b border-border">
        <PageContainer className="py-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" aria-hidden />
              <h2 className="font-display text-2xl text-text-primary">Trending now</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/categories?focus=trending")}>
              View all
            </Button>
          </div>
          <ProductGrid
            products={trending ?? []}
            isLoading={trendingLoading}
            isError={trendingError}
            onRetry={() => refetchTrending()}
            emptyTitle="Nothing trending yet"
            emptyDescription="Once orders start coming in, best-sellers will show up here."
          />
        </PageContainer>
      </section>

      {/* New Arrivals — most recently listed, active stock */}
      <section>
        <PageContainer className="py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-text-primary">New arrivals</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/categories?focus=new")}>
              View all
            </Button>
          </div>
          <ProductGrid
            products={newArrivals?.items ?? []}
            isLoading={arrivalsLoading}
            isError={arrivalsError}
            onRetry={() => refetchArrivals()}
            emptyTitle="No items listed yet"
            emptyDescription="Check back soon, or become a seller to be the first."
          />
        </PageContainer>
      </section>

      <Footer />
    </div>
  );
}

function HeroCarousel({
  slides,
  active,
  setActive,
  onNavigate,
}: {
  slides: Slide[];
  active: number;
  setActive: (i: number) => void;
  onNavigate: (to: string) => void;
}) {
  const slide = slides[active];

  return (
    <section className="relative w-full h-[380px] md:h-[480px] overflow-hidden bg-primary">
      {slides.map((s, i) => (
        <img
          key={s.seed}
          src={`https://picsum.photos/seed/${s.seed}/1920/900`}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-slow",
            i === active ? "opacity-100" : "opacity-0"
          )}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-text-primary/80 via-text-primary/40 to-transparent" />

      <div className="relative h-full mx-auto max-w-[1440px] px-4 md:px-6 flex items-center">
        <div className="max-w-xl flex flex-col items-start gap-3 md:gap-4">
          <span className="text-xs md:text-sm font-500 tracking-wide uppercase text-white/80">
            {slide.eyebrow}
          </span>
          <h1 className="font-display text-white text-3xl md:text-5xl leading-tight text-balance">
            {slide.title}
          </h1>
          <p className="text-white/85 text-sm md:text-base max-w-md">{slide.subtitle}</p>
          <Button size="lg" onClick={() => onNavigate(slide.to)} className="mt-1">
            {slide.cta}
          </Button>
        </div>
      </div>

      {/* Manual controls — carousel still autoplays, this just lets people skip ahead */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => setActive((active - 1 + slides.length) % slides.length)}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white items-center justify-center transition-fast"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => setActive((active + 1) % slides.length)}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white items-center justify-center transition-fast"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.seed}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={cn(
              "h-1.5 rounded-full transition-fast",
              i === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}
