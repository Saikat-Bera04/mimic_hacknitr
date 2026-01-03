import Image from "next/image";
import placeholderImages from '@/lib/placeholder-images.json';

const authBgImage = placeholderImages.placeholderImages.find(p => p.id === "auth-background") || {
  imageUrl: "https://picsum.photos/seed/auth-bg/1920/1080",
  imageHint: "abstract dark"
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <Image
        src={authBgImage.imageUrl}
        alt="Abstract background"
        fill
        priority
        sizes="100vw"
        className="object-cover -z-10"
        data-ai-hint={authBgImage.imageHint}
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10" />
      {children}
    </div>
  );
}
