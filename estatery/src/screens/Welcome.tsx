"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import Image from "next/image";
import { Calendar, MapPin, Users, Home, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const BRAND = "Estatery";

export default function Welcome() {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = React.useState<"rent" | "buy" | "sell">("rent");
  const [location, setLocation] = React.useState("");
  const [moveInDate, setMoveInDate] = React.useState("");

  const handleBrowseProperties = () => {
    navigate("/auth/login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--logo-muted)]">
      {/* Top-right Login & Sign up buttons - no nav bar */}
      <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
        <Link
          to="/auth/login"
          className="rounded-xl border-2 border-[#90caf9] bg-white px-5 py-2.5 text-sm font-semibold text-[#1976d2] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e3f2fd] hover:shadow-md"
        >
          Login
        </Link>
        <Link
          to="/auth/Signup"
          className="rounded-xl bg-[var(--logo)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] hover:shadow-lg"
        >
          Sign up
        </Link>
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left: Hero content */}
        <div className="flex flex-1 flex-col justify-center px-6 py-20 lg:max-w-[55%] lg:px-16 lg:py-24">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2">
            <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl object-contain" />
            <span className="text-2xl font-bold text-[#1565c0]">{BRAND}</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight text-[#1565c0] lg:text-5xl">
            Buy, rent, or sell your property easily.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-[#1976d2]">
            A great platform to buy, sell, or even rent your properties without any commissions.
          </p>

          {/* Search component */}
          <div className="mt-10 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl shadow-slate-200/50">
            <div className="flex gap-6 border-b border-[#e2e8f0] pb-4">
              {(["rent", "buy", "sell"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSearchTab(tab)}
                  className={cn(
                    "relative pb-1 text-sm font-semibold capitalize transition-colors",
                    searchTab === tab
                      ? "text-[var(--logo)]"
                      : "text-[#64748b] hover:text-[#1e293b]"
                  )}
                >
                  {tab}
                  {searchTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--logo)]" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="Barcelona, Spain"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] py-3 pl-10 pr-4 text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="Select Move-in Date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] py-3 pl-10 pr-4 text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <button
                type="button"
                onClick={handleBrowseProperties}
                className="rounded-xl bg-[var(--logo)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] hover:shadow-lg"
              >
                Browse Properties
              </button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 flex flex-wrap gap-10">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--logo)]/30 text-[#1565c0]">
                <Users className="size-7" />
              </div>
              <div>
                <p className="font-bold text-[#1565c0]">50k+ renters</p>
                <p className="text-sm text-[#1976d2]">believe in our service</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--logo)]/30 text-[#1565c0]">
                <Home className="size-7" />
              </div>
              <div>
                <p className="font-bold text-[#1565c0]">10k+ properties</p>
                <p className="text-sm text-[#1976d2]">and houses ready for occupancy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Background image */}
        <div className="relative hidden min-h-[50vh] flex-1 lg:block">
          <div className="absolute inset-0">
            <Image
              src="/login_home.png"
              alt="Modern property"
              fill
              className="object-cover"
              priority
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--logo-muted)] via-transparent to-transparent" />
          </div>

          {/* Testimonial card */}
          <div className="absolute left-6 top-16 z-10 w-72 rounded-2xl border border-white/20 bg-white/95 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#e3f2fd] text-lg font-bold text-[var(--logo)]">
                MV
              </div>
              <div>
                <p className="font-semibold text-[#1e293b]">Manuel Villa</p>
                <p className="text-xs text-[#64748b]">Renter</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#1976d2]">Moved with {BRAND}</p>
            <p className="mt-2 flex items-start gap-1 text-sm italic text-[#475569]">
              <span className="text-[var(--logo)]">"</span>
              I loved how smooth the move was, and finally got the house we wanted.
            </p>
            <div className="mt-4 flex gap-4 text-xs font-medium">
              <span className="text-[#2e7d32]">₵1,500 Saved up to</span>
              <span className="text-[#1565c0]">-24 hrs Process time</span>
            </div>
          </div>

          {/* Review badge */}
          <div className="absolute bottom-12 right-8 z-10 rounded-xl bg-[#1565c0] px-5 py-4 text-white shadow-xl">
            <p className="font-bold">Excellent</p>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="size-4 fill-[#fbbf24] text-[#fbbf24]" />
              ))}
            </div>
            <p className="mt-1 text-xs text-blue-200">From 3,264 reviews</p>
          </div>
        </div>
      </div>

      {/* Mobile: Show image below content */}
      <div className="relative block min-h-[320px] lg:hidden">
        <Image
          src="/login_home.png"
          alt="Modern property"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-[#1565c0] px-4 py-3 text-white">
          <p className="font-bold">Excellent</p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="size-4 fill-[#fbbf24] text-[#fbbf24]" />
            ))}
          </div>
          <p className="text-xs text-blue-200">From 3,264 reviews</p>
        </div>
      </div>
    </div>
  );
}
