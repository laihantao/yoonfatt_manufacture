import Image from 'next/image';
import type { ArticleBlock } from '@/lib/types';
import { articleMediaUrl } from '@/lib/storage';
import ImageCarousel from '@/components/ui/ImageCarousel';

// Turn a YouTube URL (or raw id) into an embeddable URL.
export function youtubeEmbed(src: string): string | null {
  const s = src.trim();
  if (!s) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
    /^([\w-]{11})$/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

export default function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={i} className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">
                {block.text}
              </h2>
            );
          case 'paragraph':
            return (
              <p key={i} className="whitespace-pre-line leading-relaxed text-neutral-700">
                {block.text}
              </p>
            );
          case 'image':
            return (
              <figure key={i}>
                <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  <Image
                    src={articleMediaUrl(block.path)}
                    alt={block.caption ?? ''}
                    width={1200}
                    height={800}
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="h-auto w-full object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-2 text-center text-sm text-neutral-500">{block.caption}</figcaption>
                )}
              </figure>
            );
          case 'gallery':
            if (!block.images?.length) return null;
            return (
              <ImageCarousel
                key={i}
                images={block.images.map((im) => ({ url: articleMediaUrl(im.path), alt: im.caption ?? '' }))}
                alt=""
                sizes="(max-width: 768px) 100vw, 768px"
                className="aspect-video rounded-lg border border-neutral-200 bg-neutral-50"
                imageClassName="object-contain"
              />
            );
          case 'video': {
            if (block.provider === 'youtube') {
              const embed = youtubeEmbed(block.src);
              if (!embed) return null;
              return (
                <div key={i} className="aspect-video overflow-hidden rounded-lg border border-neutral-200">
                  <iframe
                    src={embed}
                    title="Video"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
            return (
              <video
                key={i}
                src={articleMediaUrl(block.src)}
                controls
                className="w-full rounded-lg border border-neutral-200 bg-black"
              />
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
