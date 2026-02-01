"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard";
import { properties } from "@/lib/properties";

export default function PropertiesList() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-[#1e293b]">Properties</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((prop) => (
            <Link
              key={prop.id}
              to={`/dashboard/properties/${prop.id}`}
              className="group rounded-xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden transition-all duration-200 hover:border-[#cbd5e1] hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#f1f5f9]">
                <img
                  src={prop.image}
                  alt={prop.name}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-[#1e293b] group-hover:text-[#21438D] truncate">{prop.name}</p>
                <p className="mt-0.5 truncate text-sm text-[#64748b]">{prop.location}</p>
                <p className="mt-2 text-sm font-medium text-[#1e293b]">
                  {prop.price}
                  <span className="font-normal text-[#64748b]"> per month</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
