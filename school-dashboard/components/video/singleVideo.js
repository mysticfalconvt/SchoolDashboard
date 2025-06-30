export default function SingleVideo({ video, hidden }) {
  const isYouTube = video.type === "youtube";
  const isGoogle = video.type === "google drive";

  const getEmbedComponent = (video, hidden) => {
    if (hidden) return null;
    if (isYouTube) {
      return (
        <div className="flex flex-col items-center justify-center" title={video.name + " - " + video.description}>
          {video.name}
          <iframe
            title={video.name + video.description}
            src={`https://www.youtube.com/embed/${video.link}`}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            width="400"
            height="300"
          />
          {video.description}
        </div>
      );
    } else if (isGoogle) {
      return (
        <div className="flex flex-col items-center justify-center" title={video.name + " - " + video.description}>
          {video.name}
          <iframe
            title={video.name + video.description}
            src={`https://drive.google.com/file/d/${video.link}/preview`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            width="400"
            height="300"
          />
          {video.description}
        </div>
      );
    }
  };

  return getEmbedComponent(video, hidden);
}
