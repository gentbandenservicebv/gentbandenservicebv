import React from "react";
import "../collecties.css";

export default function CollectionDetailSkeleton() {
  return (
    <div className="collecties-page" aria-busy="true" aria-label="Collectie laden">
      {/* Header & Breadcrumb Skeleton */}
      <div className="page-hero bg-dark" style={{ paddingBottom: 24 }}>
        <div className="container">
          <div className="bc-breadcrumb" style={{ marginBottom: 18 }}>
            <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 45, height: 14 }} />
            <span className="separator">/</span>
            <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 140, height: 14 }} />
            <span className="separator">/</span>
            <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 110, height: 14 }} />
          </div>

          {/* Hero Banner Skeleton */}
          <div
            className="collectie-hero-banner"
            style={{
              background: "#161822",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              className="collectie-skeleton"
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.6,
              }}
            />

            <div className="collectie-hero-banner__content" style={{ position: "relative", zIndex: 2 }}>
              {/* Badges */}
              <div className="collectie-hero-banner__badges" style={{ marginBottom: 16 }}>
                <span className="collectie-skeleton collectie-skeleton-pill" style={{ width: 130, height: 26 }} />
                <span className="collectie-skeleton collectie-skeleton-pill" style={{ width: 110, height: 26 }} />
                <span className="collectie-skeleton collectie-skeleton-pill" style={{ width: 100, height: 26 }} />
              </div>

              {/* Title */}
              <div
                className="collectie-skeleton collectie-skeleton-box"
                style={{ width: "65%", maxWidth: 500, height: 38, marginBottom: 14 }}
              />

              {/* Description */}
              <div
                className="collectie-skeleton collectie-skeleton-box"
                style={{ width: "85%", maxWidth: 700, height: 18, marginBottom: 8 }}
              />
              <div
                className="collectie-skeleton collectie-skeleton-box"
                style={{ width: "50%", maxWidth: 420, height: 18 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Centered Content */}
      <div className="container" style={{ paddingBottom: 80, paddingTop: 16 }}>
        <div className="collectie-detail-container">
          {/* Symmetrical 2-Column Axle Grid: VOORAS & ACHTERAS */}
          <div className="collectie-axles-grid">
            {/* VOORAS CARD SKELETON */}
            <div className="collectie-axle-box collectie-axle-box--front" style={{ background: "#161822", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="collectie-skeleton collectie-skeleton-pill" style={{ width: 140, height: 24, marginBottom: 16 }} />

              {/* Tire Image Circle */}
              <div className="collectie-axle-box__img-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  className="collectie-skeleton collectie-skeleton-circle"
                  style={{ width: 150, height: 150 }}
                />
              </div>

              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "70%", height: 22, marginTop: 14, marginBottom: 8 }} />
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "45%", height: 20, marginBottom: 12 }} />

              {/* Stock line */}
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "55%", height: 16, marginBottom: 12 }} />

              {/* Specs line */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 60, height: 14 }} />
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 60, height: 14 }} />
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 70, height: 14 }} />
              </div>

              {/* Price block */}
              <div className="collectie-axle-box__price-block">
                <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 90, height: 28, marginBottom: 6 }} />
                <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 130, height: 14 }} />
              </div>

              {/* Action button */}
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "100%", height: 42, borderRadius: 8, marginTop: 14 }} />
            </div>

            {/* ACHTERAS CARD SKELETON */}
            <div className="collectie-axle-box collectie-axle-box--rear" style={{ background: "#161822", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="collectie-skeleton collectie-skeleton-pill" style={{ width: 160, height: 24, marginBottom: 16 }} />

              {/* Tire Image Circle (Wider) */}
              <div className="collectie-axle-box__img-wrap collectie-axle-box__img-wrap--rear" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  className="collectie-skeleton collectie-skeleton-circle"
                  style={{ width: 170, height: 170 }}
                />
              </div>

              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "75%", height: 22, marginTop: 14, marginBottom: 8 }} />
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "48%", height: 20, marginBottom: 12 }} />

              {/* Stock line */}
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "55%", height: 16, marginBottom: 12 }} />

              {/* Specs line */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 60, height: 14 }} />
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 60, height: 14 }} />
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 70, height: 14 }} />
              </div>

              {/* Price block */}
              <div className="collectie-axle-box__price-block">
                <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 90, height: 28, marginBottom: 6 }} />
                <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 130, height: 14 }} />
              </div>

              {/* Action button */}
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "100%", height: 42, borderRadius: 8, marginTop: 14 }} />
            </div>
          </div>

          {/* COMPLETE SET BANNER SKELETON */}
          <div className="collectie-set-banner" style={{ background: "#161822", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div className="collectie-skeleton collectie-skeleton-pill" style={{ width: 180, height: 22, marginBottom: 12 }} />
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "70%", height: 26, marginBottom: 10 }} />
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "85%", height: 16, marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 120, height: 14 }} />
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 120, height: 14 }} />
                <span className="collectie-skeleton collectie-skeleton-box" style={{ width: 100, height: 14 }} />
              </div>
            </div>

            <div className="collectie-set-banner__actions">
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 140, height: 12, marginBottom: 6 }} />
                <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 110, height: 34, marginBottom: 4 }} />
                <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 160, height: 12 }} />
              </div>

              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "100%", height: 50, borderRadius: 10 }} />
              <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "100%", height: 36, borderRadius: 8 }} />
            </div>
          </div>

          {/* GUARANTEE BOX SKELETON */}
          <div
            style={{
              background: "rgba(1, 110, 185, 0.05)",
              border: "1px solid rgba(1, 110, 185, 0.15)",
              borderRadius: 14,
              padding: "22px 28px",
            }}
          >
            <div className="collectie-skeleton collectie-skeleton-box" style={{ width: 220, height: 18, marginBottom: 10 }} />
            <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "95%", height: 14, marginBottom: 6 }} />
            <div className="collectie-skeleton collectie-skeleton-box" style={{ width: "80%", height: 14 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
