/**
 * Signup page hero – full-height side image (half of viewport on lg+; hidden on mobile). Matches LoginHero.
 */
import Image from "next/image";

export function SignupHero() {
  return (
    <aside
      className="relative hidden w-full lg:block lg:w-1/2 py-6 pr-6 lg:pl-0"
      aria-hidden
    >
      <div className="relative h-[calc(100vh-3rem)] w-full overflow-hidden rounded-2xl shadow-[-8px_0_32px_rgba(0,0,0,0.06)]">
        <Image
          src="/images/login_home.webp"
          alt="Modern minimalist living room interior"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 0vw, 50vw"
          priority
        />
      </div>
    </aside>
  );
}
