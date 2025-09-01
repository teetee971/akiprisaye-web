import clsx from "clsx";

export default function Button({as:As="button", className, variant="solid", ...props}) {
  const base = "btn";
  const outline = "btn-outline";
  return <As className={clsx(variant==="outline" ? outline : base, className)} {...props} />;
}
