import gql from "graphql-tag";
import { GraphQLClient } from "graphql-request";
import { useGQLQuery } from "../lib/useGqlQuery";
import { useUser } from "../components/User";
import isAllowed from "../lib/isAllowed";
import { endpoint, prodEndpoint } from "../config";
import SingleVideo from "../components/video/singleVideo";
import { useState } from "react";
import Form from "../components/styles/Form";
import GradientButton from "../components/styles/Button";
import NewVideo from "../components/video/newVideoButton";

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

export default function MoviesPage({ movieList }) {
  const me = useUser();
  const isEditor = isAllowed(me, "isSuperAdmin");
  const [searchString, setSearchString] = useState("");
  const [searchResults, setSearchResults] = useState(movieList.videos);

  return (
    <div>
      <h1 style={{ display: "flex" }}>
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
              })
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
}

export async function getStaticProps() {
  // console.log(context);
  // fetch PBIS Page data from the server
  const headers = {
    credentials: "include",
    mode: "cors",
    headers: {
      authorization: `test auth for keystone`,
    },
  };

  const graphQLClient = new GraphQLClient(
    process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
    headers
  );
  const fetchAllVideos = async () =>
    graphQLClient.request(GET_ALL_VIDEOS_QUERY);

  const movieList = await fetchAllVideos();

  return {
    props: {
      movieList,
    }, // will be passed to the page component as props
    revalidate: 1200, // In seconds
  };
}
