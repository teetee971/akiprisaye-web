interface ProductHeaderProps {
  name: string;
  barcode: string;
  image?: string;
}

export function ProductHeader({ name, barcode, image }: ProductHeaderProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {image && (
        <div className="h-[208px] w-full overflow-hidden">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            width={600}
            height={208}
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5">
        <div className="text-lg font-semibold text-white">{name}</div>
        <div className="mt-1 font-mono text-sm text-zinc-500">{barcode}</div>
      </div>
    </div>
  );
}
