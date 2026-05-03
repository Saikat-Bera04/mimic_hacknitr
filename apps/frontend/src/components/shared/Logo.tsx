import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-2xl font-bold group">
      <Image src="/mimic.png" alt="Mimic Logo" width={56} height={56} className="h-14 w-14" />
      <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent text-3xl">
        Mimic
      </span>
    </Link>
  );
}
