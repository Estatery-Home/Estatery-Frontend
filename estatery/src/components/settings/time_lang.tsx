"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TimeLang() {
  return (
    <div className="space-y-0">
    {/* Time & Language Settings  */}
      <section className="flex flex-col gap-6 pb-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Time</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Set your preferred time zone to ensure that all activites align with your local time.
          </p>
        </div>
        <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 ">
         
          <div className="space-y-2">
            <Label htmlFor="time-zone" className="text-[#1e293b]">
              Time Zone 
            </Label>
            <Select defaultValue="Pacific Standard Time(PST)">
              <SelectTrigger id="time-zone" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <Select>
                <SelectItem value="Africa/Accra">GMT (Africa/Accra)</SelectItem>
                <SelectItem value="America/New_York">EST (America/New_York)</SelectItem>
                <SelectItem value="Europe/London">GMT (Europe/London)</SelectItem>
                <SelectItem value="Europe/Paris">CET (Europe/Paris)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PST / PDT)</SelectItem>
                <SelectItem value="Asia/Dubai">GST (Asia/Dubai)</SelectItem>
                <SelectItem value="Asia/Kolkata">IST (Asia/Kolkata)</SelectItem>
                <SelectItem value="Asia/Tokyo">JST (Asia/Tokyo)</SelectItem>
                <SelectItem value="Australia/Sydney">AEST (Australia/Sydney)</SelectItem>
                </Select>

              </SelectContent>
            </Select>
          </div>
            </div>
      </section>

        <hr className="border-t my-10 border-[#e2e8f0]"/>   

      {/* Language  */}
      <section className="flex flex-col gap-6 pt-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Set language</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Choose the language .
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4 ">
       
          <div className="space-y-2">
            <Label htmlFor="country" className="text-[#1e293b]">
              Country or Region <span className="text-[#dc2626]">*</span>
            </Label>
            <Select defaultValue="us">
              <SelectTrigger id="country" className="border-[#e2e8f0] bg-white text-[#1e293b]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        
        </div>
      </section>
    </div>
  );
}
