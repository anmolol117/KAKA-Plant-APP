const clients = new Set();

export const registerClient = (res) => {
  clients.add(res);
};

export const unregisterClient = (res) => {
  clients.delete(res);
};

export const broadcast = (event, payload) => {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(data);
  }
};
