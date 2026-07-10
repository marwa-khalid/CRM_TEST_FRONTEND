// Full-screen spinner overlay (matches the GeneralDetailsForm loader)
export const SpinnerLoader = () => (
  <div className="fixed inset-0 z-[9999] bg-[#e8e6df]/80 flex items-center justify-center font-['Stack_Sans_Headline']">
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

export default SpinnerLoader;
