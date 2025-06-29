import React from 'react';
import PropTypes from 'prop-types';

const DisplayError = ({ error = {} }) => {
  if (!error || !error.message) return null;
  if (
    error.networkError &&
    error.networkError.result &&
    error.networkError.result.errors.length
  ) {
    return error.networkError.result.errors.map((error, i) => (
      <div key={i} className="p-8 bg-white my-8 border border-black border-opacity-5 border-l-5 border-l-red-500">
        <p data-test="graphql-error" className="m-0 font-thin">
          <strong className="mr-4">Shoot!</strong>
          {error.message.replace('GraphQL error: ', '')}
        </p>
      </div>
    ));
  }
  return (
    <div className="p-8 bg-white my-8 border border-black border-opacity-5 border-l-5 border-l-red-500">
      <p data-test="graphql-error" className="m-0 font-thin">
        <strong className="mr-4">Shoot!</strong>
        {error.message.replace('GraphQL error: ', '')}
      </p>
    </div>
  );
};

DisplayError.propTypes = {
  error: PropTypes.object,
};

export default DisplayError;
