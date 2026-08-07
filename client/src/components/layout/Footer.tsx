export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-6 text-sm text-text-muted">
        © {new Date().getFullYear()} Textile Marketplace — B2B fabric sourcing, simplified.
      </div>
    </footer>
  );
}
