const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  try {
    // Read current count
    const { data, error } = await supabase
      .from("site_views")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;

    // GET request
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          count: data.count,
        }),
      };
    }

    // POST request → increment
    const newCount = Number(data.count || 0) + 1;

    const { error: updateError } = await supabase
      .from("site_views")
      .update({ count: newCount })
      .eq("id", 1);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        count: newCount,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
      }),
    };
  }
};
