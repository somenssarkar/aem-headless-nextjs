import Image from 'next/image';
import { AuthorModel } from '@/types/aem';

export default function AuthorBio({ author }: { author: AuthorModel }) {
  const avatarSrc = author.khAvatar?._path
    ? `${process.env.NEXT_PUBLIC_AEM_HOST ?? ''}${author.khAvatar._path}`
    : null;

  return (
    <div className="flex items-start gap-4">
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt={author.khName}
          width={56}
          height={56}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
          {author.khName.charAt(0)}
        </div>
      )}
      <div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">{author.khName}</span>
          {author.khLinkedinUrl && (
            <a
              href={author.khLinkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              LinkedIn
            </a>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{author.khBio?.plaintext}</p>
        {author.khSpecialties && author.khSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {author.khSpecialties.map((s) => (
              <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
