import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import BlindAuction from "../contracts/BlindAuction.json";

const useContract = () => {
  const [contract, setContract] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [highestBid, setHighestBid] = useState(null);
  const [highestBidder, setHighestBidder] = useState(null);

  useEffect(() => {
    const loadContract = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();

          const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

          const loadedContract = new ethers.Contract(
            contractAddress,
            BlindAuction.abi,
            signer
          );

          setContract(loadedContract);
        } catch (error) {
          console.error("Failed to load contract:", error);
        }
      } else {
        console.error("Ethereum provider not available");
      }
    };

    loadContract();
  }, []);

  const refreshContractState = useCallback(async () => {
    if (!contract) return;
    try {
      const phase = await contract.currentPhase();
      setCurrentPhase(phase);

      const bid = await contract.highestBid();
      setHighestBid(ethers.utils.formatEther(bid));

      const bidder = await contract.highestBidder();
      setHighestBidder(bidder);
    } catch (error) {
      console.error("Error refreshing contract state:", error);
    }
  }, [contract]);

  const advancePhase = useCallback(async () => {
    if (!contract) return;
    try {
      const tx = await contract.advancePhase();
      await tx.wait();
      await refreshContractState();
    } catch (error) {
      console.error("advancePhase Error:", error);
    }
  }, [contract, refreshContractState]);

  const bid = useCallback(
    async (blindedBidHexString, depositInEther) => {
      if (!contract) {
        console.error("Contract not loaded");
        return;
      }
      try {
        const tx = await contract.bid(blindedBidHexString, {
          value: ethers.utils.parseEther(depositInEther || "0"),
        });
        await tx.wait();
        await refreshContractState();
      } catch (error) {
        console.error("bid Error:", error);
      }
    },
    [contract, refreshContractState]
  );

  const reveal = useCallback(
    async (value, secret) => {
      if (!contract) {
        console.error("Contract not loaded");
        return;
      }
      try {
        console.log("reveall value type", typeof value);
        console.log("reveall secret type", typeof secret);

        // convert value int
        value = parseInt(value);
        // convert secret string to bytes32
        secret = ethers.utils.formatBytes32String(secret);
        const tx = await contract.reveal(value, secret);
        await tx.wait();
        await refreshContractState();
      } catch (error) {
        console.error("reveal Error:", error);
      }
    },
    [contract, refreshContractState]
  );

  const withdraw = useCallback(async () => {
    if (!contract) {
      console.error("Contract not loaded");
      return;
    }
    try {
      const tx = await contract.withdraw();
      await tx.wait();
      await refreshContractState();
    } catch (error) {
      console.error("withdraw Error:", error);
    }
  }, [contract, refreshContractState]);

  const auctionEnd = useCallback(async () => {
    if (!contract) {
      console.error("Contract not loaded");
      return;
    }
    try {
      const tx = await contract.auctionEnd();
      await tx.wait();
      await refreshContractState();
    } catch (error) {
      console.error("auctionEnd Error:", error);
    }
  }, [contract, refreshContractState]);

  const closeAuction = useCallback(async () => {
    if (!contract) {
      console.error("Contract not loaded");
      return;
    }
    try {
      const tx = await contract.closeAuction();
      await tx.wait();
    } catch (error) {
      console.error("closeAuction Error:", error);
    }
  }, [contract]);

  return {
    contract,
    currentPhase,
    highestBid,
    highestBidder,
    refreshContractState,
    advancePhase,
    bid,
    reveal,
    withdraw,
    auctionEnd,
    closeAuction,
  };
};

export default useContract;
