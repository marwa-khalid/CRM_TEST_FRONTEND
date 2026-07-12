// Full-screen grey overlay spinner — a Fleet-local copy of the Claims
// SpinnerLoader (kept inside Fleet so the module stays independent of Claims).
// Warm-grey backdrop + 12 fading grey spokes (uses the global `animate-loaderFade`).
export const FleetSpinnerLoader = () => (
  <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-sans-headline">
    <div className="relative w-[73px] h-[73px]">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-1/2 w-[6px] h-[16px] rounded-full bg-[#9b9b9b] animate-loaderFade"
          style={{
            transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-25px)`,
            animationDelay: `${index * 0.08}s`,
          }}
        />
      ))}
    </div>
  </div>
);

export default FleetSpinnerLoader;
