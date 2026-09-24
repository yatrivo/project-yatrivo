import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f5]">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-[#0f2922] text-[#e8622a] flex items-center justify-center text-3xl font-bold mb-6">
          ?
        </div>
        <p className="text-[#e8622a] text-xs font-semibold tracking-widest uppercase mb-2">
          404 ERROR — TRAIL NOT FOUND
        </p>
        <h1
          className="text-[#0f2922] text-4xl sm:text-5xl font-bold mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Off the Chart
        </h1>
        <p className="text-[#4a5568] text-base max-w-md mb-8 leading-relaxed">
          The ridge you are looking for doesn't exist, has shifted, or the path is temporarily closed. Let's get you back on track.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="bg-[#0f2922] hover:bg-[#1a4a39] text-white px-7 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Return to Home
          </Link>
          <Link
            to="/destinations"
            className="border border-[#0f2922] text-[#0f2922] hover:bg-[#0f2922] hover:text-white px-7 py-3 rounded-full text-sm font-medium transition-all"
          >
            Explore Destinations
          </Link>
          <Link
            to="/trips"
            className="bg-[#e8622a] hover:bg-[#d45520] text-white px-7 py-3 rounded-full text-sm font-medium transition-colors"
          >
            Browse All Trips
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
