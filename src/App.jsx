/*global chrome*/
import Header from './components/main/Header';
import Messenger from './components/main/messenger/Messenger';

import './App.css';

function App() {

  return (
    <>
      <Header title={'Megaman'} />
      <div className="app-container">
        <Messenger />
      </div>
    </>
  )
}

export default App
