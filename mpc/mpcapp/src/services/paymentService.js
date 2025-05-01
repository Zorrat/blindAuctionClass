const API_URL = "http://localhost:5001/api";

export const paymentService = {
  // Add a new payment
  addPayment: async (channelId, amount) => {
    const response = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channelId, amount }),
    });
    return await response.json();
  },

  // Get all payments for a channel
  getPayments: async (channelId) => {
    const response = await fetch(`${API_URL}/payments/${channelId}`);
    return await response.json();
  },

  // Reset payments for a channel
  resetPayments: async (channelId) => {
    const response = await fetch(`${API_URL}/payments/${channelId}`, {
      method: "DELETE",
    });
    return await response.json();
  },

  // Get total amount for a channel
  getTotal: async (channelId) => {
    const response = await fetch(`${API_URL}/payments/${channelId}/total`);
    const data = await response.json();
    return data.total;
  },
};
