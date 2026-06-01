export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(_, _env, _ctx) {
    console.log("TEST WORKER CALLED");
    return new Response("OK");
  }
}
