import Image from "next/image";
import Link from "next/link";
import "./BrandsSection.css";

const brands = [
  { name: "Michelin", logo: "/brands/michelin.svg" },
  { name: "Continental", logo: "/brands/continental.svg" },
  { name: "Bridgestone", logo: "/brands/bridgestone.svg" },
  { name: "Pirelli", logo: "/brands/pirelli.svg" },
  { name: "Goodyear", logo: "/brands/goodyear.svg" },
  { name: "Dunlop", logo: "/brands/dunlop.svg" },
  { name: "Hankook", logo: "/brands/hankook.svg" },
  { name: "Yokohama", logo: "/brands/yokohama.svg" },
  { name: "Toyo Tires", logo: "/brands/toyo.svg" },
  { name: "Falken", logo: "/brands/falken.svg" },
  { name: "BFGoodrich", logo: "/brands/bfgoodrich.svg" },
  { name: "Nokian Tyres", logo: "/brands/nokian.svg" },
];

export default function BrandsSection() {
  // Duplicate for seamless infinite marquee loop
  const doubled = [...brands, ...brands];

  return (
    <section className="brands-section">
      <div className="container">
        <div className="section-header" style={{ marginBottom: 36, textAlign: "center" }}>
          <span className="label">Officiële Merken</span>
          <h2 className="h2 text-dark">Alle A-merk banden in voorraad</h2>
          <p className="text-muted" style={{ maxWidth: 540, margin: "10px auto 0", fontSize: "0.95rem" }}>
            Van premium topmerken tot voordelige kwaliteitsbanden — nieuw en geteste tweedehands banden direct leverbaar.
          </p>
        </div>
      </div>

      {/* Marquee with real brand vector logos */}
      <div className="brands-marquee" aria-label="Officiële bandmerken">
        <div className="marquee-track brands-track">
          {doubled.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="brand-item"
              title={`${brand.name} banden Gent`}
            >
              <div className="brand-item__logo-wrap">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  width={180}
                  height={56}
                  className="brand-item__logo"
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <p className="brands-note">
          Zoekt u een specifiek merk of een minder courante maat? Wij bestellen en monteren het snel voor u.{" "}
          <Link href="/contact" className="brands-note__link">
            Vraag direct aan →
          </Link>
        </p>
      </div>
    </section>
  );
}
