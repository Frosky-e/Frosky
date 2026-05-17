let count = 0;

exports.handler = async (event) => {
  // GET → sirf count dikhao
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count }),
    };
  }

  // POST → count badhao
  count++;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ count }),
  };
};
