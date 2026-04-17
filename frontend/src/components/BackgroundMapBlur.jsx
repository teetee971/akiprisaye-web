/**
 * BackgroundMapBlur - Chic background for Civic Glass design
 * Subtle blurred map at 20% opacity - NOT decorative, just institutional
 */
export default function BackgroundMapBlur() {
  return (
    <div className="background-map-blur">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Simplified map-like pattern - subtle and abstract */}
        <defs>
          <pattern id="map-grid" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <path
              d="M 0 0 L 200 0 M 0 50 L 200 50 M 0 100 L 200 100 M 0 150 L 200 150 M 50 0 L 50 200 M 100 0 L 100 200 M 150 0 L 150 200"
              stroke="rgba(74, 163, 255, 0.1)"
              strokeWidth="0.5"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
        {/* Subtle territorial shapes - abstract representation */}
        <circle cx="480" cy="270" r="120" fill="rgba(74, 163, 255, 0.05)" />
        <circle cx="1440" cy="810" r="150" fill="rgba(110, 231, 183, 0.05)" />
        <circle cx="960" cy="540" r="90" fill="rgba(74, 163, 255, 0.03)" />
      </svg>
    </div>
  );
}
