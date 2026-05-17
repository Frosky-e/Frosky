const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing Supabase env variables",
        }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET current count
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("site_views")
        .select("count")
        .eq("id", 1)
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        body: JSON.stringify({
          count: data?.count ?? 0,
        }),
      };
    }

    // POST increment
    const { data, error } = await supabase
      .from("site_views")
      .select("count")
      .eq("id", 1)
      .single();

    if (error) throw error;

    const newCount = (data?.count || 0) + 1;

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
