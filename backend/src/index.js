import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { connectDB } from './db.js';

await connectDB();

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => ({}),
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST', 'OPTIONS'] },
});

console.log(`SpeedLens Pro API ready at ${url}`);
