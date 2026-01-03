import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-2xl font-bold group">
      <Image src="/mimic.png" alt="Mimic Logo" width={40} height={40} className="h-10 w-10" />
      <span className="text-foreground text-3xl">
        Mimic
      </span>
    </Link>
  );
}
