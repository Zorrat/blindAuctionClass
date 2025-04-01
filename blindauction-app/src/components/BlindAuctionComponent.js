import React, { useState, useEffect } from "react";
import useContract from "../hooks/useContract";

const phaseMap = {
  0: "Bidding Not Started",
  1: "Bidding Started",
  2: "Reveal Started",
  3: "Auction Ended",
};

const BlindAuctionComponent = () => {
  const {
    contract,
    currentPhase,
    highestBid,
    highestBidder,
    advancePhase,
    bid,
    reveal,
    withdraw,
    auctionEnd,
    closeAuction,
    refreshContractState,
  } = useContract();

  const [account, setAccount] = useState("");
  const [beneficiary, setBeneficiary] = useState("");

  const [blindedBid, setBlindedBid] = useState("");
  const [depositEth, setDepositEth] = useState("");

  const [revealValue, setRevealValue] = useState("");
  const [revealSecret, setRevealSecret] = useState("");

  useEffect(() => {
    const loadAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error("User denied account access:", error);
        }
      }
    };
    loadAccount();
  }, []);

  useEffect(() => {
    const fetchBeneficiary = async () => {
      if (!contract) return;
      try {
        const chair = await contract.beneficiary();
        setBeneficiary(chair);
      } catch (error) {
        console.error("Error getting beneficiary:", error);
      }
    };
    fetchBeneficiary();
    refreshContractState();
  }, [contract, refreshContractState]);

  const handleAdvancePhase = async () => {
    try {
      await advancePhase();
    } catch (error) {
      console.error("Error advancing phase:", error);
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    if (!blindedBid || !depositEth) {
      console.error("Missing blindedBid or deposit");
      return;
    }
    try {
      await bid(blindedBid, depositEth);
      setBlindedBid("");
      setDepositEth("");
    } catch (error) {
      console.error("Error placing bid:", error);
    }
  };

  const handleReveal = async (e) => {
    e.preventDefault();
    if (!revealValue || !revealSecret) {
      console.error("Missing revealValue or revealSecret");
      return;
    }
    try {
      await reveal(revealValue, revealSecret);
      setRevealValue("");
      setRevealSecret("");
    } catch (error) {
      console.error("Error revealing bid:", error);
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdraw();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
    }
  };

  const handleAuctionEnd = async () => {
    try {
      await auctionEnd();
    } catch (error) {
      console.error("Error ending auction:", error);
    }
  };

  const handleCloseAuction = async () => {
    try {
      await closeAuction();
    } catch (error) {
      console.error("Error closing auction:", error);
    }
  };

  const isBeneficiary =
    beneficiary && account && beneficiary.toLowerCase() === account.toLowerCase();
  const highestBidFormatted = highestBid || "0";

  return (
    <div className="auction-wrapper">
      <div className="auction-account">
        <div>
          <strong>Your Account:</strong> {account || "Not connected"}
        </div>
        <div>
          <strong>Beneficiary (Chair):</strong> {beneficiary}
        </div>
      </div>

      <div className="auction-info">
        <h2>{phaseMap[currentPhase] || "Unknown Phase"}</h2>
        <p>
          <strong>Highest Bid:</strong> {highestBidFormatted} ETH <br />
          <strong>Highest Bidder:</strong> {highestBidder}
        </p>
      </div>

      {isBeneficiary && (
        <div className="auction-beneficiary card">
          <h3>Beneficiary Control Panel</h3>
          <button
            id="change-phase"
            className="btn"
            onClick={handleAdvancePhase}
          >
            Advance Phase
          </button>
          <button
            id="generate-winner"
            className="btn"
            onClick={handleAuctionEnd}
          >
            End Auction &amp; Pay Out
          </button>
          <button
            id="close-auction"
            className="btn danger"
            onClick={handleCloseAuction}
          >
            Close Auction (Self-Destruct)
          </button>
        </div>
      )}

      {!isBeneficiary && (
        <div className="auction-bidder card">
          <h3>Bidder Panel</h3>
          <form className="bid-form" onSubmit={handleBid}>
            <label>Blinded Bid (bytes32):</label>
            <input
              type="text"
              id="bet-value"
              className="form-input"
              placeholder=""
              value={blindedBid}
              onChange={(e) => setBlindedBid(e.target.value)}
            />

            <label>Deposit (ETH):</label>
            <input
              type="text"
              id="message-value"
              className="form-input"
              placeholder=""
              value={depositEth}
              onChange={(e) => setDepositEth(e.target.value)}
            />

            <button type="submit" id="submit-bid" className="btn primary">
              Place Bid
            </button>
          </form>

          <form className="reveal-form" onSubmit={handleReveal}>
            <label>Reveal Value (Ether):</label>
            <input
              type="text"
              id="bet-reveal"
              className="form-input"
              placeholder=""
              value={revealValue}
              onChange={(e) => setRevealValue(e.target.value)}
            />

            <label>Secret (OTP):</label>
            <input
              type="text"
              id="password"
              className="form-input"
              placeholder=""
              value={revealSecret}
              onChange={(e) => setRevealSecret(e.target.value)}
            />

            <button type="submit" id="submit-reveal" className="btn primary">
              Reveal Bid
            </button>
          </form>

          <div className="withdraw-section">
            <button
              id="withdraw-bid"
              className="btn"
              onClick={handleWithdraw}
            >
              Withdraw (for Non-winning Bids)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlindAuctionComponent;
