"use client";

import * as React from "react";
import { HOME_SUPPORT_EMAIL, HOME_SUPPORT_PHONES } from "@/lib/home-support";

/**
 * HOME App – Terms & Conditions and Privacy Policy (admin copy).
 * Same text is shown on signup, Help Center, and /legal/terms.
 */
export function HomeTermsPrivacyContent({ className }: { className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
        HOME App – Terms &amp; Conditions and Privacy Policy
      </h2>

      <h3 className="mt-8 text-base font-semibold text-slate-900">Terms &amp; Conditions</h3>
      <ol className="mt-3 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-slate-700">
        <li>
          <strong className="text-slate-900">Introduction.</strong> Welcome to HOME, a digital real estate platform
          developed by C.I Tech Agency. By accessing or using the HOME website or mobile application, you agree to be
          bound by these Terms and Conditions. If you do not agree with these terms, please do not use the platform.
        </li>
        <li>
          <strong className="text-slate-900">Platform Purpose.</strong> HOME is a digital marketplace that allows users
          to find properties for rent or sale and contact verified property owners. The platform connects property owners
          with people searching for housing.
        </li>
        <li>
          <strong className="text-slate-900">Who Can List Properties.</strong> Only verified property owners and
          authorized members of the HOME management team are allowed to list properties on the platform. Real estate
          agents, brokers, or third‑party intermediaries are strictly prohibited from posting listings.
        </li>
        <li>
          <strong className="text-slate-900">Property Verification.</strong> HOME may require proof of property
          ownership, identification documents, and internal review before approving a listing.
        </li>
        <li>
          <strong className="text-slate-900">User Accounts.</strong> Users may need to create an account to access
          certain features. Users agree to provide accurate information and keep their account credentials secure.
        </li>
        <li>
          <strong className="text-slate-900">Responsibilities of Property Owners.</strong> Property owners must ensure
          that the information provided in listings is accurate and that they legally own or are authorized to list the
          property.
        </li>
        <li>
          <strong className="text-slate-900">Prohibited Activities.</strong> Users must not post properties they do not
          own, act as agents, upload false listings, or attempt to disrupt the platform.
        </li>
        <li>
          <strong className="text-slate-900">Changes to Terms.</strong> HOME may update these Terms and Conditions at any
          time. Continued use of the platform means you accept the updated terms.
        </li>
      </ol>

      <h3 className="mt-10 text-base font-semibold text-slate-900">Privacy Policy</h3>
      <ol className="mt-3 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-slate-700">
        <li>
          <strong className="text-slate-900">Information We Collect.</strong> HOME may collect personal information
          such as name, email address, phone number, location, and property listing details.
        </li>
        <li>
          <strong className="text-slate-900">How We Use Information.</strong> We use collected information to manage
          accounts, display listings, connect users, improve services, and send notifications.
        </li>
        <li>
          <strong className="text-slate-900">Sharing Information.</strong> HOME does not sell personal data. Information
          may only be shared with interested users or legal authorities when required.
        </li>
        <li>
          <strong className="text-slate-900">Data Protection.</strong> HOME implements reasonable security measures to
          protect user data from unauthorized access or misuse.
        </li>
        <li>
          <strong className="text-slate-900">Cookies.</strong> Cookies may be used to improve user experience and analyze
          how the platform is used.
        </li>
        <li>
          <strong className="text-slate-900">User Rights.</strong> Users may request access to their personal data,
          corrections, or deletion of their account.
        </li>
        <li>
          <strong className="text-slate-900">Contact.</strong> For more enquiries regarding these policies please
          contact:{" "}
          <a className="font-medium text-[var(--logo)] underline hover:no-underline" href={`mailto:${HOME_SUPPORT_EMAIL}`}>
            {HOME_SUPPORT_EMAIL}
          </a>{" "}
          {HOME_SUPPORT_PHONES.map((p, i) => (
            <React.Fragment key={p.tel}>
              {i > 0 ? " / " : null}
              <a className="font-medium text-[var(--logo)] underline hover:no-underline" href={`tel:${p.tel}`}>
                {p.display}
              </a>
            </React.Fragment>
          ))}
        </li>
      </ol>
    </div>
  );
}
