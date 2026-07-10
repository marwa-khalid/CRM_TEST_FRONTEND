type PageLoaderProps = {
  label?: string;
};

export const PageLoader = ({ label = "Loading..." }: PageLoaderProps) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] rounded-lg">
      <div className="flex flex-col items-center gap-4">
        {/* Dual-ring spinner in brand colours */}
        <div className="relative w-12 h-12">
          {/* Outer track */}
          <div className="absolute inset-0 rounded-full border-[3px] border-[#E9EAEB]" />
          {/* Spinning arc */}
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0352FD] border-r-[#414651] animate-spin" />
        </div>

        {/* Pulsing dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#414651] animate-loaderFade"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        <p className="text-[13px] font-light text-[#535862] tracking-wide">
          {label}
        </p>
      </div>
    </div>
  );
};
