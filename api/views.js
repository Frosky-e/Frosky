const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase env variables",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET current count
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("site_views")
        .select("count")
        .eq("id", 1)
        .single();

      if (error) throw error;

      return res.status(200).json({
        count: data?.count ?? 0,
      });
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

    return res.status(200).json({
      count: newCount,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
};
