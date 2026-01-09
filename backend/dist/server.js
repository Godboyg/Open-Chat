import { Elysia } from 'elysia';
import { node } from '@elysiajs/node';
const app = new Elysia({ adapter: node() })
    .get('/', () => 'Hello Elysia')
    .listen(5000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
});
//# sourceMappingURL=server.js.map