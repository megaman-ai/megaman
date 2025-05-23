import React from 'react';
import PostItem from './PostItem';

const SearchResultsList = ({ searchResults, handleSelectThread }) => {
  if (!searchResults || searchResults.length === 0) {
    return <div className="p-4">No results found.</div>;
  }

  return (
    <div className="search-results-list p-4">
      <h2 className="text-xl font-bold mb-4">Search Results</h2>
      {searchResults.map(post => (
        <div key={post.id} className="border border-gray-300 rounded-md p-3 mb-3">
          <PostItem post={post} handleSelectThread={handleSelectThread} />
        </div>
      ))}
    </div>
  );
};

export default SearchResultsList;
