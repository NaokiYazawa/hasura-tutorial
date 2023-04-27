import { subscriptionExchange, ExchangeInput } from "@urql/core";
import { withUrqlClient } from "next-urql";
import { createClient as createWSClient } from "graphql-ws";
import { ExchangeIO, createClient } from "urql";
import { cacheExchange, fetchExchange } from "urql";

const isServerSide = typeof window === "undefined";

const wsClient = () =>
  createWSClient({
    url: (process.env.NEXT_PUBLIC_HASURA_PROJECT_ENDPOINT as string).replace(
      "http",
      "ws"
    ),
    connectionParams: async () => {
      return isServerSide
        ? {
            headers: {
              "x-hasura-admin-secret": process.env
                .HASURA_ADMIN_SECRET as string,
            },
          }
        : {};
    },
  });

const noopExchange = ({ forward }: ExchangeInput): ExchangeIO => {
  return (operations$) => {
    const operationResult$ = forward(operations$);
    return operationResult$;
  };
};

const subscribeOrNoopExchange = () =>
  isServerSide
    ? noopExchange
    : subscriptionExchange({
        forwardSubscription: (operation) => {
          const input = { ...operation, query: operation.query || "" };
          return {
            subscribe: (sink) => ({
              unsubscribe: wsClient().subscribe(input, sink),
            }),
          };
        },
      });

const clientConfig = {
  url: process.env.NEXT_PUBLIC_HASURA_PROJECT_ENDPOINT as string,
  fetchOptions: () => {
    return isServerSide
      ? {
          headers: {
            "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET as string,
          },
        }
      : {};
  },
  exchanges: [cacheExchange, fetchExchange, subscribeOrNoopExchange()],
};

export const client = createClient(clientConfig);

export default withUrqlClient((ssrExchange) => ({
  url: process.env.NEXT_PUBLIC_HASURA_PROJECT_ENDPOINT as string,
  exchanges: [...clientConfig.exchanges, ssrExchange],
}));
