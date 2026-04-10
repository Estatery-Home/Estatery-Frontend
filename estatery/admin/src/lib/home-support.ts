/** HOME app — support contacts for Help Center and legal footer */

export const HOME_SUPPORT_EMAIL = "support.homegh@gmail.com";

export const HOME_SUPPORT_MAILTO = `mailto:${HOME_SUPPORT_EMAIL}`;

/** E.164 for tel:/sms: links (no spaces) */
export const HOME_SUPPORT_PHONES = [
  { tel: "+233557452520", display: "+233 557 452 520" },
  { tel: "+233241751708", display: "+233 241 751 708" },
] as const;
