import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import MPC from "../contracts/MPC.json";

const useContract = () => {
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const loadContract = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();

          const mpcContract = new ethers.Contract(
            process.env.REACT_APP_CONTRACT_ADDRESS,
            MPC.abi,
            signer
          );
          setContract(mpcContract);
        } catch (err) {
          console.error("Error loading contract:", err);
        }
      } else {
        console.error("No Ethereum provider detected");
      }
    };
    loadContract();
  }, []);

  const getSender = useCallback(async () => {
    if (!contract) return null;
    return await contract.sender();
  }, [contract]);

  const getRecipient = useCallback(async () => {
    if (!contract) return null;
    return await contract.recipient();
  }, [contract]);

  const claimPayment = useCallback(
    async (amount, signedMessage) => {
      if (!contract) throw new Error("Contract not loaded");
      try {
        const tx = await contract.claimPayment(amount, signedMessage);
        await tx.wait();
        return tx;
      } catch (error) {
        console.error("claimPayment error:", error);
        throw error;
      }
    },
    [contract]
  );

  const getContractBalance = useCallback(async () => {
    if (!contract) return "0";
    try {
      const balanceWei = await contract.provider.getBalance(contract.address);
      return ethers.utils.formatEther(balanceWei);
    } catch (error) {
      console.error("getContractBalance error:", error);
      throw error;
    }
  }, [contract]);

  return {
    contract,
    getSender,
    getRecipient,
    claimPayment,
    getContractBalance,
  };
};

export default useContract;
