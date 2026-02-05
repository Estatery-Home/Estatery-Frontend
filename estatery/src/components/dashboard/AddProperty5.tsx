"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AddPropertyContactStepProps = {
  contactName: string;
  phone: string;
  email: string;
  agent: string;
  onChange: (field: "contactName" | "phone" | "email" | "agent", value: string) => void;
};

export function AddPropertyContactStep({
  contactName,
  phone,
  email,
  agent,
  onChange,
}: AddPropertyContactStepProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#1e293b]">Contact &amp; Listing Info</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name" className="text-[#1e293b]">
            Contact Person Name
          </Label>
          <Input
            id="contact-name"
            value={contactName}
            onChange={(e) => onChange("contactName", e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[#1e293b]">
            Phone / WhatsApp
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#1e293b]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent" className="text-[#1e293b]">
            Agent Assigned
          </Label>
          <Input
            id="agent"
            value={agent}
            onChange={(e) => onChange("agent", e.target.value)}
            placeholder="Placeholder"
            className="border-[#e2e8f0] bg-white text-[#1e293b]"
          />
        </div>
      </div>
    </div>
  );
}

