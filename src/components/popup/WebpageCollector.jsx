import { useState } from 'react';

const WebpageCollector = ({openDashboardHandler}) => {
  const [collecting, setCollecting] = useState(false);

  const startCollecting = async () => {
    // TODO: Implement the logic to collect data from the generic webpage
    setCollecting(true);
  };

  return (
    <>
      <div className="flex justify-evenly my-2"> {/* Added flex container */}
        <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-l cursor-pointer"
        onClick={startCollecting}
        disabled={collecting}
        >
        {collecting ? 'Collecting...' : 'Collect'}
        </button>
        <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-l cursor-pointer"
        onClick={openDashboardHandler}
        disabled={collecting}
        >
        Dashboard
        </button>
      </div>
      <h3 className='text-xl text-center'>
        We could not recognize the webpage source. We will collect information from the webpage then you can search later.
      </h3>
    </>
  )
}

export default WebpageCollector;