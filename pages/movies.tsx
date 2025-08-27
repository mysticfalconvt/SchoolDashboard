import gql from 'graphql-tag';
import type { GetStaticProps, NextPage } from 'next';
import { useState } from 'react';
import Form from '../components/styles/Form';
import { useUser } from '../components/User';
import NewVideo from '../components/video/newVideoButton';
import SingleVideo from '../components/video/singleVideo';
import { backendEndpoint } from '../config';
import { GraphQLClient } from '../lib/graphqlClient';
import isAllowed from '../lib/isAllowed';

const GET_ALL_VIDEOS_QUERY = gql`
  query GET_ALL_VIDEOS_QUERY {
    videos {
      id
      name
      link
      description
      onHomePage
      type
    }
  }
`;

interface Video {
  id: string;
  name: string;
  link: string;
  description: string;
  onHomePage: boolean;
  type: string;
}

interface MoviesPageProps {
  movieList: {
    videos: Video[];
  };
}

const MoviesPage: NextPage<MoviesPageProps> = ({ movieList }) => {
  const me = useUser();
  const isEditor = isAllowed(me, 'isSuperAdmin');
  const [searchString, setSearchString] = useState('');
  const [searchResults, setSearchResults] = useState(movieList.videos);

  return (
    <div>
      <h1 style={{ display: 'flex' }}>
        Movies
        {isEditor && <NewVideo />}
      </h1>
      {/* search bar  */}
      <Form>
        <input
          type="text"
          value={searchString}
          onChange={(e) => {
            setSearchString(e.target.value);
            setSearchResults(
              movieList.videos.filter((video) => {
                return (
                  video.name
                    .toLowerCase()
                    .includes(e.target.value.toLowerCase()) ||
                  video.description
                    .toLowerCase()
                    .includes(e.target.value.toLowerCase())
                );
              }),
            );
          }}
          placeholder="Search"
        />
      </Form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
        {movieList.videos.map((video) => {
          // check if video is in search results
          const isVisible = searchResults.includes(video);
          return (
            <SingleVideo key={video.id} video={video} hidden={!isVisible} />
          );
        })}
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps<MoviesPageProps> = async () => {
  // console.log(context);
  // fetch PBIS Page data from the server
  const graphQLClient = new GraphQLClient(
    backendEndpoint,
    {
      headers: {
        authorization: `test auth for keystone`,
      },
    },
  );
  const fetchAllVideos = async (): Promise<{ videos: Video[] }> =>
    graphQLClient.request(GET_ALL_VIDEOS_QUERY);

  const movieList = await fetchAllVideos();

  return {
    props: {
      movieList,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
};

export default MoviesPage;
