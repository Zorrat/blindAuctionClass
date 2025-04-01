import React from "react";
import { HashRouter } from "react-router-dom";
import BlindAuctionComponent from "./components/BlindAuctionComponent";
import "./styles/App.css";

function App() {
  return (
    <HashRouter>
      <div className="content">
        <div className="two-column-container">
          <div className="left-col">
            <img
              src="/img/antiqueTrophy.jpg"
              alt="Antique Trophy"
              className="large-trophy"
            />
          </div>

          <div className="right-col">
            <h2 className="app-title">Blind Auction</h2>
            <div className="section-padding">
              <BlindAuctionComponent />
            </div>
          </div>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
