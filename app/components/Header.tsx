"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { getCart, getFavorites, subscribeToCart, subscribeToFavorites } from "@/lib/store";
import "./Header.css";

const navLinks = [
  { href: "/banden", label: "Banden" },
  { href: "/diensten", label: "Diensten" },
  { href: "/mobiele-service", label: "Mobiele Service" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
];

function HeaderInner() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
    setFavCount(getFavorites().length);

    const unsubCart = subscribeToCart((items) => {
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
    });
    const unsubFav = subscribeToFavorites((favs) => {
      setFavCount(favs.length);
    });

    return () => {
      unsubCart();
      unsubFav();
    };
  }, []);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    setUserDropdownOpen(false);
    setMenuOpen(false);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  }

  // Hide the public header on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const initials = session?.user?.name
    ? session.user.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "U";

  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "Account";

  return (
    <>
      <header className={`header${scrolled ? " header--scrolled" : ""}`}>
        <div className="container">
          <nav className="header__nav">
            {/* Logo */}
            <Link href="/" className="header__logo" onClick={() => setMenuOpen(false)}>
              <div className="header__logo-img-wrapper">
                <Image
                  src="/logo-icon.png"
                  alt="Gent Bandenservice BV"
                  width={42}
                  height={42}
                  className="header__logo-img"
                  priority
                />
              </div>
              <span className="header__logo-text">
                <span className="header__logo-brand">
                  <span style={{ color: "var(--primary-light)" }}>Gent</span>{" "}
                  <span>Bandenservice</span>
                </span>
                <span className="header__logo-sub">BV • Bandspecialist</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <ul className="header__links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="header__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* CTA + Auth + Burger */}
            <div className="header__actions">
              <Link href="/afspraak" className="btn btn--primary btn--sm header__cta">
                Afspraak maken
              </Link>

              {session ? (
                <div className="header__user-menu" ref={dropdownRef}>
                  <button
                    type="button"
                    className={`header__user-trigger${userDropdownOpen ? " header__user-trigger--active" : ""}`}
                    onClick={() => setUserDropdownOpen((v) => !v)}
                    aria-expanded={userDropdownOpen}
                    aria-label="Gebruikersmenu openen"
                  >
                    <span className="header__user-avatar">{initials}</span>
                    <span className="header__user-name">{firstName}</span>
                    <ChevronDownIcon open={userDropdownOpen} />
                  </button>

                  <div className={`header__user-dropdown${userDropdownOpen ? " header__user-dropdown--open" : ""}`}>
                    <div className="header__user-card">
                      <div className="header__user-avatar header__user-avatar--lg">{initials}</div>
                      <div className="header__user-details">
                        <strong className="header__user-fullname">{session.user.name}</strong>
                        <span className="header__user-email">{session.user.email}</span>
                        <span className={`header__role-badge${isAdmin ? " header__role-badge--admin" : ""}`}>
                          {isAdmin ? (
                            <>
                              <ShieldIcon />
                              <span>Beheerder</span>
                            </>
                          ) : (
                            <>
                              <UserIcon />
                              <span>Klant</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="header__dropdown-divider" />

                    <div className="header__dropdown-nav">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="header__dropdown-item"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <span className="header__dropdown-item-icon">
                            <DashboardIcon />
                          </span>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <Link
                        href="/account"
                        className="header__dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="header__dropdown-item-icon">
                          <UserIcon />
                        </span>
                        <span>Mijn account</span>
                      </Link>
                      <Link
                        href="/account?tab=orders"
                        className="header__dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="header__dropdown-item-icon">
                          <OrdersIcon />
                        </span>
                        <span>Mijn bestellingen</span>
                      </Link>
                      <Link
                        href="/afspraak?view=manage"
                        className="header__dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="header__dropdown-item-icon">
                          <CalendarIcon />
                        </span>
                        <span>Mijn afspraken</span>
                      </Link>
                      <Link
                        href="/afspraak"
                        className="header__dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="header__dropdown-item-icon">
                          <CalendarIcon />
                        </span>
                        <span>Nieuwe afspraak inplannen</span>
                      </Link>
                      <Link
                        href="/banden"
                        className="header__dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="header__dropdown-item-icon">
                          <TyreMenuIcon />
                        </span>
                        <span>Bandencatalogus</span>
                      </Link>
                    </div>

                    <div className="header__dropdown-divider" />

                    <button
                      type="button"
                      className="header__dropdown-item header__dropdown-signout"
                      onClick={handleSignOut}
                    >
                      <span className="header__dropdown-item-icon">
                        <LogOutIcon />
                      </span>
                      <span>Uitloggen</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/signin" className="btn btn--outline btn--sm header__cta">
                  Inloggen
                </Link>
              )}

              {/* Favorites icon */}
              <Link
                href="/banden?filter=favorites"
                className="header__icon-btn"
                aria-label={`Favorieten bekijken (${favCount})`}
                title="Favorieten bekijken"
              >
                <HeartHeaderIcon />
                {favCount > 0 && <span className="header__badge header__badge--fav">{favCount}</span>}
              </Link>

              {/* Cart icon */}
              <button
                type="button"
                className="header__icon-btn"
                onClick={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(new CustomEvent("gent-open-cart"));
                }}
                aria-label={`Winkelmand bekijken (${cartCount})`}
                title="Winkelmand openen"
              >
                <CartHeaderIcon />
                {cartCount > 0 && <span className="header__badge">{cartCount}</span>}
              </button>

              <button
                className={`header__burger${menuOpen ? " header__burger--open" : ""}`}
                aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`mobile-menu${menuOpen ? " mobile-menu--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="mobile-menu__backdrop" onClick={() => setMenuOpen(false)} />
        <div className="mobile-menu__panel">
          {/* Mobile User Profile Section */}
          {session ? (
            <div className="mobile-user-card">
              <div className="mobile-user-card__top">
                <div className="header__user-avatar header__user-avatar--lg">{initials}</div>
                <div className="mobile-user-card__info">
                  <strong>{session.user.name}</strong>
                  <span>{session.user.email}</span>
                  <span className={`header__role-badge${isAdmin ? " header__role-badge--admin" : ""}`}>
                    {isAdmin ? (
                      <>
                        <ShieldIcon />
                        <span>Beheerder</span>
                      </>
                    ) : (
                      <>
                        <UserIcon />
                        <span>Klant</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="mobile-user-card__links">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="mobile-user-card__link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <DashboardIcon />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  className="mobile-user-card__link"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserIcon />
                  <span>Mijn account</span>
                </Link>
                <Link
                  href="/account?tab=orders"
                  className="mobile-user-card__link"
                  onClick={() => setMenuOpen(false)}
                >
                  <OrdersIcon />
                  <span>Mijn bestellingen</span>
                </Link>
                <Link
                  href="/afspraak?view=manage"
                  className="mobile-user-card__link"
                  onClick={() => setMenuOpen(false)}
                >
                  <CalendarIcon />
                  <span>Mijn afspraken</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mobile-user-guest">
              <Link
                href="/auth/signin"
                className="btn btn--outline btn--sm w-full"
                style={{ justifyContent: "center" }}
                onClick={() => setMenuOpen(false)}
              >
                Inloggen / Registreren
              </Link>
            </div>
          )}

          <nav className="mobile-menu__nav">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="mobile-menu__link"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
                <ArrowRightIcon />
              </Link>
            ))}
            <Link
              href="/afspraak"
              className="btn btn--primary w-full mobile-menu__cta"
              onClick={() => setMenuOpen(false)}
            >
              Afspraak maken
            </Link>

            {session && (
              <button
                type="button"
                className="mobile-menu__signout"
                onClick={handleSignOut}
              >
                <LogOutIcon />
                <span>Uitloggen</span>
              </button>
            )}
          </nav>

          <div className="mobile-menu__info">
            <a href="tel:+32467871205" className="mobile-menu__contact">
              <PhoneIcon /> 0467 87 12 05
            </a>
            <span className="mobile-menu__hours">Ma–Za: 09:00–18:00 | Zo: Gesloten</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="header__user-chevron"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 200ms ease",
      }}
      aria-hidden="true"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14.5 10.94c0 .24-.05.47-.16.69-.11.22-.26.43-.45.61-.32.3-.67.44-1.04.44-.27 0-.56-.06-.87-.2-.31-.13-.62-.31-.93-.55-.31-.24-.62-.51-.91-.81-.29-.3-.56-.61-.81-.93-.24-.31-.43-.62-.56-.92-.13-.31-.2-.6-.2-.87 0-.26.06-.51.17-.74.11-.23.28-.44.51-.62L11.35 5.5c.18-.14.38-.21.57-.21.24 0 .43.08.58.23l1.3 1.3c.15.15.22.33.22.52 0 .23-.07.45-.21.67-.14.21-.3.41-.51.59-.04.03-.07.07-.07.12 0 .05.02.1.06.14l1.13 1.13c.15.15.22.33.22.54z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TyreMenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="3" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21" />
      <line x1="3" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function CartHeaderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function HeartHeaderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<div className="header" style={{ height: 72 }} />}>
      <HeaderInner />
    </Suspense>
  );
}
