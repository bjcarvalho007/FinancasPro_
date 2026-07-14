import serverApp from "../dist-server/server.cjs";

const app = (serverApp as any).default || serverApp;

export default app;
