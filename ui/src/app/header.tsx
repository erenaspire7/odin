export default function Header() {
  return (
    <div className="bg-black flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <div className="flex justify-center mb-1">
          <h1 className="font-inter text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            Odin
          </h1>
          <div className="ml-2 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-sm"></div>
        </div>
        <h2 className="font-poppins text-sm md:text-base uppercase tracking-widest text-zinc-400 mt-2">
          Architecting the Agentic Economy
        </h2>
      </div>

      {/* Custom image component */}
      <div className="w-full max-w-4xl mx-auto grid place-items-center p-4">
        <div className="w-full aspect-[16/9] bg-zinc-900 rounded-2xl border border-zinc-800 relative overflow-hidden">
          {/* This is where your image goes */}
          <img
            src="src/assets/bg/home.jpg"
            alt="Odin - Agentic Economy Visualization"
            className="w-full h-full object-cover"
          />

          {/* Optional overlay for text or effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
