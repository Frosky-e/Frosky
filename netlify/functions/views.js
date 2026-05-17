const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore("views");
  const current = Number((await store.get("count")) || 0);

  // Get only
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count: current }),
    };
  }

  // Increase
  const updated = current + 1;
  await store.set("count", updated.toString());

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ count: updated }),
  };
};
