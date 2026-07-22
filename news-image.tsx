import Image from 'next/image';

interface NewsImageProps {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}

function isValidNewsImage(src: string | null): src is string {
  if (!src) {
    return false;
  }

  const normalizedSrc = src.toLowerCase();

  const blockedImages = [
    'logo_ceasaminas',
    'logo-ceasaminas',
    'logo_ceasa',
    'logo-ceasa',
    '/logo.',
    '/logos/',
  ];

  return !blockedImages.some((blockedImage) => normalizedSrc.includes(blockedImage));
}

export function NewsImage({ src, alt, className = '', priority = false }: NewsImageProps) {
  if (!isValidNewsImage(src)) {
    return (
      <div
        className={`news-image-placeholder ${className}`.trim()}
        role="img"
        aria-label={`Imagem não disponível para: ${alt}`}
      >
        <span>Ceasaminas</span>
      </div>
    );
  }

  return (
    <div className={`news-image-wrapper ${className}`.trim()}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="news-image"
      />
    </div>
  );
}
