import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

type AnimateInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export const AnimateIn = ({ children, className, delay = 0 }: AnimateInProps) => {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7",
        className
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};
