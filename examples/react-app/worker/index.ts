interface Env {
  MESSAGE: string;
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      return Response.json({
        ok: true,
        message: env.MESSAGE,
        runtime: "cloudflare-worker",
      });
    }

    return new Response("React client assets are emitted by Rsbuild.", {
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  },
} satisfies ExportedHandler<Env>;
