import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import emblemImg from "@/assets/biolink_emblem.png";

type BrandLogoProps = {
  className?: string;
  emblemClassName?: string;
  onClick?: () => void;
};

export const BrandLogo = ({ className, emblemClassName, onClick }: BrandLogoProps) => (
  <Link
    to="/"
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-2 sm:gap-2.5 font-serif text-base sm:text-lg tracking-tight text-foreground shrink min-w-0",
      className,
    )}
  >
    <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm">
      <img
        src={emblemImg}
        alt=""
        className={cn("h-full w-full object-contain", emblemClassName)}
        width={36}
        height={36}
        fetchPriority="high"
      />
    </span>
    <span className="truncate">
      Biopharm<span className="text-primary">lifescience</span>
    </span>
  </Link>
);
