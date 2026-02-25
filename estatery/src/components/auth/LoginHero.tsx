/**
 * Login page hero – decorative image panel (hidden on mobile).
 */
import Image from "next/image";

export function LoginHero() {
  return (
    <aside
      className="relative hidden w-full max-w-[500px] flex-shrink-0 lg:block xl:max-w-[480px] 
                 py-6 pr-6"
      aria-hidden
    >
      <div className="relative h-[calc(100vh-3rem)] w-full overflow-hidden rounded-2xl shadow-[-8px_0_32px_rgba(0,0,0,0.06)]">
        <Image
          src="/images/login_home.webp"
          alt="Modern minimalist living room interior"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 0vw, 420px"
          priority
        />
      </div>
    </aside>
  );
}
