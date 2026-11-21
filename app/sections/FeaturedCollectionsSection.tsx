import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import "./FeaturedCollectionsSection.css";

const SEASON_LABEL: Record<string, string> = {
  SUMMER: "Zomer",
  WINTER: "Winter",
  ALL_SEASON: "All-season",
};

const SEASON_EMOJI: Record<string, string> = {
  SUMMER: "☀️",
  WINTER: "❄️",
  ALL_SEASON: "🌦️",
};

export default async function FeaturedCollectionsSection() {
  let collections: Awaited<ReturnType<typeof fetchFeatured>> = [];

  try {
    collections = await fetchFeatured();
  } catch {
    // Silently skip section if DB is unavailable during build/ISR
    return null;
  }

  if (!collections.length) return null;

  return (
    <section className="section fcs" id="breedsets">
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <span className="label">Uitgelichte breedsets</span>
          <h2 className="h2">
            Staggered sets voor<br />uw specifiek voertuig
          </h2>
          <span className="divider divider--center" />
          <p className="lead">
            Kant-en-klare voor- en achterassets, samengesteld door onze specialisten.
            Bestel in één klik — inclusief montage op afspraak.
          </p>
        </div>

        {/* Grid */}
        <ul className="fcs__grid" role="list">
          {collections.map((col) => {
            const frontItem = col.items.find((it) => it.axle === "FRONT") ?? col.items[0];
            const rearItem = col.items.find((it) => it.axle === "REAR") ?? col.items[1];
            const frontImg = frontItem?.tyre?.images?.[0]?.url;
            const rearImg = rearItem?.tyre?.images?.[0]?.url;
            const frontTyre = frontItem?.tyre;
            const rearTyre = rearItem?.tyre;
            const totalPrice =
              (frontTyre?.price ?? 0) * (frontItem?.quantity ?? 2) +
              (rearTyre?.price ?? 0) * (rearItem?.quantity ?? 2);

            return (
              <li key={col.id}>
                <Link href={`/collecties/${col.slug}`} className="fcs__card" aria-label={col.name}>
                  {/* Cover image OR tyre showcase */}
                  <div className="fcs__card-media">
                    {col.imageUrl ? (
                      <Image
                        src={col.imageUrl}
                        alt={col.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                        className="fcs__card-cover"
                      />
                    ) : (
                      <div className="fcs__card-tyres">
                        {frontImg && (
                          <div className="fcs__card-tyre fcs__card-tyre--front">
                            <Image
                              src={frontImg}
                              alt={frontTyre ? `${frontTyre.brand} ${frontTyre.size}` : "Voorasband"}
                              width={120}
                              height={120}
                              className="fcs__card-tyre-img"
                            />
                            <span className="fcs__card-tyre-label">Voor</span>
                          </div>
                        )}
                        {rearImg && (
                          <div className="fcs__card-tyre fcs__card-tyre--rear">
                            <Image
                              src={rearImg}
                              alt={rearTyre ? `${rearTyre.brand} ${rearTyre.size}` : "Achteras"}
                              width={148}
                              height={148}
                              className="fcs__card-tyre-img"
                            />
                            <span className="fcs__card-tyre-label">Achter</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Badges on image */}
                    <div className="fcs__card-badges">
                      {col.vehicleBrand && (
                        <span className="fcs__badge fcs__badge--brand">{col.vehicleBrand}</span>
                      )}
                      <span className="fcs__badge fcs__badge--season">
                        {SEASON_EMOJI[col.season]} {SEASON_LABEL[col.season] ?? col.season}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="fcs__card-body">
                    <div className="fcs__card-top">
                      <h3 className="fcs__card-name">{col.name}</h3>
                      {totalPrice > 0 && (
                        <div className="fcs__card-price">
                          <span className="fcs__card-price-from">v.a.</span>
                          <span className="fcs__card-price-val">
                            €{totalPrice.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="fcs__card-price-unit">/set</span>
                        </div>
                      )}
                    </div>

                    {col.description && (
                      <p className="fcs__card-desc">{col.description}</p>
                    )}

                    {/* Sizes */}
                    {(frontTyre || rearTyre) && (
                      <div className="fcs__card-sizes">
                        {frontTyre && (
                          <span className="fcs__size-pill fcs__size-pill--front">
                            Voor: {frontTyre.size}
                          </span>
                        )}
                        {rearTyre && (
                          <span className="fcs__size-pill fcs__size-pill--rear">
                            Achter: {rearTyre.size}
                          </span>
                        )}
                      </div>
                    )}

                    <span className="fcs__card-cta">
                      Bekijk set
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer CTA */}
        <div className="fcs__footer">
          <Link href="/collecties" className="btn btn--outline btn--lg fcs__footer-link">
            Alle breedsets bekijken
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

async function fetchFeatured() {
  "use cache";
  return prisma.tyreCollection.findMany({
    where: { featured: true, active: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          tyre: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
}
