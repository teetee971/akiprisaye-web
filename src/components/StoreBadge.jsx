import React from "react";

export default function StoreBadge({ store, region }) {
  const flag = {
    GP: "🇬🇵", MQ: "🇲🇶", GF: "🇬🇫", RE: "🇷🇪", YT: "🇾🇹",
    PF: "🇵🇫", NC: "🇳🇨", WF: "🇼🇫", PM: "🇵🇲",
  }[region] || "🏬";

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5
                     rounded-full bg-slate-100 text-slate-700 text-xs">
      <span>{flag}</span>
      <span>{store}</span>
    </span>
  );
}
