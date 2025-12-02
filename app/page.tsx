import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-casino-black flex items-center justify-center px-4 md:px-8 lg:px-16">
      <div className="text-center space-y-8 max-w-2xl">
        <h1 className="text-6xl font-display text-casino-white mb-4">
          Casino Royale
        </h1>
        <p className="text-xl text-casino-gray-light mb-8">
          Private casino for friends - no real money, just fun competition
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-lg shadow-casino-accent-primary/20"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-casino-gray-darker text-casino-white font-semibold rounded-lg hover:bg-casino-gray-dark border border-casino-gray transition-all duration-150"
          >
            Register
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center text-sm">
          <Link
            href="/games/slots"
            className="px-4 py-2 rounded-lg bg-casino-black-lighter border border-casino-gray text-casino-gray-light hover:bg-casino-gray-darker transition-colors duration-150"
          >
            Go to Slots 🎰
          </Link>
          <Link
            href="/games/landmines"
            className="px-4 py-2 rounded-lg bg-casino-black-lighter border border-casino-gray text-casino-gray-light hover:bg-casino-gray-darker transition-colors duration-150"
          >
            Go to Landmines 💣
          </Link>
          <Link
            href="/games/roulette"
            className="px-4 py-2 rounded-lg bg-casino-black-lighter border border-casino-gray text-casino-gray-light hover:bg-casino-gray-darker transition-colors duration-150"
          >
            Go to Roulette 🎡
          </Link>
        </div>
      </div>
    </main>
  );
}

