"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Links() {
  return (
    <div className="space-y-0">
      {/* Links Settings */}
      <section className="flex flex-col gap-6 pb-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Link Account</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Your customers will use this information to contact you.
          </p>
        </div>
        <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 ">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="text-[#1e293b]">
              Instagram 
            </Label>
            <Input
              id="instagram" 
              defaultValue="https://www.instagram.com/luxeyline"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>
      
          <div className="space-y-2">
            <Label htmlFor="facebook" className="text-[#1e293b]">
              Facebook 
            </Label>
            <Input
              id="facebook" 
              defaultValue="https://www.facebook.com/luxeyline"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="text-[#1e293b]">
              Twitter 
            </Label>
            <Input
              id="twitter" 
              defaultValue="https://www.twitter.com/luxeyline"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube" className="text-[#1e293b]">
              YouTube 
            </Label>
            <Input
              id="youtube" 
              defaultValue="https://www.youtube.com/luxeyline"
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>


         
         

          
         
        </div>
      </section>

       

    
    </div>
  );
}
