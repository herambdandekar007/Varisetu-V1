import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { origin, destination, originName, destinationName } = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: "origin and destination are required (arrays of [lat, lng])" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get OSRM route
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&steps=true`;
    let routeData = null;
    let routeError = null;
    try {
      const osrmRes = await fetch(osrmUrl);
      routeData = await osrmRes.json();
      if (!routeData.routes || routeData.routes.length === 0) {
        routeError = "No route found between these points";
      }
    } catch (e) {
      routeError = `OSRM error: ${e.message}`;
    }

    // Step 2: Reverse geocode origin and destination via Nominatim
    const geocode = async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`,
          { headers: { "User-Agent": "VariSetu/1.0 (pilgrim-routing)" } }
        );
        const data = await res.json();
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    };

    const [originAddress, destAddress] = await Promise.all([
      geocode(origin[0], origin[1]),
      geocode(destination[0], destination[1]),
    ]);

    // Step 3: Build route summary
    let routeSummary: Record<string, unknown> = {
      origin: { lat: origin[0], lng: origin[1], address: originAddress },
      destination: { lat: destination[0], lng: destination[1], address: destAddress },
      distanceKm: null,
      durationMin: null,
      steps: [],
      geometry: null,
      error: routeError,
    };

    if (routeData?.routes?.[0]) {
      const route = routeData.routes[0];
      routeSummary.distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      routeSummary.durationMin = Math.round(route.duration / 60);
      routeSummary.geometry = route.geometry;

      if (route.legs?.[0]?.steps) {
        routeSummary.steps = route.legs[0].steps.map((step: Record<string, unknown>) => {
          const maneuver = step.maneuver as Record<string, unknown>;
          return {
            instruction: (step.maneuver as Record<string, unknown>)?.type === "arrive"
              ? "Arrive at destination"
              : (step.maneuver as Record<string, unknown>)?.type === "depart"
                ? `Head ${maneuver.modifier || ""}`
                : `${maneuver.type} ${maneuver.modifier || ""}`,
            distance: Math.round((step.distance as number) / 10) * 10,
            duration: Math.round((step.duration as number) / 60),
          };
        });
      }
    }

    // Step 4: LLM analysis — try OpenRouter first, then NVIDIA NIM fallback
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const nimKey = Deno.env.get("NVIDIA_NIM_API_KEY");
    let aiAnalysis = null;

    const llmPrompt = `You are a Wari pilgrimage route advisor for VariSetu. Analyze this route:

Origin: ${originAddress} (${origin[0]}, ${origin[1]})
Destination: ${destAddress} (${destination[0]}, ${destination[1]})
Distance: ${routeSummary.distanceKm} km
Estimated time: ${routeSummary.durationMin} minutes
Walking steps: ${routeSummary.steps.length}

Provide:
1. A brief safety assessment (1-2 sentences)
2. Key landmarks or waypoints to watch for
3. Any safety tips for this specific route
4. Whether this route is suitable for elderly pilgrims

Keep response under 150 words. Be practical and specific.`;

    // Try OpenRouter first
    if (openrouterKey && routeSummary.distanceKm) {
      try {
        const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://varisetu.app",
            "X-Title": "VariSetu Route Advisor",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct:free",
            messages: [{ role: "user", content: llmPrompt }],
            max_tokens: 250,
            temperature: 0.3,
          }),
        });

        if (llmRes.ok) {
          const llmData = await llmRes.json();
          aiAnalysis = llmData.choices?.[0]?.message?.content || null;
        }
      } catch (e) {
        console.error("OpenRouter failed, trying NVIDIA NIM:", e);
      }
    }

    // Fallback: NVIDIA NIM
    if (!aiAnalysis && nimKey && routeSummary.distanceKm) {
      try {
        const nimRes = await fetch(
          "https://integrate.api.nvidia.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${nimKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "meta/llama-3.1-8b-instruct",
              messages: [{ role: "user", content: llmPrompt }],
              max_tokens: 250,
              temperature: 0.3,
            }),
          },
        );

        if (nimRes.ok) {
          const nimData = await nimRes.json();
          aiAnalysis = nimData.choices?.[0]?.message?.content || null;
        }
      } catch (e) {
        console.error("NVIDIA NIM also failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        ...routeSummary,
        aiAnalysis,
        source: "varisetu-route-advisor",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
