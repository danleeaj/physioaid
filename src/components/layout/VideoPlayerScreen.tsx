"use client";

import { ArrowLeft } from "lucide-react";

export type VideoInfo = {
  id: string;
  title: string;
  meta: string;
  videoUrl: string;
};

function youtubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export function VideoPlayerScreen({
  video,
  onBack,
}: {
  video: VideoInfo;
  onBack: () => void;
}) {
  const embedUrl = youtubeEmbedUrl(video.videoUrl);

  return (
    <>
      <header className="top-bar">
        <button
          aria-label="Back"
          className="top-bar__back"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="top-bar__title">{video.title}</h1>
      </header>
      <div className="app-content app-content--tabs">
        <div className="clip-cover">
          {embedUrl ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              src={embedUrl}
              style={{
                border: 0,
                height: "100%",
                width: "100%",
              }}
              title={video.title}
            />
          ) : (
            <p>Video unavailable</p>
          )}
        </div>
        <div>
          <h2 className="text-[length:var(--text-body)] font-bold">
            {video.title}
          </h2>
          <p className="text-[length:var(--text-label)] text-[var(--muted)]">
            {video.meta}
          </p>
        </div>
      </div>
    </>
  );
}
