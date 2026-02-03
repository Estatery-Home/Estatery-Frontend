"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function MyAccount() {
  return (
    <div className="space-y-0">
      {/* Account Settings */}
      <section className="flex flex-col gap-6 pb-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Account Setting</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            View and update your account details, profile, and more.
          </p>
        </div>
        <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 ">
          <div className="space-y-2">
            <Label htmlFor="full-name" className="text-[#1e293b]">
              Full Name <span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="full-name" 
              defaultValue="Jennifer Harrison"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>

         
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#1e293b]">
              Email Address<span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="email" 
              defaultValue="jenny10@gmail.com"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[#1e293b]">
              Email Address<span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="phone" 
              defaultValue="+1(212) 55 4567"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>
          
         
        </div>
      </section>

       

    
    </div>
  );
}
