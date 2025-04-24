import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import useContract from "../hooks/useContract";

const MPC = () => {
  const { contract, getSender, getRecipient, claimPayment, getContractBalance } =
    useContract();

  const [organizer, setOrganizer] = useState("");
  const [worker, setWorker] = useState("");
  const [organizerBalance, setOrganizerBalance] = useState("0");
  const [workerBalance, setWorkerBalance] = useState("0");
  const [channelBalance, setChannelBalance] = useState("0");

  const [amountToSign, setAmountToSign] = useState("");
  const [signedChecks, setSignedChecks] = useState([]);

  const [amountToClaim, setAmountToClaim] = useState("");
  const [signedMessage, setSignedMessage] = useState("");

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const [channelStatus, setChannelStatus] = useState("Loading...");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const truncateAddress = (addr) => {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const p = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(p);
        setSigner(p.getSigner());
      } else {
        setErrorMessage("No Ethereum provider found. Please install MetaMask.");
      }
    };
    init();
  }, []);

  const checkChannelStatus = useCallback(
    async (providerInstance, contractInstance) => {
      if (!providerInstance || !contractInstance) {
        setChannelStatus("No contract");
        return;
      }
      try {
        const code = await providerInstance.getCode(contractInstance.address);
        if (code === "0x") {
          setChannelStatus("Channel closed");
        } else {
          const addr = contractInstance.address;
          setChannelStatus("Channel: " + truncateAddress(addr));
        }
      } catch (err) {
        console.error("checkChannelStatus error:", err);
        setChannelStatus("Error checking channel");
      }
    },
    []
  );

  const fetchData = useCallback(async () => {
    if (!provider || !contract) return;
    try {
      setErrorMessage("");
      setSuccessMessage("");

      const org = await getSender();
      const wkr = await getRecipient();
      setOrganizer(org);
      setWorker(wkr);

      const orgBal = await provider.getBalance(org);
      setOrganizerBalance(ethers.utils.formatEther(orgBal));

      const wkrBal = await provider.getBalance(wkr);
      setWorkerBalance(ethers.utils.formatEther(wkrBal));

      const cBal = await getContractBalance();
      setChannelBalance(cBal);

      await checkChannelStatus(provider, contract);
    } catch (err) {
      console.error("fetchData error:", err);
      setErrorMessage(err.message || "Error fetching contract data");
    }
  }, [
    provider,
    contract,
    getSender,
    getRecipient,
    getContractBalance,
    checkChannelStatus,
  ]);

  useEffect(() => {
    if (provider && contract) {
      fetchData();
    }
  }, [provider, contract, fetchData]);

  const handleSignMessage = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!signer || !contract) {
      setErrorMessage(
        "No signer/contract. Make sure you're connected as Organizer in MetaMask."
      );
      return;
    }
    if (!amountToSign || parseFloat(amountToSign) <= 0) {
      setErrorMessage("Please enter a valid positive amount to sign.");
      return;
    }
    try {
      const weiAmount = ethers.utils.parseEther(amountToSign);
      const rawHash = ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [contract.address, weiAmount]
      );
      const signature = await signer.signMessage(ethers.utils.arrayify(rawHash));

      setSignedChecks((prev) => [...prev, { amount: amountToSign, signature }]);
      setSuccessMessage(`Micropayment signed for ${amountToSign} ETH.`);
    } catch (err) {
      console.error("Sign error:", err);
      setErrorMessage(err.message || "Signing failed or was rejected.");
    }
  };

  const handleClaimPayment = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!amountToClaim || parseFloat(amountToClaim) <= 0) {
      setErrorMessage("Please enter a valid positive amount to claim.");
      return;
    }
    if (!signedMessage.startsWith("0x")) {
      setErrorMessage("Please enter a valid 0x signature.");
      return;
    }
    try {
      const weiAmount = ethers.utils.parseEther(amountToClaim);
      const tx = await claimPayment(weiAmount, signedMessage);
      if (tx) {
        setSuccessMessage("Payment claimed successfully! Refreshing data...");
        await fetchData();
      }
    } catch (err) {
      console.error("Claim error:", err);
      if (
        err.message?.includes("Insufficient Funds") ||
        err.message?.includes("execution reverted") ||
        err.code === "UNPREDICTABLE_GAS_LIMIT"
      ) {
        setErrorMessage(
          "Channel closed or insufficient contract funds. (Could not estimate gas)"
        );
      } else {
        setErrorMessage(err.message || "Claim transaction failed.");
      }
    }
  };

  return (
    <div className="mpc-container">
      <h1 className="mpc-title">Micropayment channel for global cleaning</h1>

      {errorMessage && <div className="mpc-error">{errorMessage}</div>}
      {successMessage && <div className="mpc-success">{successMessage}</div>}

      <p className="mpc-channel-info">
        <strong>{channelStatus}</strong>,{" "}
        <strong>Organizer:</strong> {truncateAddress(organizer)} ({organizerBalance} ETH),{" "}
        <strong>Worker:</strong> {truncateAddress(worker)} ({workerBalance} ETH),{" "}
        <strong>Contract:</strong> {channelBalance} ETH
      </p>

      <div className="mpc-grid">
        <div className="left-col">
          <div className="step step1-blue">
            <h3>1. Channel / Contract Deployed</h3>
            <p>Organizer & Worker set, with small escrow deposit in contract.</p>
          </div>

          <div className="step step3-green">
            <h3>3. Organizer (Sender)</h3>
            <label>Amount (cumulative)</label>
            <input
              type="number"
              step="0.0001"
              placeholder="e.g. 0.0001"
              value={amountToSign}
              onChange={(e) => setAmountToSign(e.target.value)}
            />
            <button onClick={handleSignMessage}>Send micropayment</button>
            <p style={{ fontStyle: "italic" }}>
              *Make sure you're connected as the Organizer
            </p>
          </div>

          <div className="step step5-blue">
            <h3>5. Worker (Receiver)</h3>
            <label>Amount (cumulative)</label>
            <input
              type="number"
              step="0.0001"
              placeholder="e.g. 0.0001"
              value={amountToClaim}
              onChange={(e) => setAmountToClaim(e.target.value)}
            />
            <label>Signed message</label>
            <input
              type="text"
              placeholder="0x..."
              value={signedMessage}
              onChange={(e) => setSignedMessage(e.target.value)}
            />
            <button onClick={handleClaimPayment}>Claim payment</button>
            <p style={{ fontStyle: "italic" }}>
              *Must switch MetaMask to Worker’s wallet before claiming
            </p>
          </div>
        </div>

        <div className="right-col">
          <div className="step step2-green">
            <h3>2. Verify containers</h3>
            <p>Placeholder instructions for verifying bins offline.</p>
          </div>

          <div className="step step4-green">
            <h3>4. Signed messages</h3>
            {signedChecks.length === 0 ? (
              <p>No signed checks yet.</p>
            ) : (
              signedChecks.map((check, idx) => (
                <div key={idx} className="mpc-signed-check">
                  <p>Amount: {check.amount} ETH</p>
                  <p>Signature: {check.signature}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MPC;
