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
        <PostItem key={post.id} post={post} handleSelectThread={handleSelectThread} />
      ))}
    </div>
  );
};

export default SearchResultsList;
